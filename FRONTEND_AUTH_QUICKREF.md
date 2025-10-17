# 🎯 Frontend Token Auth - Quick Reference

## Implementation Complete ✅

**Pattern**: Token binding + Event-driven 401 handling + Auto-hydration

## Core Files

### 1. `frontend/src/lib/apiClient.js` (25 lines)
```javascript
// Minimal fetch wrapper with token + 401 handling
let _getToken = () => null;
export function bindTokenGetter(fn) { _getToken = fn; }

export async function apiFetch(path, init = {}) {
  const base = import.meta.env.VITE_API_BASE || '';
  const token = _getToken?.();
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  
  const res = await fetch(`${base}${path}`, { ...init, headers });
  
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('app:unauthorized'));
  }
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error?.message || res.statusText), { status: res.status, data });
  return data;
}
```

### 2. `frontend/src/context/AuthContext.jsx` (90 lines)
**Key Features**:
- Token binding: `bindTokenGetter(() => token)`
- Auto-hydration: `useEffect` fetches profile on token change
- Event listener: Listens for `app:unauthorized` and calls `logout()`
- Persistence: Uses `localStorage` with key `auth_token`

**Exports**:
```javascript
const { user, token, loading, register, login, logout, refreshMe } = useAuth();
```

### 3. `frontend/src/components/PrivateRoute.jsx` (13 lines)
```javascript
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // or spinner
  return user ? children : <Navigate to="/signin" replace />;
};
```

## Usage Patterns

### Register
```javascript
const { register } = useAuth();
await register(email, password);
navigate('/dashboard');
```

### Login
```javascript
const { login } = useAuth();
await login(email, password);
navigate('/dashboard');
```

### Logout
```javascript
const { logout } = useAuth();
logout();
navigate('/signin');
```

### Protected Route
```jsx
<Route path="/dashboard" element={
  <PrivateRoute>
    <Dashboard />
  </PrivateRoute>
} />
```

### API Calls
```javascript
import { apiFetch } from '../lib/apiClient';

// GET
const data = await apiFetch('/api/cases');

// POST
const result = await apiFetch('/api/cases', {
  method: 'POST',
  body: JSON.stringify({ title: 'New Case' })
});

// PUT
await apiFetch('/api/cases/123', {
  method: 'PUT',
  body: JSON.stringify({ status: 'closed' })
});

// DELETE
await apiFetch('/api/cases/123', { method: 'DELETE' });
```

## How It Works

### 1. **Token Binding**
```
AuthContext (has token) 
    ↓ bindTokenGetter(() => token)
apiClient (can access token)
```

### 2. **401 Flow**
```
Any API request → 401 response
    ↓ window.dispatchEvent('app:unauthorized')
AuthContext listener
    ↓ logout()
Clear token & user
    ↓ PrivateRoute sees no user
Redirect to /signin
```

### 3. **Session Persistence**
```
Page Load
    ↓ AuthContext useState(() => localStorage.getItem('auth_token'))
Token restored from localStorage
    ↓ useEffect(() => refreshMe(), [token])
Fetch /api/users/me
    ↓ setUser(me.user)
User logged in ✅
```

### 4. **Registration/Login**
```
Form submit → register(email, password)
    ↓ POST /api/auth/register
Backend returns JWT
    ↓ setTokenPersist(res.token)
Save to localStorage & state
    ↓ useEffect triggers on token change
Fetch profile from /api/users/me
    ↓ setUser(profile)
Navigate to /dashboard ✅
```

## Testing Checklist

- [ ] **Backend Test**: Run `.\scripts\test-frontend-auth-backend.ps1`
- [ ] **Register**: Create new account at `/register`
- [ ] **Login**: Sign in at `/signin`
- [ ] **Persistence**: Refresh page (F5) - should stay logged in
- [ ] **Protected Route**: Access `/dashboard` without login - should redirect
- [ ] **401 Logout**: Corrupt token in DevTools - should auto-logout
- [ ] **Token Storage**: Check DevTools → Application → Local Storage → `auth_token`

## Error Handling

### Form Errors
```javascript
try {
  await login(email, password);
  navigate('/dashboard');
} catch (err) {
  setError(err?.data?.error?.message || err.message);
}
```

### API Errors
```javascript
try {
  const data = await apiFetch('/api/endpoint');
} catch (err) {
  console.error('API Error:', err.message);
  console.error('Status:', err.status);
  console.error('Data:', err.data);
}
```

## Migration Status

### ✅ Complete
- apiClient with bindTokenGetter
- AuthContext with event-driven 401
- RegisterForm, SignInForm, LoginForm
- PrivateRoute with loading state
- Auto token restoration on mount

### 🔄 Remaining (Next Phase)
- Migrate ~20+ components to use `apiFetch`:
  - DivorceeDocumentsPanel
  - Chat components (ChatInput, ChatRoom, ChatDrawer)
  - Notification components
  - CaseNotes
  - UploadDialog
  - AdminWorkspace (remove fake-jwt-token check)

## Backend Requirements

### Endpoints
- `POST /api/auth/register` → `{ ok: true, token: "jwt..." }`
- `POST /api/auth/login` → `{ ok: true, token: "jwt..." }`
- `GET /api/users/me` → `{ ok: true, user: {...} }` (requires auth)

### Error Format
```json
{
  "ok": false,
  "error": {
    "message": "Error description"
  }
}
```

## Environment Variables

```env
# .env (frontend)
VITE_API_BASE=http://localhost:4000
```

## Key Decisions

1. **Token Binding over Import**: Avoids circular dependency
2. **Event-driven 401**: Decouples apiClient from AuthContext
3. **Single Storage Key**: `auth_token` (not separate `user` and `token`)
4. **Auto-hydration**: Profile fetched automatically on token change
5. **Simplified Forms**: No intermediate states, direct navigation
6. **useCallback**: Prevents unnecessary re-renders

## Common Issues

| Issue | Solution |
|-------|----------|
| "Unexpected end of JSON input" | Backend not running |
| 401 loops | Check event listener cleanup |
| Token not persisting | Check localStorage quota |
| Profile not loading | Check `/api/users/me` endpoint |
| Forms not submitting | Check backend returns `{ ok: true }` |

## Documentation

- Full implementation guide: `FRONTEND_AUTH_IMPLEMENTATION.md`
- Backend test script: `scripts/test-frontend-auth-backend.ps1`
- This quick reference: `FRONTEND_AUTH_QUICKREF.md`

---

**Status**: ✅ Ready for Testing  
**Last Updated**: October 9, 2025  
**Next**: Test UI flows, migrate remaining components to apiFetch
