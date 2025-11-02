# 🔧 DEV LOGIN FIX - DIVORCEE REDIRECT ISSUE

**Issue:** Dev login was redirecting divorcee users to mediator dashboard  
**Status:** ✅ FIXED  
**Date:** October 23, 2025

---

## 🐛 Problems Found & Fixed

### Problem 1: Wrong Storage Key
**Issue:** Dev login stored token as `'token'` but AuthContext looks for `'auth_token'`
**Fix:** Now stores as both `'auth_token'` (primary) and `'token'` (backup)

### Problem 2: Placeholder UUID
**Issue:** Divorcee user had fake UUID `'dev-divorcee-uuid'` instead of real database ID
**Fix:** Updated to use Bob's real UUID: `'22222222-2222-2222-2222-222222222222'`

### Problem 3: Missing user_id Field
**Issue:** User object didn't have `user_id` field that frontend expects
**Fix:** Added `user_id` field to divorcee user object

### Problem 4: Wrong Case ID
**Issue:** Generic case ID didn't match divorcee's actual case
**Fix:** Set to Bob's real case ID: `'3bcb2937-0e55-451a-a9fd-659187af84d4'`

---

## 🔧 Changes Made

### File: `dev-login.html`

**Before:**
```javascript
divorcee: {
    id: 'dev-divorcee-uuid',  // ❌ Fake UUID
    email: 'divorcee@dev.local',
    name: 'Dev Divorcee',
    role: 'divorcee'
}

localStorage.setItem('token', 'dev-fake-token');  // ❌ Wrong key
localStorage.setItem('activeCaseId', '4');  // ❌ Wrong case
```

**After:**
```javascript
divorcee: {
    id: '22222222-2222-2222-2222-222222222222',  // ✅ Real UUID
    email: 'bob@example.com',  // ✅ Real email
    name: 'Bob Divorcee',
    role: 'divorcee',
    user_id: '22222222-2222-2222-2222-222222222222'  // ✅ Added
}

localStorage.clear();  // ✅ Clear old data first
localStorage.setItem('auth_token', 'dev-fake-token');  // ✅ Correct key
localStorage.setItem('token', 'dev-fake-token');  // ✅ Backup
localStorage.setItem('activeCaseId', '3bcb2937-0e55-451a-a9fd-659187af84d4');  // ✅ Bob's case
```

---

## 🧪 How to Test Again

### Step 1: Clear Your Browser
**Important!** Clear old localStorage data:
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Click **Local Storage** → `http://localhost:5173`
4. Click **Clear All** button (🗑️)
5. Close DevTools

### Step 2: Close and Reopen dev-login.html
1. Close the dev-login browser tab
2. Open fresh: Double-click `c:\mediation-app\dev-login.html`

### Step 3: Login as Divorcee
1. Click **👤 Divorcee** button
2. Click **"Login as Divorcee"** button
3. Wait for redirect (2 seconds)

### Step 4: Verify Success
You should now see:
- ✅ URL: `http://localhost:5173/divorcee`
- ✅ Welcome message: "Welcome back, Bob Divorcee!"
- ✅ Divorcee dashboard with documents panel

---

## 🎯 Expected Flow Now

```
1. Click dev-login.html
   ↓
2. Select Divorcee role
   ↓
3. localStorage gets set:
   - auth_token: 'dev-fake-token'
   - user: {
       id: '22222222-2222-2222-2222-222222222222',
       user_id: '22222222-2222-2222-2222-222222222222',
       email: 'bob@example.com',
       name: 'Bob Divorcee',
       role: 'divorcee'
     }
   - activeCaseId: '3bcb2937-0e55-451a-a9fd-659187af84d4'
   ↓
4. Redirects to http://localhost:5173
   ↓
5. AuthContext reads auth_token
   ↓
6. Calls /api/users/me with dev token
   ↓
7. Backend recognizes dev mode
   ↓
8. Returns Bob's user data
   ↓
9. DashboardRedirect checks user.role
   ↓
10. Sees role='divorcee'
    ↓
11. Redirects to /divorcee ✅
```

---

## 🔍 Debugging If It Still Fails

### Check localStorage
Press F12 → Console, then type:
```javascript
console.log('auth_token:', localStorage.getItem('auth_token'));
console.log('user:', JSON.parse(localStorage.getItem('user')));
console.log('activeCaseId:', localStorage.getItem('activeCaseId'));
```

**Expected output:**
```javascript
auth_token: "dev-fake-token"
user: {
  id: "22222222-2222-2222-2222-222222222222",
  user_id: "22222222-2222-2222-2222-222222222222",
  email: "bob@example.com",
  name: "Bob Divorcee",
  role: "divorcee"
}
activeCaseId: "3bcb2937-0e55-451a-a9fd-659187af84d4"
```

### Check Network Calls
1. Press F12 → Network tab
2. Look for `/api/users/me` call
3. Check response - should include user with role='divorcee'

### Check AuthContext
In browser console:
```javascript
// See what AuthContext has
console.log('Current user:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
```

---

## 🆘 Still Having Issues?

### Option 1: Use Regular Sign-In Instead
```
Go to: http://localhost:5173/signin
Email: bob@example.com
Password: Test123!
```

### Option 2: Clear Everything and Try Again
```powershell
# In browser DevTools Console (F12):
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Then reopen dev-login.html

### Option 3: Check Backend Dev Auth
Make sure backend has dev auth enabled:
```
File: backend/.env
DEV_AUTH_ENABLED=true
```

---

## ✅ Verification Checklist

After using dev login, verify:
- [ ] URL is `http://localhost:5173/divorcee` (not /mediator)
- [ ] Welcome message shows "Bob Divorcee"
- [ ] Progress card displays
- [ ] Document panel shows 4 topics
- [ ] localStorage has `auth_token` key
- [ ] localStorage user has `role: 'divorcee'`
- [ ] No console errors

---

## 📝 Summary

**Root Cause:** Dev login was using wrong storage key and fake UUIDs

**Solution:** 
1. Fixed storage key from `'token'` to `'auth_token'`
2. Updated divorcee user to Bob's real database ID
3. Added `user_id` field to user object
4. Set correct case ID for divorcee

**Status:** ✅ Ready to test again

---

**Try it now!** Open a fresh `dev-login.html` and click Divorcee again!

