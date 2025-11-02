# CORS Fix for Dev Headers

## Issue
Frontend was sending custom dev headers (`x-dev-user-id`, `x-dev-email`, `x-dev-role`) but backend CORS configuration wasn't allowing them, causing:
```
Access to fetch at 'http://localhost:4000/api/users/me' from origin 'http://localhost:5173' 
has been blocked by CORS policy: Request header field x-dev-user-id is not allowed by 
Access-Control-Allow-Headers in preflight response.
```

## Solution
Updated `backend/src/index.js` CORS configuration to include the dev headers:

```javascript
// CORS configuration
app.use(cors({
	origin: config.cors.origin,
	credentials: config.cors.credentials,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'x-dev-role', 'x-dev-fake-token', 'x-dev-email', 'x-dev-user-id'],
}));
```

## Changes Made
**File:** `backend/src/index.js`
- Added `'x-dev-email'` to allowedHeaders
- Added `'x-dev-user-id'` to allowedHeaders

## Next Steps
1. If nodemon is running, it should auto-restart the backend
2. Refresh the frontend at `http://localhost:5173/signin`
3. The CORS error should be resolved
4. Dev mode authentication should work correctly

## Dev Headers Purpose
These headers are used by `apiClient.js` in dev mode to identify the fake dev user:
- `x-dev-email`: Email of the dev user (e.g., admin@dev.local)
- `x-dev-user-id`: User ID of the dev user
- `x-dev-role`: Role of the dev user (admin, mediator, divorcee, lawyer)
- `x-dev-fake-token`: Indicates dev mode is active

The backend's `devAuth` middleware reads these headers and populates `req.user` so that protected routes work without real JWT authentication in dev mode.
