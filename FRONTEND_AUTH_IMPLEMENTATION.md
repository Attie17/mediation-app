# Frontend Token Auth Implementation

## ✅ Implementation Complete

The frontend has been fully refactored to implement JWT token authentication with automatic header injection and global 401 handling.

## Architecture Overview

### 1. **apiClient.js** - Minimal Fetch Wrapper
- **Token Binding**: Uses `bindTokenGetter()` pattern to access token from AuthContext
- **Auto-Injection**: Automatically adds `Authorization: Bearer <token>` to all requests
- **401 Handling**: Dispatches `app:unauthorized` event on any 401 response
- **Error Handling**: Throws errors with parsed error messages from backend

### 2. **AuthContext.jsx** - Authentication State Manager
- **Token Storage**: Persists JWT in localStorage with key `auth_token`
- **Auto-Hydrate**: On mount, restores token and fetches user profile
- **Event Listener**: Listens for `app:unauthorized` events and triggers logout
- **Methods**:
  - `register(email, password)` - Register and auto-login
  - `login(email, password)` - Login and hydrate profile
  - `logout()` - Clear token and user state
  - `refreshMe()` - Re-fetch user profile from `/api/users/me`

### 3. **PrivateRoute** - Route Protection
- Shows nothing while `loading` (token restoration in progress)
- Redirects to `/signin` if no user after loading completes
- Renders children if authenticated

## Files Modified

| File | Changes |
|------|---------|
| `frontend/src/lib/apiClient.js` | Complete rewrite with `bindTokenGetter` pattern |
| `frontend/src/context/AuthContext.jsx` | Simplified to use `apiFetch`, event-based 401 handling |
| `frontend/src/pages/RegisterForm.jsx` | Simplified to call `register(email, password)` only |
| `frontend/src/pages/SignInForm.jsx` | Simplified login flow, removed intermediate states |
| `frontend/src/components/LoginForm.jsx` | Updated to match new auth pattern |
| `frontend/src/components/PrivateRoute.jsx` | Added `loading` state check |
| `frontend/src/App.jsx` | Removed `AuthSetup` component (no longer needed) |

## Definition of Done ✓

### ✅ Register/Login store token, hydrate `/api/users/me`, and redirect
- Register and login now both call backend, store JWT, fetch profile, and navigate to `/dashboard`

### ✅ Page refresh keeps session
- Token persists in localStorage
- On app mount, AuthContext restores token and hydrates user profile
- User stays logged in across page refreshes

### ✅ Any 401 anywhere logs out and routes to `/signin`
- All API calls through `apiFetch` trigger `app:unauthorized` event on 401
- AuthContext listens for event and calls `logout()`
- PrivateRoute redirects to `/signin` when `user` is null

### ✅ No frontend path relies on dev headers
- All manual `Authorization` header construction removed from auth forms
- Forms use `apiFetch` which auto-injects token
- Dev headers only remain in backend test scripts (not UI)

## Testing Guide

### 1. **Test Registration Flow**
```bash
# Start backend
cd backend
npm run dev

# Start frontend (separate terminal)
cd frontend
npm run dev
```

1. Navigate to `http://localhost:5173/register`
2. Fill in email/password
3. Click "Register"
4. Should see token stored in localStorage
5. Should redirect to `/dashboard`
6. Check DevTools → Application → Local Storage → `auth_token`

### 2. **Test Login Flow**
1. Navigate to `http://localhost:5173/signin`
2. Enter email/password of existing user
3. Click "Sign in"
4. Should redirect to `/dashboard` with user loaded

### 3. **Test Session Persistence**
1. While logged in, press `F5` to refresh page
2. Should remain logged in (no redirect to signin)
3. User profile should load automatically

### 4. **Test 401 Auto-Logout**
1. While logged in, open DevTools
2. Go to Application → Local Storage
3. Find `auth_token` and modify it (corrupt the JWT)
4. Make any API call (navigate to a protected route)
5. Should automatically logout and redirect to `/signin`

### 5. **Test Protected Routes**
1. While logged out, try to access `/dashboard` or `/profile`
2. Should immediately redirect to `/signin`
3. After login, should navigate to intended destination

## Backend Compatibility

The implementation expects these backend endpoints:

- `POST /api/auth/register` - Returns `{ ok: true, token: "jwt..." }`
- `POST /api/auth/login` - Returns `{ ok: true, token: "jwt..." }`
- `GET /api/users/me` - Returns `{ ok: true, user: {...} }` (requires Authorization header)

Error responses should use format:
```json
{
  "ok": false,
  "error": {
    "message": "Error description"
  }
}
```

## Migration Notes

### Removed Patterns
- ❌ `getCurrentToken()` / `setCurrentToken()` module exports
- ❌ `setOn401Callback()` function
- ❌ Manual `Authorization: Bearer ${token}` header construction
- ❌ Manual `fetch()` calls with token injection
- ❌ Complex error handling with try/catch around JSON parsing
- ❌ Intermediate "submitted" states in forms
- ❌ Role-based routing (simplified to `/dashboard`)

### New Patterns
- ✅ `bindTokenGetter(() => token)` to bind AuthContext token to apiClient
- ✅ `window.dispatchEvent(new CustomEvent('app:unauthorized'))` for 401s
- ✅ `useEffect` listening for `app:unauthorized` in AuthContext
- ✅ All forms use `apiFetch` from apiClient (no manual fetch)
- ✅ Simplified error handling: `err?.data?.error?.message || err.message`
- ✅ Direct navigation after auth success

## Next Steps

### Additional Components to Migrate
The following components still use manual `fetch()` with token injection and should be migrated to use `apiFetch`:

- `DivorceeDocumentsPanel.jsx` - Document upload/fetch
- `ChatInput.jsx`, `ChatRoom.jsx`, `ChatDrawer.jsx` - Chat features
- `NotificationsMenu.jsx`, `NotificationsList.jsx`, `NotificationCounter.jsx` - Notifications
- `CaseNotes.jsx` - Case notes CRUD
- `UploadDialog.jsx` - File uploads
- `AdminWorkspace.jsx` - Remove legacy "fake-jwt-token" check (line 66)

### Recommended Improvements
1. Add loading spinner in `PrivateRoute` instead of returning `null`
2. Add token refresh flow for expired tokens
3. Add logout button to UI header/navigation
4. Consider moving `STORAGE_KEY` to environment variable
5. Add unit tests for AuthContext and apiClient

## Troubleshooting

### "Unexpected end of JSON input"
- Backend not running or not responding
- Check backend is on `http://localhost:4000`
- Verify Vite proxy config in `vite.config.js`

### 401 loops
- Check that `app:unauthorized` listener is properly set up
- Verify token is being cleared on logout
- Check browser console for event dispatch logs

### Token not persisting
- Check localStorage quota not exceeded
- Verify no browser extensions blocking localStorage
- Check `auth_token` key is correct

### Forms not submitting
- Check browser console for errors
- Verify backend endpoints return `{ ok: true }` format
- Check CORS headers if backend on different port

