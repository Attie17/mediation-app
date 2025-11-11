# ✅ Render Environment Variables Checklist

## 🎯 Action Required: Add These to Render Dashboard

**URL**: https://dashboard.render.com/web/[your-service-id]/env

### Required Variables (Add These Now)

```bash
# Critical - Backend won't start without these
FRONTEND_URL=https://www.divorcesmediator.com
SESSION_SECRET=[copy same value as JWT_SECRET]
DEV_AUTH_ENABLED=false

# Supabase Keys (if not already set)
SUPABASE_ANON_KEY=[get from Supabase dashboard]
SUPABASE_JWT_SECRET=[get from Supabase dashboard]
```

---

## 🧠 Optional: Memory Tuning (only if you see OOM or chronic warnings)

If you observe persistent high memory warnings or out-of-memory crashes in Render logs, consider setting:

```bash
# Raise V8 heap limit cautiously (value in MB)
NODE_OPTIONS=--max-old-space-size=512
```

Notes:
- Set this only if you have enough instance memory; on small/free plans, setting too high can cause earlier OOM.
- Start with 512 and adjust based on logs. If warnings disappear and no OOM occurs, you’re good.
- This is not a silver bullet—also monitor for memory leaks or large payloads.

---

## 📋 Complete Environment Variables List

Verify ALL these exist in Render:

### Authentication & Security
- [x] `JWT_SECRET` - Already set (sync: false)
- [ ] `SESSION_SECRET` - **ADD THIS** (same as JWT_SECRET)
- [ ] `DEV_AUTH_ENABLED` - **ADD THIS** = `false`

### Database
- [x] `DATABASE_URL` - Already set (sync: false)
- [x] `NODE_TLS_REJECT_UNAUTHORIZED` - Already set = `0`
- [x] `PGSSLMODE` - Already set = `no-verify`

### Supabase
- [x] `SUPABASE_URL` - Already set (sync: false)
- [x] `SUPABASE_KEY` - Already set (sync: false)
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Already set (sync: false)
- [ ] `SUPABASE_ANON_KEY` - **ADD THIS** (get from Supabase)
- [ ] `SUPABASE_JWT_SECRET` - **ADD THIS** (get from Supabase)

### Frontend & CORS
- [ ] `FRONTEND_URL` - **ADD THIS** = `https://www.divorcesmediator.com`
- [x] `ALLOWED_ORIGINS` - Already set

### AI Services
- [x] `OPENAI_API_KEY` - Already set (sync: false)
- [x] `ANTHROPIC_API_KEY` - Already set (sync: false)
- [x] `TAVILY_API_KEY` - Already set (sync: false)

### System
- [x] `NODE_ENV` - Already set = `production`
- [x] `PORT` - Already set = `3000`

---

## 🔑 Where to Find Supabase Keys

1. Go to: https://supabase.com/dashboard/project/kjmwaoainmyzbmvalizu/settings/api

2. Copy these values:
   - **Project URL** → Already in SUPABASE_URL ✅
   - **anon public** → Use for `SUPABASE_ANON_KEY`
   - **service_role** → Already in SUPABASE_SERVICE_ROLE_KEY ✅
   - **JWT Secret** → Use for `SUPABASE_JWT_SECRET`

---

## 📝 Step-by-Step Instructions

### 1. Open Render Dashboard
```
https://dashboard.render.com
```

### 2. Find Your Service
- Look for: **mediation-app-backend**
- Click on it

### 3. Go to Environment Variables
- Click **"Settings"** in left sidebar
- Scroll to **"Environment"** section
- Click **"Add Environment Variable"**

### 4. Add Each Missing Variable
For each variable:
1. Enter **Key** (exact name from list above)
2. Enter **Value**
3. Click **"Add"**

### 5. Save Changes
- Click **"Save Changes"** button
- Render will automatically redeploy (takes 2-3 minutes)

### 6. Monitor Deploy
- Go to **"Events"** tab
- Watch for "Deploy live" status
- Check **"Logs"** tab for any errors

If you enabled memory tuning, confirm in logs that the process starts without OOM and health checks remain stable.

---

## ✅ Verification Script

After adding variables and Render redeploys, run:

```powershell
# Test if backend is healthy
.\test-backend.ps1
```

**Expected output**:
```
✅ Health check passed!
✅ Root endpoint passed!
✅ Registration passed!
```

---

## 🐛 If Still Not Working

### Check Render Logs
1. Go to your service in Render
2. Click **"Logs"** tab
3. Look for errors like:
   - "Missing required environment variable: FRONTEND_URL"
   - "Cannot connect to database"
   - "Module not found"

### Common Issues

**Issue**: "Missing required environment variable"
**Fix**: Add the specific variable mentioned in the error

**Issue**: "Database connection failed"
**Fix**: Verify DATABASE_URL is correct, check Supabase is running

**Issue**: "Module not found"
**Fix**: Manual Deploy → "Clear build cache & deploy"

---

## 🎯 Success Criteria

You'll know it's working when:
- [ ] Render logs show "Server running on 0.0.0.0:3000"
- [ ] https://mediation-app.onrender.com/healthz returns 200 OK
- [ ] https://mediation-app.onrender.com/ returns success message
- [ ] Can register a test user successfully

---

## 📞 Need Help?

- **Render Docs**: https://render.com/docs/environment-variables
- **Render Support**: support@render.com
- **Check logs first**: Most issues show clear error messages

---

**Priority**: 🔴 CRITICAL - Backend is completely down  
**Time to fix**: 5 minutes (just adding variables)  
**Impact**: Blocks all testing
