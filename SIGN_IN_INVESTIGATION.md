# Sign In / Register Investigation Report

**Date:** October 13, 2025

## Summary
Deep dive investigation into why sign in and register buttons don't work.

## Findings

### ✅ Backend Status: **WORKING**
- **Port:** 4000
- **Entry Point:** `backend/src/index.js` (correct)
- **Auth Routes:** Mounted at both `/auth` and `/api/auth`
- **Login Endpoint Test:** SUCCESS ✅
  - Tested: `POST http://localhost:4000/api/auth/login`
  - Credentials: admin@test.com / admin123
  - Response: Token returned successfully

### ✅ Frontend Status: **RUNNING**
- **Port:** 5173
- **Environment:** `.env` correctly configured with `VITE_API_BASE=http://localhost:4000`

### 🔍 Code Analysis

#### Authentication Flow:
1. **SignInForm** (`frontend/src/pages/SignInForm.jsx`)
   - Uses `useAuth()` hook
   - Calls `login(email, password)`
   - Navigates to `/dashboard` on success
   - Shows error message on failure

2. **RegisterForm** (`frontend/src/pages/RegisterForm.jsx`)
   - Uses `useAuth()` hook
   - Calls `register(email, password, name, role)`
   - Navigates to `/dashboard` on success
   - Shows error message on failure

3. **AuthContext** (`frontend/src/context/AuthContext.jsx`)
   - `login()` function calls `apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })`
   - `register()` function calls `apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name, role }) })`
   - Stores token in localStorage with key `auth_token`
   - Fetches user profile via `/api/users/me` after login

4. **API Client** (`frontend/src/lib/apiClient.js`)
   - Uses `import.meta.env.VITE_API_BASE` as base URL
   - Adds `Authorization: Bearer {token}` header
   - Dispatches `app:unauthorized` event on 401

## Potential Issues Identified

### Issue #1: Form Submission Not Triggering
**Symptoms:**
- Buttons appear but clicking does nothing
- No network requests visible in browser DevTools
- No errors in console

**Possible Causes:**
1. **JavaScript Error Before Handler:** Check browser console (F12) for errors
2. **Event Prevented:** Another component might be preventing form submission
3. **React Not Loaded:** Bundle might not be loading correctly
4. **Button Disabled State:** Check if button is in disabled state

### Issue #2: Network Request Failing Silently
**Symptoms:**
- Button appears to work (shows loading state)
- No error message displayed
- Request fails in network tab

**Possible Causes:**
1. **CORS Error:** Backend not allowing frontend origin
2. **Wrong URL:** API base URL might be malformed
3. **Request Blocked:** Browser extension or firewall blocking request

### Issue #3: Token Not Being Saved
**Symptoms:**
- Login appears to succeed
- Page redirects but immediately goes back to login
- User state not persisting

**Possible Causes:**
1. **localStorage Not Working:** Privacy mode or browser restriction
2. **Token Format Invalid:** Backend returning wrong token format
3. **Profile Fetch Failing:** `/api/users/me` endpoint failing after login

## Diagnostic Steps

### Step 1: Check Browser Console
Open DevTools (F12) and check:
1. **Console Tab:** Look for any JavaScript errors
2. **Network Tab:** Check if requests are being made to `/api/auth/login`
3. **Application Tab → Local Storage:** Check if `auth_token` is being saved

### Step 2: Test Login Flow Manually
1. Go to http://localhost:5173/signin
2. Open DevTools (F12) → Console
3. Type: `localStorage.clear()` and press Enter
4. Enter credentials: admin@test.com / admin123
5. Click "Sign In"
6. Watch for:
   - Console errors
   - Network requests (Network tab, filter by "login")
   - Error message on page

### Step 3: Check Network Requests
In DevTools → Network tab:
1. Clear network log
2. Try to sign in
3. Look for request to `localhost:4000/api/auth/login`
4. Check request details:
   - **Request Headers:** Content-Type should be application/json
   - **Request Payload:** Should have email and password
   - **Response:** Should have status 200 and contain token

### Step 4: Manual API Test in Console
Open browser console and run:
```javascript
// Test login directly
fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
})
.then(r => r.json())
.then(data => console.log('Login Response:', data))
.catch(err => console.error('Login Error:', err))
```

## Test Credentials

### Admin User
- **Email:** admin@test.com
- **Password:** admin123
- **Role:** admin

### Mediator User
- **Email:** mediator@test.com
- **Password:** med123
- **Role:** mediator

### Lawyer User
- **Email:** lawyer@test.com
- **Password:** law123
- **Role:** lawyer

### Divorcee User
- **Email:** divorcee@test.com
- **Password:** div123
- **Role:** divorcee

## Expected Behavior

### Successful Login:
1. User enters credentials
2. Clicks "Sign In" button
3. Button shows "Signing in..." (loading state)
4. Request sent to `POST http://localhost:4000/api/auth/login`
5. Backend returns `{ ok: true, token: "..." }`
6. Frontend saves token to localStorage
7. Frontend calls `GET http://localhost:4000/api/users/me` with token
8. User profile loaded
9. Redirect to `/dashboard` which becomes role-specific dashboard
10. Sidebar shows with user info

### Failed Login (Wrong Password):
1. User enters credentials with wrong password
2. Clicks "Sign In" button
3. Button shows "Signing in..." (loading state)
4. Request sent to `POST http://localhost:4000/api/auth/login`
5. Backend returns `{ ok: false, error: { code: 'INVALID_CREDENTIALS', message: 'invalid email or password' } }`
6. Frontend displays error message: "invalid email or password"
7. User remains on sign in page

## Next Steps

1. **User Action Required:** Open http://localhost:5173/signin in browser
2. Open DevTools (F12)
3. Attempt to sign in with admin@test.com / admin123
4. **Report back with:**
   - Any console errors
   - Network tab showing the request/response
   - What happens when you click the button (does it change to "Signing in..."?)
   - Any error message displayed on the page

## Additional Checks

### Check if Routes Are Mounted Correctly
The routes should be:
- ✅ `/signin` → SignInForm component
- ✅ `/register` → RegisterForm component
- ✅ `/` → HomePage (shows PublicLandingPage when not logged in)

### Check if AuthProvider Wraps App
The `AuthProvider` should wrap all components in App.jsx so the `useAuth()` hook works.

## Known Working:
- ✅ Backend server (port 4000)
- ✅ Frontend server (port 5173)
- ✅ Login endpoint (`/api/auth/login`)
- ✅ Test user exists in database
- ✅ Password hash verification working
- ✅ JWT token generation working

## Unknown/Need Testing:
- ❓ Does clicking "Sign In" button trigger the form submit?
- ❓ Are network requests being made?
- ❓ Are there JavaScript errors in console?
- ❓ Is the error message being displayed if login fails?

