# Vercel Environment Variables Checklist

## 🎯 Current Configuration Status

### ✅ What's Working
- Frontend code defaults to: `https://mediation-app.onrender.com`
- If `VITE_API_BASE_URL` is NOT set in Vercel, it will use the Render backend ✅

### ⚠️ Action Required (If API calls fail)

If the frontend cannot reach the backend, you need to set this in Vercel:

1. Go to: https://vercel.com/dashboard
2. Select your project: `mediation-app` or `divorcesmediator`
3. Go to: **Settings** → **Environment Variables**
4. Add or verify:

```
Name: VITE_API_BASE_URL
Value: https://mediation-app.onrender.com
```

5. **Redeploy** the frontend after adding/changing variables

## 🔍 How to Verify Current Setup

### Test if Vercel has the variable set:

```bash
# This will show if VITE_API_BASE_URL was set during build
# View the network tab in browser at https://www.divorcesmediator.com
# Check what API endpoint it's calling
```

### Quick Test:
1. Open https://www.divorcesmediator.com
2. Open Browser DevTools (F12)
3. Go to Network tab
4. Try to sign in or load data
5. Check API calls - they should go to `mediation-app.onrender.com`

## ✅ Expected Behavior

**API Calls should be:**
- ✅ `https://mediation-app.onrender.com/api/*`

**NOT:**
- ❌ `https://mediation-app-production.up.railway.app/*`
- ❌ `http://localhost:4000/*`

## 🚀 Deployment Commands

### To rebuild and deploy frontend with correct API:

```bash
# In frontend directory
cd frontend
npm run build

# Deploy to Vercel (if using Vercel CLI)
vercel --prod
```

Or push to git and Vercel will auto-deploy.
