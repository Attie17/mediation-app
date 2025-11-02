# 🔐 DIVORCEE TEST USER - SIGN IN GUIDE

**Status:** Ready for Testing  
**Date:** October 23, 2025

---

## 🚀 QUICK ACCESS - THREE OPTIONS

### Option 1: Dev Login (EASIEST - Recommended) ⭐

**Use the built-in developer login tool:**

1. **Open this file in your browser:**
   ```
   file:///c:/mediation-app/dev-login.html
   ```
   
2. **Or just double-click:**
   - Navigate to `c:\mediation-app\`
   - Double-click `dev-login.html`

3. **Select Divorcee role** (click the 👤 Divorcee button)

4. **Click "Login as Divorcee"**

5. **Will auto-redirect** to your dashboard at `http://localhost:5173`

**That's it! No password needed!** ✨

---

### Option 2: Use Existing Test Users

**Best Test User: Bob Divorcee** (Has 1 active case)

```
Email:    bob@example.com
Password: Test123!
User ID:  22222222-2222-2222-2222-222222222222
Status:   ✅ Has 1 case assigned
```

**Alternative: Dashboard Test User** (Has 2 cases)

```
Email:    dashboard.divorcee@example.com
Password: Test123!
User ID:  33333333-3333-4333-8333-333333333333
Status:   ✅ Has 2 cases assigned
```

**Testing No-Case Scenario:**

```
Email:    test-divorcee-1760287975@example.com
Password: Test123!
User ID:  2055190c-de7e-5134-9a95-04d9b9585d39
Status:   ⚠️ No cases (will show empty state)
```

**Sign In Steps:**
1. Go to: `http://localhost:5173/signin`
2. Enter email and password
3. Click "Sign In"
4. Should redirect to `/divorcee` dashboard

---

### Option 3: Register New User

**Create your own test divorcee user:**

1. Go to: `http://localhost:5173/register`

2. Fill in the form:
   ```
   Name:              Your Name
   Email:             youremail@test.com
   Password:          Test123!
   Confirm Password:  Test123!
   Role:              Divorcee (select from toggle)
   ```

3. Click **Register**

4. Should auto-create account and redirect to `/divorcee`

---

## 📋 ALL AVAILABLE DIVORCEE TEST ACCOUNTS

| Email | Password | Cases | Status | Best For |
|-------|----------|-------|--------|----------|
| `bob@example.com` | `Test123!` | 1 | ✅ Ready | **Primary testing** |
| `dashboard.divorcee@example.com` | `Test123!` | 2 | ✅ Ready | Multiple cases |
| `test-divorcee-1760287975@example.com` | `Test123!` | 0 | ⚠️ Empty | Testing no-case state |
| `invited+1758982891708@example.com` | `Test123!` | 3 | ✅ Ready | Heavy testing |
| `invited+1758984061916@example.com` | `Test123!` | 1 | ✅ Ready | Alternative |

**Note:** If password doesn't work, try these alternatives:
- `Test123!`
- `test123`
- `testpass123`
- Or just use **Dev Login** (no password needed!)

---

## 🎯 AFTER SIGNING IN

### What You Should See:

1. **URL Changes to:**
   ```
   http://localhost:5173/divorcee
   ```

2. **Dashboard Displays:**
   - ✅ Welcome header with your name
   - ✅ Progress card (X/16 documents)
   - ✅ Next Steps card
   - ✅ Document panel with topics
   - ✅ Sessions card (empty state)
   - ✅ Activity card (empty state)
   - ✅ Help section with buttons

3. **No Errors:**
   - Check browser console (F12) - should be no red errors

---

## 🔍 VERIFICATION CHECKLIST

After signing in, verify:

- [ ] You see "Welcome back, [Name]!"
- [ ] URL is at `/divorcee`
- [ ] Progress bar shows (even if 0/16)
- [ ] Document panel displays 4 topic sections
- [ ] Chat button visible at bottom
- [ ] No console errors (F12)

---

## 🐛 TROUBLESHOOTING

### "Invalid credentials" error
**Solutions:**
1. Use **Dev Login** instead (no password needed)
2. Try password: `Test123!`
3. Register a new account
4. Check servers are running: `npm run start`

### Redirects back to home page
**Solutions:**
1. Check browser console for errors
2. Clear localStorage: F12 → Application → Local Storage → Clear
3. Try **Dev Login** method
4. Check if user has correct role in database

### Dashboard doesn't load
**Solutions:**
1. Verify you're at correct URL: `http://localhost:5173/divorcee`
2. Check backend is running on port 4000
3. Open console (F12) to see error messages
4. Try refreshing page (F5)

### "Failed to load stats" error
**Solutions:**
1. Backend may not be running
2. Database connection issue
3. Check backend terminal for errors
4. Restart servers: `npm run kill` then `npm run start`

---

## 🎮 KEYBOARD SHORTCUTS (Dev Login)

When on the `dev-login.html` page:
- Press `1` - Select Admin
- Press `2` - Select Mediator
- Press `3` - Select Divorcee ⭐
- Press `4` - Select Lawyer
- Press `Enter` - Login as selected role

---

## 🔐 TECHNICAL DETAILS

### Authentication Flow

**Method 1: Dev Login**
```
1. Open dev-login.html
2. Select role
3. Sets localStorage:
   - token: 'dev-fake-token'
   - user: {id, email, name, role}
   - devMode: 'true'
4. Redirects to app
5. App uses dev credentials
```

**Method 2: Real Login**
```
1. POST /api/auth/signin
2. Backend validates credentials
3. Returns JWT token
4. Frontend stores token + user
5. Redirects to role dashboard
```

### Storage After Login

**localStorage contains:**
```javascript
{
  "token": "eyJhbGci...",  // JWT token
  "user": {
    "id": "uuid",
    "email": "bob@example.com",
    "name": "Bob Divorcee",
    "role": "divorcee"
  },
  "activeCaseId": "4",  // May be set
  "devMode": "true"     // If using dev login
}
```

### API Endpoints Used

After sign in, dashboard makes these calls:
```
GET /api/users/me
GET /dashboard/stats/divorcee/:userId
GET /api/cases/user/:userId
GET /api/cases/:caseId/uploads
```

---

## 📚 RELATED FILES

- **Dev Login:** `c:\mediation-app\dev-login.html`
- **Sign In Page:** `frontend/src/pages/SignInForm.jsx`
- **Register Page:** `frontend/src/pages/RegisterForm.jsx`
- **Divorcee Dashboard:** `frontend/src/routes/divorcee/index.jsx`
- **Auth Backend:** `backend/src/routes/auth.js`

---

## ✅ RECOMMENDED TESTING FLOW

**For quickest results:**

1. ✅ **Double-click** `dev-login.html` in file explorer
2. ✅ **Click** Divorcee button
3. ✅ **Click** "Login as Divorcee"
4. ✅ **Wait** 2 seconds for auto-redirect
5. ✅ **Verify** dashboard loads at `/divorcee`

**Total time: < 30 seconds** ⚡

---

## 🎉 YOU'RE IN!

Once signed in successfully, you should see:

```
┌─────────────────────────────────────────────┐
│  Welcome back, [Your Name]!                 │
│  Let's continue your mediation journey.     │
│                                             │
│  📊 Your Progress          ⏰ Next Steps    │
│  ████░░░░░░░ 5/16          1. Upload docs   │
│                            2. Review draft   │
│                            3. Schedule...    │
│                                             │
│  📁 Required Documents                      │
│  [Financial] [Personal] [Children] [Assets] │
│                                             │
│  📅 Upcoming Session      💬 Recent Activity│
│  No sessions scheduled    No activity       │
│                                             │
│  ❓ Need Help?                              │
│  [Privacy] [Expect] [FAQ] [💬 Chat]        │
└─────────────────────────────────────────────┘
```

**Start testing the features!** 🚀

---

**Questions? Check:**
- `DIVORCEE_TESTING_GUIDE.md` - Full testing instructions
- `DIVORCEE_SECTION_DIAGNOSTIC_REPORT.md` - Technical details
- Browser console (F12) - For real-time debugging

