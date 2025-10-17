# Manual Testing Guide - Token Flow

## Prerequisites

**Start Backend:**
```powershell
npm run dev --prefix backend
```

**Start Frontend:**
```powershell
npm run dev --prefix frontend
```

---

## Test 1: Register New User

### Steps
1. Navigate to http://localhost:5173/register
2. Fill in the form:
   - **Name**: Test User
   - **Email**: test@example.com
   - **Password**: Test123!
   - **Role**: Divorcee (or any role)
3. Click **Register**

### Expected Result
✅ Redirects to `/divorcee` (or role-specific route)
✅ User remains logged in (check browser console for no errors)

### Verify in DevTools
1. Open DevTools (F12)
2. Go to **Application** → **Local Storage** → `http://localhost:5173`
3. Should see:
   - `token`: JWT string with 3 parts (xxx.yyy.zzz)
   - `user`: JSON object with id, email, name, role

---

## Test 2: Refresh Persistence

### Steps
1. After successful registration/login
2. Navigate to any page (e.g., `/profile`)
3. Press **F5** to refresh

### Expected Result
✅ User stays logged in
✅ Profile data still visible
✅ No redirect to login page

### Check Console
- Should see `[auth] profile hydrate` log (or similar)
- No 401 errors

---

## Test 3: Login Existing User

### Steps
1. Navigate to http://localhost:5173/signin
2. Enter credentials from Test 1
3. Click **Login**

### Expected Result
✅ Redirects to role-specific route (`/divorcee`, `/mediator`, etc.)
✅ Profile loads correctly
✅ Token stored in localStorage

---

## Test 4: 401 Auto-Logout

### Steps
1. Login successfully
2. Open DevTools → **Application** → **Local Storage**
3. Edit the `token` value to corrupt it (e.g., change last character)
4. Navigate to any protected page or trigger an API call

### Expected Result
✅ Automatically logged out
✅ Redirected to `/signin`
✅ Console shows: `[App] 401 detected globally, logging out`
✅ Token removed from localStorage

---

## Test 5: Role-Based Routing

### Test Each Role

**Admin:**
- Register with role `admin`
- Should redirect to `/admin`

**Mediator:**
- Register with role `mediator`
- Should redirect to `/mediator`

**Lawyer:**
- Register with role `lawyer`
- Should redirect to `/lawyer`

**Divorcee:**
- Register with role `divorcee`
- Should redirect to `/divorcee`

---

## Test 6: Profile Update

### Steps
1. Login
2. Navigate to `/profile`
3. Update any field (name, phone, etc.)
4. Save changes

### Expected Result
✅ Changes saved successfully
✅ Updated data visible immediately
✅ Refresh → changes persist

---

## Test 7: Token Auto-Injection

### Check Network Tab

1. Login
2. Open DevTools → **Network** tab
3. Trigger any API call (navigate to protected page, update profile, etc.)
4. Click on the request
5. Check **Request Headers**

### Expected Result
✅ `Authorization: Bearer eyJhbGci...` header present on all `/api/*` requests
✅ No manual header injection needed

---

## Troubleshooting

### Issue: "Registration failed"
**Check:**
- Backend running on port 4000?
- Run: `Invoke-RestMethod http://localhost:4000/healthz`
- Check backend console for errors

### Issue: Logged out immediately after login
**Check:**
- Token format in localStorage (should be JWT: xxx.yyy.zzz)
- Backend console for JWT verification errors
- Ensure `DEV_JWT_SECRET` is set in backend `.env`

### Issue: 401 on every request
**Check:**
- Frontend console: Token should be auto-injected
- Backend logs: Should show `[auth] bypass via devAuth` or JWT verification
- Ensure migrations applied (user_id column exists)

### Issue: Profile not loading
**Check:**
- `/api/users/me` returns 200 (check Network tab)
- Response has `{ ok: true, user: {...} }`
- Backend console for `[users:me:get]` logs

---

## Quick Automated Test

Run the PowerShell test script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-token-flow.ps1
```

This will:
1. Register a new user via API
2. Fetch profile with token
3. Update profile
4. Login again
5. Test 401 handling

All tests should pass if token flow is working correctly.

---

## Success Criteria

✅ Register → JWT token stored → profile loaded → redirected by role
✅ Refresh → session persists
✅ Login → new token → profile loaded
✅ Invalid token → auto-logout → redirect to /signin
✅ All API calls auto-inject Authorization header
✅ No dev headers (`x-dev-email`, etc.) used in frontend
