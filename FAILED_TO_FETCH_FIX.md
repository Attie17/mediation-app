# "Failed to Fetch" Error - Troubleshooting Guide

**Date:** October 11, 2025  
**Error:** "Failed to fetch" when signing in

---

## Root Cause

The "Failed to fetch" error occurred because:

1. **Backend server crashed** - The terminal showed both servers exited with code 1
2. **Frontend .env change not loaded** - We just added `VITE_API_BASE=http://localhost:4000` but Vite didn't reload it

---

## Solution

### Step 1: Restart Servers ✅ DONE
Both servers have been restarted and are now running:
- Backend: Port 4000 ✅
- Frontend: Port 5173 ✅

### Step 2: Hard Refresh Browser
The frontend needs to reload with the new environment variable:

**Option A: Hard Refresh (Recommended)**
- Press `Ctrl + Shift + R` (Windows)
- Or `Ctrl + F5`

**Option B: Clear Cache and Reload**
1. Press `F12` to open DevTools
2. Right-click the reload button
3. Select "Empty Cache and Hard Reload"

### Step 3: Try Signing In Again
After the hard refresh, try signing in with your credentials.

---

## Why This Happened

### Environment Variable Changes
When you modify `.env` files in Vite:
- Changes require a **server restart** OR **browser hard refresh**
- Vite injects env vars at build time, not runtime
- `import.meta.env.VITE_API_BASE` is evaluated once at app load

### What We Changed
```diff
# frontend/.env

+ VITE_API_BASE=http://localhost:4000

  # Supabase Configuration for Frontend
  VITE_SUPABASE_URL=https://kjmwaoainmyzbmvalizu.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### The API Client Logic
```javascript
// frontend/src/lib/apiClient.js
export async function apiFetch(path, init = {}) {
  const base = import.meta.env.VITE_API_BASE || '';  // ← This reads the env var
  const token = _getToken?.();
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  
  const res = await fetch(`${base}${path}`, { ...init, headers });
  // ...
}
```

**Before:** `base = ''` (empty) → Request goes to `http://localhost:5173/api/auth/login` ❌
**After:** `base = 'http://localhost:4000'` → Request goes to `http://localhost:4000/api/auth/login` ✅

---

## Testing the Fix

### 1. Check Browser Console
Open DevTools (F12) → Network tab and try signing in. You should see:
```
Request URL: http://localhost:4000/api/auth/login
Status: 200 OK  (or 401/400 if credentials wrong)
```

### 2. Check Backend Logs
Look for this in your terminal:
```
[0] 🔍 APP DEBUG: POST /api/auth/login
```

### 3. Successful Sign In
If working correctly:
- No "Failed to fetch" error
- You'll either:
  - ✅ Sign in successfully (if credentials valid)
  - ❌ Get "Invalid credentials" (if credentials wrong)

---

## If Still Not Working

### Check 1: Verify Environment Variable
Run in PowerShell:
```powershell
Get-Content frontend\.env
```

Should show:
```
VITE_API_BASE=http://localhost:4000
```

### Check 2: Verify Backend is Running
Run:
```powershell
curl http://localhost:4000
```

Should return:
```json
{"message":"Divorce Mediation API running"}
```

### Check 3: Check Browser Console for CORS Errors
If you see CORS errors, the backend needs to allow requests from localhost:5173 (already configured).

### Check 4: Verify API Endpoint Exists
The login endpoint should be at:
- `/api/auth/login` (POST)
- Backend file: `backend/src/routes/auth.js`

---

## For New Users: Sign Up First

**Important:** If you're trying to sign in with NEW credentials that don't exist in the database yet, you need to **register first**:

### Option 1: Use Register Form
1. Go to http://localhost:5173
2. Click **"Register"** button
3. Fill in email and password
4. Submit the form
5. Then try signing in

### Option 2: Use Dev Login (For Testing)
1. Open `file:///C:/mediation-app/dev-login.html`
2. Select a role (Mediator, Divorcee, Lawyer, Admin)
3. Click "Login as [Role]"
4. This bypasses authentication for development

---

## Quick Checklist

Before signing in, verify:

- [ ] Backend server running (port 4000)
- [ ] Frontend server running (port 5173)
- [ ] Browser hard refreshed after .env change
- [ ] User account exists (or use dev login)
- [ ] No errors in browser console
- [ ] Backend logs show API requests

---

## Current Status

✅ **Servers Running**
- Backend: http://localhost:4000 ✅
- Frontend: http://localhost:5173 ✅

✅ **Environment Variable Added**
- `VITE_API_BASE=http://localhost:4000` in `frontend/.env` ✅

⏳ **Next Action Required**
- **Hard refresh your browser** (`Ctrl + Shift + R`)
- Then try signing in again

---

## Expected Behavior After Fix

### Scenario 1: Valid User Credentials
```
✅ Sign in successful
→ Redirects to your dashboard
→ Shows personalized content
```

### Scenario 2: Invalid Credentials
```
❌ "Invalid credentials" error message
→ User stays on sign-in page
→ Can try again with correct credentials
```

### Scenario 3: User Doesn't Exist
```
❌ "User not found" or "Invalid credentials"
→ Need to register first
→ Or use dev-login.html for testing
```

---

## Prevention

To avoid this in the future:

1. **Always restart servers** after changing `.env` files
2. **Hard refresh browser** after environment variable changes
3. **Check terminal** for server crash messages
4. **Monitor backend logs** when testing API calls

---

**Last Updated:** October 11, 2025  
**Resolution:** Servers restarted, environment variable added, hard refresh required
