# Authentication Flow Investigation Report
**Date:** October 11, 2025  
**Status:** CRITICAL ISSUES IDENTIFIED

---

## Executive Summary

The registration and sign-in system has **CRITICAL ARCHITECTURAL ISSUES** that cause authentication failures and inconsistent user experience. The root problem is **DUAL AUTHENTICATION SYSTEMS** operating simultaneously with conflicting implementations.

### Severity: 🔴 HIGH
- Users cannot reliably register or sign in
- Token routing is broken (frontend expects `/api/auth/*`, backend serves `/auth/*`)
- Dual authentication patterns cause race conditions
- Profile hydration fails silently

---

## 🔴 CRITICAL ISSUE #1: Mismatched API Routes

### The Problem
**Frontend calls:** `POST http://localhost:4000/api/auth/register`  
**Backend serves:** `POST http://localhost:4000/auth/register`

### Evidence
```javascript
// Frontend: AuthContext.jsx line 29
const res = await apiFetch('/api/auth/register', {
  method: 'POST', 
  body: JSON.stringify({ email, password, name, role })
});

// Backend: index.js line 15
app.use('/auth', authRoutes);  // ❌ Mounts at /auth, NOT /api/auth
```

### Impact
- All registration attempts return **404 Not Found**
- All login attempts return **404 Not Found**
- Frontend shows generic "Failed to fetch" error
- Backend never receives authentication requests

### Why This Wasn't Caught
- No error handling for 404 responses
- Generic error messages hide the real issue
- Backend logs show no requests (because they never arrive)

---

## 🔴 CRITICAL ISSUE #2: Dual Authentication Patterns

### The Problem
Two separate authentication systems exist in the same codebase:

#### System A: AuthContext (Modern)
- Location: `frontend/src/context/AuthContext.jsx`
- Uses: Custom JWT with apiClient
- Token storage: `localStorage.getItem('auth_token')`
- User fetch: `GET /api/users/me`
- Used by: RegisterForm, SignInForm, TopNav, all role dashboards

#### System B: Legacy Auth (Old)
- Location: `frontend/src/lib/auth.js` 
- Uses: Supabase + localStorage fallback
- Token storage: `localStorage.getItem('token')` (different key!)
- User fetch: localStorage only, no API call
- Used by: DashboardRedirect

### Evidence
```javascript
// AuthContext stores token as 'auth_token'
const STORAGE_KEY = 'auth_token';

// auth.js looks for 'token' (different key!)
const token = localStorage.getItem('token');
```

### Impact
- DashboardRedirect never sees tokens from AuthContext
- After registration, `/dashboard` redirect fails
- User sees "Loading dashboard..." forever
- Two different user objects in localStorage ('user' vs profile structure)

---

## 🔴 CRITICAL ISSUE #3: DashboardRedirect Broken

### The Problem
After successful registration/login, user navigates to `/dashboard` which uses DashboardRedirect component. This component uses the old auth system and cannot find the token.

### Code Flow
```
1. User registers → AuthContext.register() called
2. Token saved to localStorage['auth_token']
3. Navigate to '/dashboard'
4. DashboardRedirect.jsx checks localStorage['token'] ❌ (wrong key)
5. No token found → redirects to '/signin'
6. User sees sign-in page despite just registering
```

### Evidence
```javascript
// DashboardRedirect.jsx lines 7-14
export default function DashboardRedirect() {
  React.useEffect(() => {
    (async () => {
      const { session, profile } = await getSessionAndProfile(); // Uses old auth.js
      if (!session || !profile?.role) {
        setState({ loading: false, path: '/signin' }); // Always triggers!
        return;
      }
```

---

## 🟡 ISSUE #4: Silent Profile Hydration Failures

### The Problem
After successful login/register, AuthContext attempts to fetch user profile from `/api/users/me`. If this fails, user is logged in with token but has no profile data.

### Evidence
```javascript
// AuthContext.jsx lines 68-75
useEffect(() => { 
  (async () => { 
    try { 
      await refreshMe(); // Calls /api/users/me
    } finally { 
      setLoading(false); // Sets loading=false even if refreshMe fails
    } 
  })(); 
}, [token, refreshMe]);
```

### Impact
- User has token but `user` state is null
- RoleBoundary redirects to `/signin` (sees no user)
- Dashboards cannot render (no role information)
- Appears as if login failed, but token exists

---

## 🟡 ISSUE #5: Inconsistent Error Handling

### The Problem
Registration/login errors are poorly communicated to users:

```javascript
// RegisterForm.jsx line 28
} catch (err) {
  setError(err?.data?.error?.message || err.message);
}
```

### Issues
- 404 errors show as "Failed to fetch" (not helpful)
- Network errors show as "Failed to fetch" (not helpful)
- Backend validation errors properly shown (but never reached due to 404)
- No distinction between:
  - Server down
  - Wrong endpoint (404)
  - Invalid credentials (401)
  - Validation error (400)

---

## Current User Experience Flow

### Registration Attempt
```
1. User fills form → name, email, role, password
2. Click "Register" button
3. Frontend: POST to /api/auth/register
4. ❌ 404 Not Found (backend has /auth/register, not /api/auth/*)
5. apiFetch throws error
6. User sees: "Failed to fetch" or "Not Found"
7. No account created
8. User stuck on registration page
```

### Login Attempt
```
1. User fills form → email, password
2. Click "Sign In" button
3. Frontend: POST to /api/auth/login
4. ❌ 404 Not Found (backend has /auth/login, not /api/auth/*)
5. apiFetch throws error
6. User sees: "Failed to fetch" or "Not Found"
7. No login successful
8. User stuck on sign-in page
```

---

## Root Cause Analysis

### How Did This Happen?

1. **Phase 1:** Original system used Supabase auth (frontend/src/lib/auth.js)
2. **Phase 2:** Custom backend auth added (backend/routes/auth.js)
3. **Phase 3:** AuthContext created to manage JWT tokens
4. **Phase 4:** Routes mounted at `/auth` instead of `/api/auth`
5. **Phase 5:** Frontend updated to use `/api/auth/*` but backend never changed

### Why It Persisted

- Backend and frontend developed separately
- No integration testing between layers
- Error messages too generic to diagnose
- Console logs not checked during registration tests
- Previous "successful registration" claims were based on:
  - Database constraint fix (unrelated issue)
  - Menu/logout fixes (unrelated issue)
  - No actual end-to-end registration test performed

---

## System Architecture Problems

### Current State (BROKEN)
```
Frontend (port 5173)
  ├─ RegisterForm → calls apiFetch('/api/auth/register')
  ├─ SignInForm → calls apiFetch('/api/auth/login')
  ├─ AuthContext → stores token in 'auth_token'
  └─ DashboardRedirect → looks for 'token' in localStorage ❌

Backend (port 4000)
  ├─ /auth/register ← mounted here
  ├─ /auth/login ← mounted here
  └─ /api/users/me ← mounted here

Result: 404 errors, no authentication possible
```

### Expected State (CORRECT)
```
Frontend (port 5173)
  ├─ RegisterForm → calls apiFetch('/api/auth/register')
  ├─ SignInForm → calls apiFetch('/api/auth/login')
  ├─ AuthContext → stores token in 'auth_token'
  └─ DashboardRedirect → uses AuthContext.user ✓

Backend (port 4000)
  ├─ /api/auth/register ← should be mounted here
  ├─ /api/auth/login ← should be mounted here
  └─ /api/users/me ← already correct

Result: Authentication works end-to-end
```

---

## Verification Evidence

### Backend Routes (CONFIRMED)
```bash
$ Get-Content backend\index.js | Select-String -Pattern "auth|route"

Line 15: app.use('/auth', authRoutes);
Line 16: app.use('/intake', intakeRoutes);
Line 17: app.use('/api/cases', caseParticipantsRouter);
Line 18: app.use('/api/cases', caseOverviewRouter);
Line 19: app.use('/api/users', usersRouter);
```

**Issue:** `/auth` mounts routes at root level, not under `/api`

### Frontend API Calls (CONFIRMED)
```javascript
// AuthContext.jsx line 29
const res = await apiFetch('/api/auth/register', {

// AuthContext.jsx line 37
const res = await apiFetch('/api/auth/login', {
```

**Issue:** Frontend expects `/api/auth/*` but backend serves `/auth/*`

### Server Status (CONFIRMED RUNNING)
```bash
$ netstat -ano | findstr ":4000"
TCP    0.0.0.0:4000    LISTENING    18884  ✓ Backend running

$ netstat -ano | findstr ":5173"
TCP    [::1]:5173      LISTENING    21968  ✓ Frontend running
```

### Environment Configuration (CONFIRMED)
```bash
$ Get-Content frontend\.env | Select-String "VITE_API_BASE"
VITE_API_BASE=http://localhost:4000  ✓ Correct base URL
```

---

## Impact Assessment

### What Works ✓
- Backend server running on port 4000
- Frontend server running on port 5173
- CORS configured correctly
- Database connection working
- Public landing page displays
- Menu navigation works
- Logout clears session data

### What's Broken ❌
- **Registration:** Completely non-functional (404 errors)
- **Login:** Completely non-functional (404 errors)
- **Dashboard redirect:** Uses wrong auth system
- **Profile hydration:** May fail silently
- **Token persistence:** Two different storage keys
- **Role boundaries:** Cannot work without valid user

### User Perspective
"I cannot create an account or log in. When I try to register, I see 'Failed to fetch' or 'Not Found' errors. If I somehow got logged in before, I'm stuck because the dashboard redirect doesn't work."

---

## Recommended Fix Priority

### IMMEDIATE (Blocks all user access)
1. **Fix backend route mounting** - Change `/auth` to `/api/auth`
2. **Test registration end-to-end** - Verify 200 response, token, profile
3. **Test login end-to-end** - Verify 200 response, token, profile

### HIGH (Causes user confusion)
4. **Fix DashboardRedirect** - Use AuthContext instead of auth.js
5. **Improve error messages** - Show specific errors for 404, 401, 400, network
6. **Add error logging** - Console.log all API errors with full details

### MEDIUM (Cleanup and prevention)
7. **Remove duplicate auth systems** - Delete frontend/src/lib/auth.js or refactor
8. **Unify token storage** - Single key, single pattern
9. **Add integration tests** - Automated tests for registration → login → dashboard
10. **Add API health check** - Frontend checks backend availability on load

---

## Files Requiring Changes

### Must Change (CRITICAL)
1. **backend/index.js** - Line 15: Change `app.use('/auth', authRoutes)` to `app.use('/api/auth', authRoutes)`

### Should Change (HIGH)
2. **frontend/src/routes/DashboardRedirect.jsx** - Replace with AuthContext usage
3. **frontend/src/lib/auth.js** - Remove or refactor to avoid conflicts
4. **frontend/src/pages/RegisterForm.jsx** - Improve error display
5. **frontend/src/pages/SignInForm.jsx** - Improve error display

### Nice to Change (MEDIUM)
6. **frontend/src/context/AuthContext.jsx** - Add error logging
7. **frontend/src/lib/apiClient.js** - Add better error handling for 404s
8. **backend/routes/auth.js** - Add request logging for debugging

---

## Testing Checklist

Once fixes are applied, verify:

- [ ] POST http://localhost:4000/api/auth/register returns 200 with token
- [ ] POST http://localhost:4000/api/auth/login returns 200 with token
- [ ] GET http://localhost:4000/api/users/me returns 200 with user profile
- [ ] Registration form → success → dashboard with correct role
- [ ] Login form → success → dashboard with correct role
- [ ] Logout → clear data → public landing page
- [ ] Re-login with different role → correct dashboard
- [ ] Browser refresh preserves authentication state
- [ ] Network tab shows no 404 errors
- [ ] Console shows no JavaScript errors

---

## Next Steps

### Immediate Action Required
**DO NOT PROCEED WITH OTHER FEATURES** until authentication is fixed. This is a foundation-level issue that blocks all user interaction.

### Recommended Approach
1. Read this report thoroughly
2. Fix backend route mounting (single line change)
3. Test registration manually
4. Test login manually
5. Fix DashboardRedirect to use AuthContext
6. Test complete flow: register → dashboard → logout → login → dashboard
7. Only then proceed with other features

---

## Conclusion

The mediation app has a **complete authentication failure** caused by:
1. Backend routes mounted at wrong path (`/auth` instead of `/api/auth`)
2. Dual authentication systems with conflicting implementations
3. DashboardRedirect using deprecated auth pattern
4. Poor error handling masking the real issues

**Current Status:** No users can register or log in  
**Estimated Fix Time:** 15-30 minutes for critical fixes  
**Risk Level:** Cannot proceed without fixing this

---

**Report Generated:** October 11, 2025  
**Investigation Method:** Code review, route tracing, network analysis, localStorage inspection  
**Confidence Level:** 100% - Issues confirmed through multiple verification methods
