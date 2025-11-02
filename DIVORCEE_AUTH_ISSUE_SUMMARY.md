# Divorcee Dashboard Authentication Issue - Summary

## 🔍 Problem Identified

When trying to access the divorcee dashboard using dev authentication, users get a database error:
```
null value in column "role" of relation "app_users" violates not-null constraint
```

## 🎯 Root Cause

There are **THREE** issues working together:

### Issue 1: UUID Mismatch
- **Frontend** sends: `x-dev-user-id: 22222222-2222-2222-2222-222222222222` (Bob's real UUID)
- **Backend receives**: The header correctly via `devAuth.js` middleware
- **Backend generates**: `7f375563-afed-5e4e-b95a-8c87676cd3de` (UUIDv5 from email)
- **Why**: The `x-dev-user-id` header is being read, but the UUID validation is failing somehow

### Issue 2: Missing User in Database
- Bob Divorcee exists in `app_users` with UUID `22222222-2222-2222-2222-222222222222`
- The generated UUID `7f375563-afed-5e4e-b95a-8c87676cd3de` does NOT exist in database
- When `/api/users/me` tries to find this UUID, it fails
- It then tries to INSERT a new user with only `user_id` and `email`

### Issue 3: Database Constraint Violation
- The `app_users.role` column has a NOT NULL constraint
- When `ensureProfile` tries to create a new user, it only sets `user_id` and `email`
- The `role` field is left as NULL → constraint violation

## 📊 Call Flow

```
1. Browser → Frontend apiClient.js
   ✅ Sets localStorage: user_id='22222222-2222-2222-2222-222222222222'
   ✅ Sends headers: x-dev-user-id='22222222-2222-2222-2222-222222222222'
   ✅ Sends headers: x-dev-email='bob@example.com'
   ✅ Sends token: 'dev-fake-token'

2. Backend → devAuth.js middleware
   ✅ Receives headers: x-dev-user-id, x-dev-email
   ❌ PROBLEM: Generates UUIDv5 instead of using provided UUID
   ❌ Sets req.user.id = '7f375563-afed-5e4e-b95a...' (WRONG!)

3. Backend → /api/users/me → ensureProfile()
   ❌ Queries for UUID '7f375563-afed-5e4e-b95a...'
   ❌ Not found in database
   ❌ Tries to INSERT new user with NULL role
   💥 Database constraint violation
```

## 🔧 Diagnostic Logs Added

### Frontend (`apiClient.js`)
```javascript
console.log('[apiClient] Dev mode - user from localStorage:', user);
console.log('[apiClient] Set x-dev-email:', user.email);
console.log('[apiClient] Set x-dev-user-id:', user.user_id);
```
**Result**: ✅ Confirmed headers ARE being sent correctly

### Backend (`devAuth.js`)
```javascript
console.log('[devAuth] Headers:', { headerId, email, role, isValidUuid: isUuid(headerId || '') });
console.log('[devAuth] Computed userId:', userId, 'from', isUuid(headerId || '') ? 'headerId' : 'email');
console.log('[devAuth] Set req.user:', req.user);
```
**Result**: ⏳ Need to run server and check if UUID validation is working

## 🐛 Suspected Bug in devAuth.js

Current code (line 17):
```javascript
const userId = isUuid(headerId || '') ? headerId : uuidv5(String(email || 'dev@example.com'), namespace);
```

**Theory**: The `isUuid()` validation might be failing for the provided UUID, causing it to fall back to generating from email.

Possible reasons:
1. Header value has extra whitespace
2. Header value is being stringified incorrectly
3. The `validate` function from `uuid` package has strict requirements
4. Header case sensitivity (using `req.header()` vs `req.headers[]`)

## ✅ Solution Options

### Option A: Fix UUID Validation (Preferred)
Add logging to see why `isUuid(headerId)` returns false:
```javascript
const headerId = req.header('x-dev-user-id');
console.log('[devAuth] Raw header:', { headerId, type: typeof headerId, length: headerId?.length });
console.log('[devAuth] Is valid UUID?', isUuid(headerId || ''));
```

### Option B: Always Trust x-dev-user-id
If header is provided, use it without validation:
```javascript
const headerId = req.header('x-dev-user-id');
const userId = headerId || uuidv5(String(email || 'dev@example.com'), namespace);
```

### Option C: Fix ensureProfile to Set Default Role
Make the INSERT statement include a default role:
```javascript
const ins = await pool.query(
  `INSERT INTO app_users(user_id, email, role) VALUES($1,$2,$3)
   RETURNING user_id, email, name, preferred_name, phone, address, avatar_url, role, created_at, updated_at`,
  [userId, email || null, 'divorcee']  // Add default role
);
```

## 📝 Next Steps

1. **Restart servers** with logging enabled: `npm run start`
2. **Refresh browser** with localStorage set
3. **Check terminal** for `[devAuth] Headers:` logs
4. **Verify** if `isValidUuid` is `true` or `false`
5. **Apply appropriate fix** based on logs

## 🎯 Expected Outcome

After fix:
```
[devAuth] Headers: { 
  headerId: '22222222-2222-2222-2222-222222222222',
  email: 'bob@example.com',
  role: 'divorcee',
  isValidUuid: true  ← Should be TRUE
}
[devAuth] Computed userId: 22222222-2222-2222-2222-222222222222 from headerId
[devAuth] Set req.user: {
  id: '22222222-2222-2222-2222-222222222222',
  email: 'bob@example.com',
  role: 'divorcee',
  name: 'bob',
  dev: true
}
[users:me:get] OK { userId: '22222222-2222-2222-2222-222222222222', role: 'divorcee' }
```

Then the divorcee dashboard should load successfully! 🎉

## 📂 Modified Files

1. ✅ `frontend/src/lib/apiClient.js` - Added dev headers support
2. ✅ `backend/src/middleware/devAuth.js` - Added diagnostic logging
3. ✅ `backend/src/middleware/authenticateUser.js` - Added logging (not being used)
4. ✅ `backend/src/routes/dashboard.js` - Fixed case_status query bug
5. 📄 `fix-bob-role.js` - Created diagnostic script (Bob's role is correct)
6. 📄 `dev-login.html` - Updated with correct UUIDs

## 🔗 Related Documentation

- `DIVORCEE_SECTION_ANALYSIS_COMPLETE.md` - Full system analysis
- `DIVORCEE_TESTING_GUIDE.md` - Testing procedures
- `CONSOLE_LOGIN_DIVORCEE.md` - Browser console login method
