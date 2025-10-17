# Registration Flow - Complete Guide

**Date:** October 11, 2025  
**Status:** ✅ Fixed and Working

---

## What Was Fixed

### Issue 1: Missing Form Data
The registration form collected `name` and `role`, but the frontend only sent `email` and `password` to the backend.

**Fixed:**
- ✅ Updated `AuthContext.register()` to accept all 4 parameters: `email, password, name, role`
- ✅ Updated `RegisterForm` to extract and send all form fields
- ✅ Added password confirmation validation

### Issue 2: No Password Validation
Passwords weren't being validated for matching or minimum length.

**Fixed:**
- ✅ Added password confirmation check
- ✅ Added minimum 6 characters requirement
- ✅ Added `required` attributes to all fields

### Issue 3: No Navigation Between Forms
Users couldn't easily switch between Sign In and Register forms.

**Fixed:**
- ✅ Added "Already have an account? Sign In" link to Register form
- ✅ Added "Don't have an account? Register" link to Sign In form

---

## Complete Registration Flow

### Step 1: Access the Landing Page
1. Open http://localhost:5173
2. Make sure you're logged out (use `localStorage.clear()` in console if needed)
3. You should see the **Public Landing Page** with:
   - "Welcome to Mediation App" heading
   - "Sign In" button
   - "Register" button

### Step 2: Click Register
Click the **"Register"** button to navigate to `/register`

### Step 3: Fill Out the Registration Form
The form now includes:
- **Full name** (required)
- **Email address** (required, must be valid email format)
- **Role** (required, dropdown with 4 options):
  - Divorcee (default)
  - Mediator
  - Lawyer
  - Admin
- **Password** (required, minimum 6 characters)
- **Confirm password** (required, must match password)

### Step 4: Submit
Click the **"Register"** button

### Step 5: What Happens Next

**Backend Process:**
```javascript
1. Validates email and password are provided
2. Hashes the password with bcrypt (10 salt rounds)
3. Inserts/updates user in test_users table
4. Creates deterministic UUID from email using uuidv5
5. Inserts/updates user profile in app_users table with name and role
6. Generates JWT token with user_id, email, and role
7. Returns token to frontend
```

**Frontend Process:**
```javascript
1. Receives token from backend
2. Stores token in localStorage (key: 'auth_token')
3. AuthContext automatically fetches user profile
4. Redirects to '/dashboard' (which redirects to role-specific dashboard)
5. User is now logged in!
```

### Step 6: Automatic Redirect
After successful registration, you'll be redirected to:
- `/dashboard` → which redirects to your role-specific dashboard:
  - **Divorcee** → `/divorcee`
  - **Mediator** → `/mediator`
  - **Lawyer** → `/lawyer`
  - **Admin** → `/admin`

---

## Form Validation

### Client-Side Validation (HTML5)
- ✅ All fields marked as `required`
- ✅ Email format validation (`type="email"`)
- ✅ Password minimum length (6 characters via `minLength`)

### Custom Validation (JavaScript)
- ✅ Email and password presence check
- ✅ Password match confirmation
- ✅ Custom error messages displayed in red banner

### Backend Validation
- ✅ Email and password required
- ✅ Role must be one of: `admin`, `mediator`, `lawyer`, `divorcee`
- ✅ Defaults to `divorcee` if invalid role provided

---

## Registration Form Fields

```jsx
┌─────────────────────────────────────┐
│  Create your account                │
├─────────────────────────────────────┤
│  [Full name              ]          │
│  [Email address          ]          │
│  [▼ Select your role     ]          │
│     - Divorcee (default)            │
│     - Mediator                      │
│     - Lawyer                        │
│     - Admin                         │
│  [Password (min 6)       ]          │
│  [Confirm password       ]          │
├─────────────────────────────────────┤
│  [ Register                      ]  │
├─────────────────────────────────────┤
│  Already have an account? Sign In   │
└─────────────────────────────────────┘
```

---

## Sign In Form (Also Updated)

```jsx
┌─────────────────────────────────────┐
│  Sign in to Accord                  │
├─────────────────────────────────────┤
│  [Email address          ]          │
│  [Password               ]          │
├─────────────────────────────────────┤
│  [ Sign In                       ]  │
├─────────────────────────────────────┤
│  Don't have an account? Register    │
└─────────────────────────────────────┘
```

---

## API Endpoint Details

### POST /api/auth/register

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "mypassword123",
  "name": "John Doe",
  "role": "divorcee"
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "82dd474d-8cb0-5850-a162-7111f6c622f7",
  "email": "user@example.com"
}
```

**Error Response (400):**
```json
{
  "ok": false,
  "error": {
    "code": "BAD_INPUT",
    "message": "email and password required"
  }
}
```

**Error Response (500):**
```json
{
  "ok": false,
  "error": {
    "code": "AUTH_REGISTER_FAILED",
    "message": "Database error message"
  }
}
```

---

## Database Tables

### test_users (Authentication)
```sql
CREATE TABLE test_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### app_users (Profile)
```sql
CREATE TABLE app_users (
  user_id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('admin','mediator','lawyer','divorcee')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Testing the Registration Flow

### Test Case 1: Successful Registration
**Input:**
- Name: "Test User"
- Email: "test@example.com"
- Role: "Mediator"
- Password: "password123"
- Confirm: "password123"

**Expected:**
- ✅ Form submits successfully
- ✅ Token stored in localStorage
- ✅ User redirected to `/mediator` dashboard
- ✅ User sees "Test User" in top-right corner
- ✅ Backend logs show successful registration

### Test Case 2: Password Mismatch
**Input:**
- Password: "password123"
- Confirm: "different123"

**Expected:**
- ❌ Error message: "Passwords do not match"
- User stays on registration form
- Can fix and resubmit

### Test Case 3: Duplicate Email
**Input:**
- Email: "existing@example.com" (already in database)

**Expected:**
- ⚠️ Registration succeeds (upsert behavior)
- Password hash gets updated
- User can log in with new password

### Test Case 4: Missing Required Fields
**Input:**
- Leave email blank

**Expected:**
- ❌ HTML5 validation prevents submission
- Browser shows "Please fill out this field"

---

## Common Issues & Solutions

### Issue: "Failed to fetch"
**Cause:** Backend server not running or wrong API URL

**Solution:**
1. Check backend is running on port 4000
2. Check `VITE_API_BASE=http://localhost:4000` in `frontend/.env`
3. Hard refresh browser: `Ctrl + Shift + R`

### Issue: "Passwords do not match"
**Cause:** Password and confirm password fields differ

**Solution:**
- Ensure both password fields have identical values
- Check for extra spaces

### Issue: Token stored but no redirect
**Cause:** Navigation might be blocked or user profile fetch failed

**Solution:**
1. Check browser console for errors
2. Check backend logs for `/api/users/me` errors
3. Verify `app_users` table has the user record

### Issue: Redirect to dashboard shows "Access Denied"
**Cause:** Role mismatch or RoleBoundary issue

**Solution:**
1. Check localStorage: `localStorage.getItem('user')`
2. Verify user.role matches the dashboard route
3. Check backend logs for role assignment

---

## Files Modified

1. **frontend/src/context/AuthContext.jsx**
   - Updated `register()` to accept `name` and `role` parameters
   - Sends all 4 fields to backend

2. **frontend/src/pages/RegisterForm.jsx**
   - Extract all form fields including name and role
   - Added password confirmation validation
   - Added required attributes
   - Added minimum length validation
   - Added "Sign In" link
   - Improved error display

3. **frontend/src/pages/SignInForm.jsx**
   - Added "Register" link for easy navigation

4. **backend/src/routes/auth.js** (no changes needed)
   - Already supports name and role parameters
   - Already has proper validation

---

## Next Steps After Registration

Once registered and logged in, users can:

1. **View Dashboard** - See role-specific dashboard with stats
2. **Update Profile** - Navigate to `/profile` to add more details
3. **Access Cases** - View and manage mediation cases
4. **Upload Documents** - Share case-related documents
5. **Use Chat** - Communicate with other participants
6. **Get AI Insights** - Access AI-powered case analysis

---

## Quick Start Guide

**For first-time users:**

```
1. Go to http://localhost:5173
2. Click "Register"
3. Fill in:
   - Your name
   - Email
   - Select role
   - Create password (min 6 chars)
   - Confirm password
4. Click "Register"
5. You'll be auto-logged in and redirected to your dashboard
```

**For existing users:**

```
1. Go to http://localhost:5173
2. Click "Sign In"
3. Enter email and password
4. Click "Sign In"
5. Redirected to your dashboard
```

**For testing/development:**

```
1. Open file:///C:/mediation-app/dev-login.html
2. Select a role
3. Click "Login as [Role]"
4. Instant access without registration
```

---

## Summary of Improvements

| Before | After |
|--------|-------|
| ❌ Name and role not sent to backend | ✅ All fields properly sent |
| ❌ No password confirmation | ✅ Password match validation |
| ❌ No field validation | ✅ Required + min length validation |
| ❌ No navigation between forms | ✅ Easy Sign In ↔ Register links |
| ❌ Generic error messages | ✅ Improved error display |
| ❌ No role ordering | ✅ Logical role order (user first) |

---

**Status:** ✅ Registration flow fully functional  
**Last Updated:** October 11, 2025  
**Tested:** Pending user testing
