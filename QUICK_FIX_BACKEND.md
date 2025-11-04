# 🚀 QUICK FIX GUIDE - Get Backend Running in 5 Minutes

**Problem**: Backend returning 500 errors  
**Solution**: Add missing environment variable  
**Time**: 5 minutes

---

## Step-by-Step Fix

### 1. Go to Render Dashboard (1 minute)
1. Open https://dashboard.render.com
2. Login with your Render account
3. Find service: **mediation-app-backend**
4. Click on the service name

### 2. Add Missing Environment Variable (2 minutes)
1. Click **"Settings"** (left sidebar)
2. Scroll to **"Environment"** section
3. Click **"Add Environment Variable"**
4. Add this variable:
   ```
   Key: FRONTEND_URL
   Value: https://www.divorcesmediator.com
   ```
5. Click **"Save Changes"**

### 3. Wait for Auto-Deploy (2 minutes)
- Render will automatically redeploy with new variable
- Watch the **"Events"** tab for deploy progress
- Should say "Deploy live" when complete

### 4. Verify It Works (30 seconds)
Open these URLs in your browser:

**Health Check**:
```
https://mediation-app.onrender.com/healthz
```
Should show:
```json
{
  "ok": true,
  "service": "backend",
  "db": true,
  "time": "2025-11-03T..."
}
```

**Root Endpoint**:
```
https://mediation-app.onrender.com/
```
Should show:
```json
{
  "message": "Divorce Mediation API running"
}
```

---

## If That Doesn't Work...

### Also Add These Variables (optional but recommended):
```
SESSION_SECRET=[paste same value as JWT_SECRET]
SUPABASE_ANON_KEY=[get from Supabase dashboard]
SUPABASE_JWT_SECRET=[get from Supabase dashboard]
DEV_AUTH_ENABLED=false
```

**Where to find Supabase keys**:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy `anon/public` key → Use for SUPABASE_ANON_KEY
5. Copy `JWT Secret` → Use for SUPABASE_JWT_SECRET

---

## Still Not Working?

### Check Render Logs
1. In Render dashboard, click **"Logs"** tab
2. Look for error messages in red
3. Common errors:
   - "Missing required environment variable" → Add the missing variable
   - "ECONNREFUSED" → Database connection issue
   - "Cannot find module" → Rebuild with clear cache

### Clear Cache and Rebuild
1. In Render dashboard, click **"Manual Deploy"**
2. Click **"Clear build cache & deploy"**
3. Wait 3-5 minutes for rebuild

### Verify Environment Variables
Make sure ALL these are set in Render:
- ✅ DATABASE_URL
- ✅ JWT_SECRET
- ✅ SESSION_SECRET
- ✅ SUPABASE_URL
- ✅ SUPABASE_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ SUPABASE_ANON_KEY
- ✅ SUPABASE_JWT_SECRET
- ✅ OPENAI_API_KEY
- ✅ FRONTEND_URL
- ✅ DEV_AUTH_ENABLED=false
- ✅ NODE_TLS_REJECT_UNAUTHORIZED=0
- ✅ PGSSLMODE=no-verify

---

## After Backend is Running

### Test the Frontend
1. Open https://www.divorcesmediator.com
2. Click "Register"
3. Create account with:
   - Email: alice@test.com
   - Password: Test123!
   - Role: Divorcee
4. Login
5. Complete role setup
6. Verify dashboard loads

### Create Test Accounts
Use these credentials for testing:
- **Divorcee 1**: alice@test.com / Test123!
- **Divorcee 2**: bob@test.com / Test123!
- **Mediator**: mediator@test.com / Test123!
- **Admin**: admin@test.com / Test123!

---

## Success Checklist

- [ ] Backend health check returns 200 OK
- [ ] Backend root endpoint returns success message
- [ ] Frontend loads without errors
- [ ] Can register new account
- [ ] Can login
- [ ] Dashboard loads
- [ ] Can logout

**When all checked**: You're ready to test! ✅

---

## Need Help?

**Check these files**:
- `EXECUTIVE_SUMMARY_PRE_LAUNCH.md` - Full overview
- `PRE_LAUNCH_INVESTIGATION_REPORT.md` - Detailed investigation
- `CRITICAL_BACKEND_DOWN.md` - Detailed debugging steps

**Render Support**: support@render.com  
**Render Docs**: https://render.com/docs

---

**Estimated Time**: 5 minutes  
**Difficulty**: Easy  
**Risk**: Low (just adding environment variable)
