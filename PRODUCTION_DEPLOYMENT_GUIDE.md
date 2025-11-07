# 🚀 Production Deployment Guide - Risk Assessment Feature

**Date:** November 7, 2025  
**Branch:** feature/ipv-financial-tools  
**Status:** Ready for deployment

---

## ⚠️ IMPORTANT: Deployment Order

**YOU MUST apply the database migration BEFORE deploying code!**

Failure to do so will cause the backend to crash when users submit intake forms.

---

## Step 1: Apply Database Migration to Production

### Option A: Supabase SQL Editor (Recommended)

1. Go to: https://supabase.com/dashboard/project/kjmwaoainmyzbmvalizu
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Add risk_assessment column to app_users table
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS risk_assessment JSONB;

-- Add GIN index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_app_users_risk_assessment 
ON app_users USING GIN (risk_assessment);

-- Add column comment for documentation
COMMENT ON COLUMN app_users.risk_assessment IS 
'JSONB object containing IPV screening results and risk scores. Structure: {safetyData, ipvFlags, powerImbalance, suitability, recommendation, processAdaptations, supportResources, assessedAt, version}';
```

5. Click **Run** (or press Ctrl+Enter)
6. Verify success message appears
7. **Verify the column exists:**

```sql
-- Run this query to verify
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'app_users' 
AND column_name = 'risk_assessment';
```

Expected result:
```
column_name       | data_type | is_nullable
risk_assessment   | jsonb     | YES
```

✅ **Once you see the column exists, proceed to Step 2**

---

## Step 2: Deploy Backend Code

### 2.1: Commit and Push to Render Deployment Branch

```powershell
# Switch to render-deployment branch
git checkout render-deployment

# Merge the feature branch
git merge feature/ipv-financial-tools

# If there are conflicts, resolve them
# Then commit:
git add .
git commit -m "feat: Add IPV screening and financial calculator features with risk assessment"

# Push to trigger Render deployment
git push origin render-deployment
```

### 2.2: Monitor Render Deployment

1. Go to: https://dashboard.render.com
2. Find your backend service: `divorces-mediator-backend`
3. Watch the **Logs** tab for deployment progress
4. Look for:
   - ✅ `Build successful`
   - ✅ `Deploy live`
   - ✅ `Server running on port 4000`

**Expected deployment time:** 2-3 minutes

### 2.3: Verify Backend Health

```powershell
# Check health endpoint
curl https://divorces-mediator-backend.onrender.com/api/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

✅ **Once backend is healthy, proceed to Step 3**

---

## Step 3: Deploy Frontend Code

### 3.1: Merge to Master Branch

```powershell
# Switch to master branch
git checkout master

# Merge the feature branch
git merge feature/ipv-financial-tools

# If there are conflicts, resolve them
# Then commit if needed:
git add .
git commit -m "feat: Add IPV screening and financial calculator to intake form"

# Push to trigger Vercel deployment
git push origin master
```

### 3.2: Monitor Vercel Deployment

1. Vercel will auto-deploy from the master branch
2. Go to: https://vercel.com/dashboard
3. Find your project: `mediation-app`
4. Watch deployment progress
5. Look for: ✅ `Production Deployment`

**Expected deployment time:** 1-2 minutes

### 3.3: Verify Frontend Deployment

```powershell
# Check if site is live
curl https://www.divorcesmediator.com
```

✅ **Once frontend is deployed, proceed to Step 4**

---

## Step 4: Production Smoke Test

### Test 1: Health Check
```powershell
curl https://divorces-mediator-backend.onrender.com/api/health
```
✅ Expected: `{"status":"ok"}`

### Test 2: Complete Intake Form

1. Open: https://www.divorcesmediator.com/intake
2. Fill out steps 1-4 (basic info)
3. **NEW:** Complete Step 4.5 (Safety & Wellbeing)
   - Answer at least 7 of 10 questions
   - Verify privacy notice displays
   - Verify emergency hotline numbers visible
4. Complete Step 5 (Financial)
   - **NEW:** Test financial calculator
   - Enter income values
   - Select custody arrangement
   - Verify calculations display
5. Complete remaining steps (6-7)
6. Click **Submit**

✅ **Expected:** Form submits successfully, redirects to dashboard

### Test 3: Mediator Dashboard

1. Log in as mediator (mediator@test.com)
2. Navigate to a case with the new assessment
3. **NEW:** Verify risk assessment badge displays
   - Should show: High Risk (red) / Moderate Risk (yellow) / Standard (blue)
   - Verify IPV flags count shows
   - Verify power imbalance score shows
4. Click to expand process adaptations
5. Click to expand support resources

✅ **Expected:** Risk assessment displays correctly, no console errors

### Test 4: Privacy Verification

1. As mediator, view case overview
2. Verify you can see:
   - ✅ Risk level badge
   - ✅ IPV flags count
   - ✅ Power imbalance score
   - ✅ Process recommendations
3. Verify you CANNOT see:
   - ❌ Raw safety answers (individual question responses)

✅ **Expected:** Mediators see scores only, never raw data

---

## Step 5: Monitor Error Logs

### Check Render Logs
```
https://dashboard.render.com → Backend Service → Logs
```

Look for:
- ❌ Database connection errors
- ❌ SQL errors about "column does not exist"
- ❌ 500 errors on /api/users/risk-assessment

✅ **Expected:** No errors related to risk_assessment

### Check Browser Console

1. Open DevTools (F12)
2. Navigate to intake form
3. Complete submission
4. Check Console tab

✅ **Expected:** No red errors, only normal logs

---

## Rollback Plan (If Issues Occur)

### If Backend Fails:

```powershell
# Revert render-deployment branch
git checkout render-deployment
git revert HEAD
git push origin render-deployment
```

### If Frontend Fails:

```powershell
# Revert master branch
git checkout master
git revert HEAD
git push origin master
```

### If Database Migration Fails:

```sql
-- Remove column (run in Supabase SQL Editor)
ALTER TABLE app_users DROP COLUMN IF EXISTS risk_assessment;
DROP INDEX IF EXISTS idx_app_users_risk_assessment;
```

⚠️ **Note:** Only rollback database if NO assessments have been submitted yet

---

## Success Criteria

Deployment is successful when:

- ✅ Database migration applied (column exists)
- ✅ Backend deployed without errors
- ✅ Frontend deployed without errors
- ✅ Intake form Step 4.5 displays
- ✅ Financial calculator displays and calculates
- ✅ Form submission succeeds
- ✅ Risk assessment saves to database
- ✅ Mediator dashboard shows risk badges
- ✅ No console errors
- ✅ Privacy maintained (no raw data exposed)

---

## Post-Deployment Checklist

After successful deployment:

- [ ] Verify health check passes
- [ ] Test complete intake form flow
- [ ] Test mediator dashboard view
- [ ] Verify privacy (no raw answers visible)
- [ ] Check error logs (no new errors)
- [ ] Monitor first few real submissions
- [ ] Update documentation (if needed)
- [ ] Notify team of new features
- [ ] Add to release notes

---

## Support Information

**Database:** Supabase (kjmwaoainmyzbmvalizu)  
**Backend:** Render (divorces-mediator-backend.onrender.com)  
**Frontend:** Vercel (www.divorcesmediator.com)  

**Migration File:** `supabase/migrations/20251107_add_risk_assessment_to_app_users.sql`  
**Test Scripts:** `backend/test-risk-assessment-api.js`, `backend/verify-risk-assessment-migration.js`

---

## Timeline Estimate

- Database migration: 2 minutes
- Backend deployment: 3 minutes  
- Frontend deployment: 2 minutes
- Smoke testing: 10 minutes
- **Total:** ~15-20 minutes

---

## Need Help?

If you encounter issues:

1. Check Render logs for backend errors
2. Check browser console for frontend errors
3. Verify database migration was applied
4. Check that environment variables are set
5. Refer to `INVESTIGATION_REPORT_NOV_7_2025.md` for detailed troubleshooting

---

**Good luck with the deployment! 🚀**

Remember: **Database migration FIRST, then code deployment!**
