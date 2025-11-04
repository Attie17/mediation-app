# 🔍 Render Environment Variables - What's Actually There?

## The Problem

Your local `backend/.env` file has all the variables, but **Render doesn't use .env files**.

Render only uses **environment variables you manually add in the dashboard**.

---

## ✅ What You Need To Do

Go to your Render dashboard and **manually add** each variable:

### 🔗 Direct Link to Add Variables:
```
https://dashboard.render.com
→ Click "mediation-app-backend"
→ Click "Settings"
→ Scroll to "Environment" section
→ Click "Add Environment Variable" button
```

---

## 📋 Variables To Add (From Your .env File)

Copy these EXACT values into Render:

### 1. FRONTEND_URL
```
Key: FRONTEND_URL
Value: https://www.divorcesmediator.com
```

### 2. SESSION_SECRET
```
Key: SESSION_SECRET
Value: x9LO6Goseym1lrDpzEDK530hS5dZA+Cq0r3ipJ2USALT32TcSG9QiUVTubqLA2Gl4RzYLnXmAYHnOuwdjEeX6Q==
```

### 3. SUPABASE_ANON_KEY
```
Key: SUPABASE_ANON_KEY
Value: sb_publishable_NLBeWpgVO-5xnyHy1AAJMg_-uVVPexF
```

### 4. SUPABASE_JWT_SECRET  
```
Key: SUPABASE_JWT_SECRET
Value: x9LO6Goseym1lrDpzEDK530hS5dZA+Cq0r3ipJ2USALT32TcSG9QiUVTubqLA2Gl4RzYLnXmAYHnOuwdjEeX6Q==
```

### 5. DEV_AUTH_ENABLED
```
Key: DEV_AUTH_ENABLED
Value: false
```

---

## ⚠️ Important Notes

1. **Don't add** `DEV_AUTH_ENABLED=true` - use `false` for production
2. **Double-check** there are no extra spaces in the values
3. **Make sure** the values match EXACTLY what's in your .env file
4. After adding, click **"Save Changes"**
5. Render will **automatically redeploy** (takes 2-3 minutes)

---

## 🔍 How To Verify Variables Are There

In Render dashboard:
1. Go to Settings → Environment
2. You should see these variables listed:
   - ✅ DATABASE_URL
   - ✅ JWT_SECRET
   - ✅ OPENAI_API_KEY
   - ✅ SUPABASE_URL
   - ✅ SUPABASE_SERVICE_ROLE_KEY
   - ✅ SUPABASE_KEY
   - ❓ **FRONTEND_URL** ← CHECK THIS
   - ❓ **SESSION_SECRET** ← CHECK THIS
   - ❓ **SUPABASE_ANON_KEY** ← CHECK THIS
   - ❓ **SUPABASE_JWT_SECRET** ← CHECK THIS
   - ❓ **DEV_AUTH_ENABLED** ← CHECK THIS

---

## 🚨 Why Backend Is Down

The backend is crashing because `envValidator.js` checks for these variables on startup:

```javascript
const REQUIRED_PRODUCTION_VARS = [
  'DATABASE_URL',           // ✅ You have this
  'JWT_SECRET',            // ✅ You have this
  'SESSION_SECRET',        // ❌ MISSING IN RENDER
  'SUPABASE_URL',          // ✅ You have this
  'SUPABASE_SERVICE_ROLE_KEY', // ✅ You have this
  'SUPABASE_ANON_KEY',     // ❌ MISSING IN RENDER
  'SUPABASE_JWT_SECRET',   // ❌ MISSING IN RENDER
  'FRONTEND_URL',          // ❌ MISSING IN RENDER
];
```

When validation fails, the app exits with:
```
process.exit(1);  // Crashes the server
```

That's why you get 500 errors!

---

## ✅ After Adding Variables

1. Wait 2-3 minutes for Render to redeploy
2. Check Render logs for "Server running on 0.0.0.0:3000"
3. Run this test:
   ```powershell
   .\test-backend.ps1
   ```

You should see:
```
✅ Health check passed!
✅ Root endpoint passed!
✅ Registration passed!
```

---

## 🆘 Still Not Working?

Check Render logs:
1. Go to your service in Render
2. Click "Logs" tab
3. Look for the EXACT error message
4. It will tell you which variable is missing

Example error:
```
❌ Environment validation failed:
   - FRONTEND_URL is required
```

Then add that specific variable!
