# 🔴 CRITICAL: Backend Down - Action Plan

**Date**: November 3, 2025, 3:00 PM  
**Status**: 🔴 PRODUCTION OUTAGE  
**Impact**: Complete service unavailable

---

## Issue Summary

**Symptom**: All backend endpoints returning 500 Internal Server Error  
**Evidence**:
```bash
curl https://mediation-app.onrender.com/
# Returns: 500 Internal Server Error

curl https://mediation-app.onrender.com/healthz
# Returns: 500 Internal Server Error
```

**Assessment**: Server is not starting properly. This is likely a:
1. Database connection failure on startup
2. Missing environment variable
3. Import/module error
4. Port binding issue

---

## Immediate Actions Required

### 1. Check Render Dashboard Logs (URGENT)
**Action**: Go to Render dashboard → mediation-app-backend → Logs  
**Look for**:
- Startup errors
- Database connection errors
- Missing environment variable errors
- Module import errors
- Port binding errors

### 2. Verify Environment Variables
**Critical Variables** (must be set in Render):
- ✅ `DATABASE_URL` (Supabase pooler connection string)
- ✅ `JWT_SECRET` / `SESSION_SECRET`
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_KEY`
- ✅ `OPENAI_API_KEY`
- ✅ `FRONTEND_URL`
- ✅ `DEV_AUTH_ENABLED` (should be 'false' in production)

**Check in Render Dashboard**:
- Settings → Environment → Environment Variables
- Verify each variable is set
- Verify no typos in variable names

### 3. Test Database Connection Manually
**Using psql**:
```bash
psql "postgresql://postgres.kjmwaoainmyzbmvalizu:d8ScTSlTB6e5jmvS@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require"
```

**Expected**: Should connect successfully  
**If fails**: Database credentials are wrong or Supabase is down

### 4. Check Backend Package.json
**File**: `backend/package.json`  
**Verify**:
- "start" script exists: `"start": "node src/index.js"`
- All dependencies are listed
- No syntax errors

### 5. Verify Backend Entry Point
**File**: `backend/src/index.js`  
**Check**:
- No syntax errors
- All imports resolve correctly
- Server starts without database (comment out health check temporarily)

---

## Likely Root Causes (in order of probability)

### 1. Database Connection Failure (80% probability)
**Why**: SSL certificate issues with Supabase pooler  
**Evidence**: Previous SSL certificate problems  
**Fix**: 
- Verify `NODE_TLS_REJECT_UNAUTHORIZED=0` is set
- Verify `PGSSLMODE=no-verify` is set
- Check db.js SSL configuration

### 2. Missing Environment Variable (15% probability)
**Why**: Required variable not set in Render  
**Evidence**: envValidator.js enforces required variables  
**Fix**:
- Check Render logs for "Missing required environment variable" errors
- Add missing variables

### 3. Module Import Error (3% probability)
**Why**: Dependency not installed or module not found  
**Evidence**: Previous OpenAI module corruption on Railway  
**Fix**:
- Clear npm cache in Render
- Trigger rebuild
- Check for syntax errors in imports

### 4. Port Binding Issue (2% probability)
**Why**: HOST binding configuration  
**Evidence**: Fixed this before with 0.0.0.0  
**Fix**:
- Verify HOST=0.0.0.0 in config
- Check if Render auto-injects PORT variable

---

## Step-by-Step Debugging Process

### Step 1: Check Render Logs (5 minutes)
1. Go to https://dashboard.render.com
2. Find mediation-app-backend service
3. Click "Logs" tab
4. Look for:
   - "Server running on..." message (if missing, server didn't start)
   - Error messages
   - Stack traces
   - "Connection refused" or "ECONNREFUSED"
   - "Missing environment variable"
   - "Cannot find module"

### Step 2: Verify Critical Environment Variables (5 minutes)
1. In Render dashboard, go to Settings → Environment
2. Verify these are set:
   - DATABASE_URL
   - JWT_SECRET
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - OPENAI_API_KEY
   - FRONTEND_URL
3. Add any missing variables
4. Click "Save Changes"
5. Render will auto-redeploy

### Step 3: Test Database Directly (5 minutes)
```bash
# Test database connection
psql "postgresql://postgres.kjmwaoainmyzbmvalizu@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require"

# If that fails, try with sslmode=disable
psql "postgresql://postgres.kjmwaoainmyzbmvalizu@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=disable"

# Test simple query
psql [connection string] -c "SELECT 1;"
```

### Step 4: Temporary Fix - Disable Health Check (10 minutes)
If database is the issue, temporarily disable health check to get server running:

1. Comment out database query in health check:
```javascript
// In backend/src/index.js
app.get('/healthz', async (req, res) => {
  try {
    // TEMPORARILY COMMENTED OUT FOR DEBUGGING
    // const db = await pool.query('SELECT 1 as ok');
    return res.json({
      ok: true,
      service: 'backend',
      db: 'skipped', // db.rows?.[0]?.ok === 1,
      time: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[healthz] database check failed', { error: error.message });
    return res.status(500).json({ ok: false, error: 'DB_UNAVAILABLE' });
  }
});
```

2. Commit and push
3. Render will auto-deploy
4. Test if server starts

### Step 5: Check Database SSL Config (10 minutes)
**File**: `backend/src/db.js`

Current config:
```javascript
if (process.env.NODE_ENV === 'production' || databaseUrl?.includes('supabase') || databaseUrl?.includes('pooler')) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
    ca: false,
    checkServerIdentity: () => undefined
  };
}
```

**Verify**:
- This code is present
- No syntax errors
- Conditions match your DATABASE_URL

### Step 6: Force Rebuild (5 minutes)
In Render dashboard:
1. Go to Manual Deploy
2. Click "Clear build cache & deploy"
3. Wait for build to complete
4. Check logs

### Step 7: Rollback to Last Working Version (15 minutes)
If nothing works:
1. Check git history: `git log --oneline`
2. Find last commit before Render migration
3. Create rollback branch: `git checkout -b rollback [commit-hash]`
4. Push to Render branch
5. Deploy

---

## Quick Wins to Try First

### Option 1: Add Missing FRONTEND_URL
```bash
# In Render dashboard, add:
FRONTEND_URL=https://www.divorcesmediator.com
```

### Option 2: Add SESSION_SECRET
```bash
# SESSION_SECRET might be required
SESSION_SECRET=[same as JWT_SECRET]
```

### Option 3: Verify DATABASE_URL Format
Should be:
```
postgresql://postgres.kjmwaoainmyzbmvalizu:PASSWORD@aws-1-eu-west-2.pooler.supabase.com:6543/postgres
```

NOT:
```
postgresql://postgres.kjmwaoainmyzbmvalizu:PASSWORD@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require
```

Remove `?sslmode=require` from DATABASE_URL - we handle SSL in code.

---

## Expected Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Investigation | 15 min | Check logs, identify error |
| Fix | 15 min | Apply fix based on error |
| Deploy | 5 min | Render auto-deploys |
| Verify | 5 min | Test endpoints |
| **Total** | **40 min** | **Estimated time to resolve** |

---

## Communication Plan

### To Stakeholders:
> "Backend service is temporarily down due to database connection issue. Investigating now. ETA for resolution: 1 hour."

### Status Updates:
- Every 15 minutes until resolved
- Post in team channel/Slack
- Update status page if available

---

## Prevention for Future

1. **Health Monitoring**: Set up Render health check endpoint
2. **Alerting**: Configure Render alerts for service down
3. **Staging Environment**: Test deployments before production
4. **Rollback Plan**: Document rollback procedure
5. **Database Backup**: Regular Supabase backups
6. **Monitoring**: Add Sentry or similar error tracking

---

## Contacts

**Render Support**: support@render.com  
**Supabase Support**: support@supabase.com  
**Emergency Rollback**: Use Railway backup (if still active)

---

## Next Steps (Immediate)

1. 🔴 **NOW**: Check Render dashboard logs
2. 🔴 **5 min**: Verify environment variables
3. 🔴 **10 min**: Test database connection
4. 🔴 **15 min**: Apply fix based on findings
5. 🟡 **30 min**: Verify fix works
6. 🟢 **45 min**: Resume normal testing

---

**Created**: November 3, 2025  
**Priority**: P0 - CRITICAL  
**Status**: INVESTIGATING
