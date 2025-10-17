# Frontend Token Flow Implementation

## Overview
Complete JWT-based authentication flow with automatic token injection, 401 handling, and session persistence.

## Changes Made

### 1. AuthContext (`frontend/src/context/AuthContext.jsx`)

**Removed:**
- Dev-only `loginLocal()` fake login stub
- `buildDevHeaders()` dev header injection
- Fake token generation (`dev-fake-token`)

**Added:**
- **Module-level token accessor**: `getCurrentToken()` / `setCurrentToken()` for apiClient
- **Real `login(email, password)`**: Calls `/api/auth/login`, stores JWT, hydrates profile
- **Real `register(email, password, name, role)`**: Calls `/api/auth/register`, stores JWT, hydrates profile
- **Token-based init**: On mount, reads `localStorage.token`, validates JWT format, auto-hydrates via `/api/users/me`
- **401 handling in fetchProfile**: Automatically logs out if profile fetch returns 401
- **Enhanced logout**: Clears module-level token reference

**Key Behavior:**
- JWT stored in `localStorage.token`
- User profile cached in `localStorage.user`
- Refresh page → token auto-restored → profile re-fetched
- Invalid/expired token → auto-logout

---

### 2. API Client (`frontend/src/lib/apiClient.js`)

**Added:**
- **Automatic Authorization header injection**: Reads token via `getCurrentToken()`, adds `Bearer <token>` to all requests (unless `skipAuth: true`)
- **Global 401 handler**: `setOn401Callback(fn)` - triggers logout + redirect on any 401 response
- **Enhanced error messages**: Extracts nested `error.message` from backend responses

**Usage:**
```javascript
import { apiFetch } from '../lib/apiClient';

// Token automatically attached
const data = await apiFetch('/api/cases/123');

// Skip auth for public endpoints
const publicData = await apiFetch('/api/public', { skipAuth: true });
```

---

### 3. RegisterForm (`frontend/src/pages/RegisterForm.jsx`)

**Before:**
- Called `/auth/register` (wrong path, no `/api` prefix)
- Checked `body.success` (backend returns `body.ok`)
- Used `loginLocal()` fake dev flow
- Navigated to `/profile` always

**After:**
- Uses `authRegister()` from AuthContext
- Backend call: `/api/auth/register` with JWT response
- Navigates based on role:
  - `admin` → `/admin`
  - `mediator` → `/mediator`
  - `lawyer` → `/lawyer`
  - `divorcee` → `/divorcee`
- Real token stored, profile hydrated

---

### 4. LoginForm (`frontend/src/components/LoginForm.jsx`)

**Before:**
- Called `http://localhost:4000/auth/login` (hardcoded URL)
- Checked `data.success` (backend returns `data.ok`)
- Stored `userId` only
- Navigated to `/dashboard` always

**After:**
- Uses `login()` from AuthContext
- Backend call: `/api/auth/login` with JWT response
- Navigates based on role (same as RegisterForm)
- Full token + profile flow

---

### 5. App Setup (`frontend/src/App.jsx`)

**Added:**
- `<AuthSetup />` component inside `AuthProvider`
- Wires `setOn401Callback` to trigger `logout()` + `navigate('/signin')`
- Ensures any 401 from any API call logs user out cleanly (once)

---

### 6. Backend Register Enhancement (`backend/src/routes/auth.js`)

**Added:**
- Accept `name` and `role` from request body
- Validate role against allowed values (`admin`, `mediator`, `lawyer`, `divorcee`)
- Store name and role in `app_users` during registration
- Include role in JWT payload

**Before:**
```javascript
// Ignored name/role, hardcoded 'divorcee'
await pool.query(`INSERT INTO public.app_users (user_id, email, role) VALUES ($1,$2,'divorcee')...`);
```

**After:**
```javascript
const userRole = role && ['admin','mediator','lawyer','divorcee'].includes(role) ? role : 'divorcee';
await pool.query(`INSERT INTO public.app_users (user_id, email, name, role) VALUES ($1,$2,$3,$4)...`);
const token = jwt.sign({ sub: userId, email, role: userRole }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
```

---

## Definition of Done ✅

### ✅ Refresh keeps session
- Token persisted in `localStorage`
- On page load → token read → profile fetched → user stays logged in

### ✅ 401 anywhere logs you out once, cleanly
- Any API call returning 401 → triggers global callback → `logout()` → redirect `/signin`
- No infinite loops (callback runs once per 401)

### ✅ No code path relies on /auth/* or dev headers from UI
- All forms use `/api/auth/*`
- No `x-dev-email` or `x-dev-user-id` headers from frontend
- Dev headers remain backend-only (via `devAuth` middleware for local testing)

---

## Testing Checklist

1. **Register new user**
   - Navigate to `/register`
   - Fill form → submit
   - Should redirect to role-specific route (e.g., `/divorcee`)
   - Token stored in localStorage
   - Profile visible in DevTools Application → Local Storage

2. **Login existing user**
   - Navigate to `/signin`
   - Enter credentials → submit
   - Should redirect to role route
   - Token stored, profile loaded

3. **Refresh persistence**
   - Login → navigate anywhere
   - Refresh page (F5)
   - Should remain logged in (user state restored)

4. **401 logout**
   - Login → manually corrupt token in localStorage
   - Navigate to protected route or trigger API call
   - Should auto-logout and redirect to `/signin`

5. **Role-based routing**
   - Register as `mediator` → should land on `/mediator`
   - Register as `admin` → should land on `/admin`
   - Register as `divorcee` → should land on `/divorcee`

---

## Migration Notes

### Removed Dependencies
- `ensureDevUuidForEmail` (from RegisterForm)
- `loginLocal` usage (replaced with real `register`)
- Hardcoded backend URLs (`http://localhost:4000/...`)

### Backward Compatibility
- Backend still supports `devAuth` middleware for header-based dev testing
- Scripts like `dev-auth-token.ps1` and `dev-curl-tests.ps1` continue to work
- UI no longer uses dev headers, only real JWT tokens

---

## Architecture

```
┌─────────────────┐
│  User Actions   │
│ (Register/Login)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐      POST /api/auth/register
│  AuthContext    │───────POST /api/auth/login────────┐
│  - register()   │                                    │
│  - login()      │                                    ▼
│  - logout()     │                            ┌──────────────┐
└────────┬────────┘                            │   Backend    │
         │                                     │  auth.js     │
         │ setToken(jwt)                       └──────┬───────┘
         │ setCurrentToken(jwt)                       │
         ▼                                            │
┌─────────────────┐                                   │
│  localStorage   │  ◄─── JWT token ──────────────────┘
│  - token        │
│  - user (cache) │
└─────────────────┘
         │
         │ Token synced to module
         ▼
┌─────────────────┐      GET /api/users/me
│   apiClient     │      GET /api/cases/...
│  - apiFetch()   │───── Authorization: Bearer <token>
│  - on401()      │
└────────┬────────┘
         │
         │ 401 detected?
         ▼
┌─────────────────┐
│   App.jsx       │
│  AuthSetup      │
│  - logout()     │
│  - navigate()   │
└─────────────────┘
```

---

## Next Steps (Optional Enhancements)

1. **Token refresh**: Implement refresh token flow to extend sessions without re-login
2. **Remember me**: Add checkbox to persist sessions beyond current tab
3. **Role guards**: Enhance `RoleBoundary` to check token claims before rendering
4. **Token expiry warning**: Show UI notification 5 min before JWT expires
5. **Multi-tab sync**: Use `storage` event listener to sync logout across tabs

---

## Troubleshooting

### Issue: User logged out immediately after login
- **Check**: Backend JWT_EXPIRES setting (default `7d`)
- **Check**: Token format in localStorage (should have 3 parts: `xxx.yyy.zzz`)
- **Fix**: Ensure backend `DEV_JWT_SECRET` matches across restarts

### Issue: 401 on every request
- **Check**: `getCurrentToken()` returns valid token
- **Check**: Backend `authenticateUser` middleware logs
- **Fix**: Ensure `setCurrentToken()` called in AuthContext useEffect

### Issue: Redirect loop on 401
- **Check**: `setOn401Callback` called only once (in AuthSetup useEffect)
- **Fix**: Ensure callback doesn't trigger re-render that re-calls itself

### Issue: Profile not loading after login
- **Check**: `/api/users/me` returns 200 with `{ ok: true, user: {...} }`
- **Check**: `mapServerUser()` correctly maps `user_id` → `id`
- **Fix**: Run missing column migrations (`20251008_app_users_add_missing_columns.sql`)
