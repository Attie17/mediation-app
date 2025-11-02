# Auth & Onboarding Flow - Testing Guide

**Date:** October 17, 2025  
**Sprint:** Auth & Onboarding Implementation

---

## Changes Implemented

### 1. Backend Profile Endpoint
**File:** `backend/src/routes/users.js`

Added `POST /api/users/profile` endpoint that:
- Accepts role-specific profile fields (name, phone, address, officeAddress, etc.)
- Maps different field names to standard app_users schema
- Updates user profile in app_users table
- Returns updated user object
- Includes comprehensive error handling and logging

**Supported Fields:**
- Common: name, preferredName, phone, address, avatarUrl, role
- Lawyer: officeAddress (mapped to address.street)
- Divorcee: address (string or object)
- All role-specific fields from RoleSetupForm

### 2. Frontend RoleSetupForm
**File:** `frontend/src/pages/RoleSetupForm.jsx`

Updated to:
- Import useAuth and apiFetch
- Use user's role from auth context (fallback to URL param)
- Call `/api/users/profile` endpoint on form submit
- Handle loading states and errors
- Refresh user data after successful save
- Redirect to `/dashboard` on success

### 3. Registration Redirect Flow
**File:** `frontend/src/pages/RegisterForm.jsx`

Changed redirect behavior:
- **Before:** Register → `/dashboard`
- **After:** Register → `/role-setup?role={role}`

This ensures users complete their profile before accessing the app.

---

## Testing Instructions

### Test 1: New User Registration Flow

**URL:** http://localhost:5174/

#### Step 1: Register
1. Navigate to http://localhost:5174/ (or click "Register" if on sign-in page)
2. Fill in registration form:
   - Full name: `Test User`
   - Email: `testuser@example.com`
   - Role: Select `Divorcee`
   - Password: `password123`
   - Confirm password: `password123`
3. Click "Register"

**Expected:**
- ✅ No console errors
- ✅ Redirect to `/role-setup?role=divorcee`
- ✅ Token saved in localStorage
- ✅ Backend logs show successful registration

#### Step 2: Role Setup (Divorcee)
1. Should see "Divorcee Setup" heading
2. Fill in profile fields:
   - Date of Birth: `1990-01-01`
   - Residential Address: `123 Main St, City`
   - Spouse's Name: `Jane Doe` (optional)
   - Preferred Language: `English`
   - Children Involved: `2` (optional)
3. Click "Save & Continue"

**Expected:**
- ✅ Loading state shows "Saving..."
- ✅ No errors
- ✅ Console shows `[RoleSetupForm] Profile saved successfully`
- ✅ Redirect to `/dashboard`
- ✅ Dashboard loads with user data

#### Step 3: Verify Data in Database
```sql
SELECT user_id, email, name, role, phone, address, created_at, updated_at
FROM app_users
WHERE email = 'testuser@example.com';
```

**Expected:**
- ✅ Row exists with correct email
- ✅ name = 'Test User'
- ✅ role = 'divorcee'
- ✅ address contains residential address data

---

### Test 2: Lawyer Registration

#### Step 1: Register as Lawyer
1. Navigate to http://localhost:5174/
2. Fill in form:
   - Full name: `John Attorney`
   - Email: `lawyer@example.com`
   - Role: Select `Lawyer`
   - Password: `password123`
3. Click "Register"

**Expected:**
- ✅ Redirect to `/role-setup?role=lawyer`

#### Step 2: Lawyer Profile Setup
1. Should see "Lawyer Setup" heading
2. Fill in lawyer-specific fields:
   - Law Firm / Practice Name: `Smith & Associates`
   - Registration Number: `LAW12345`
   - Office Address: `456 Legal Blvd, Suite 100`
   - Client Management Preference: `Email preferred`
3. Click "Save & Continue"

**Expected:**
- ✅ Profile saved successfully
- ✅ Redirect to `/dashboard`
- ✅ address field contains office address in database

---

### Test 3: Mediator Registration

#### Step 1: Register as Mediator
- Email: `mediator@example.com`
- Role: `Mediator`

#### Step 2: Mediator Profile Setup
Fill in:
- Accreditation Number: `MED-2024-001`
- Years of Experience: `10`
- Specialization: `Family Law`
- Availability: `Mon-Fri 9am-5pm`
- Mediation Preference: `Both office and online`

**Expected:**
- ✅ All fields save correctly
- ✅ Redirect to dashboard

---

### Test 4: Validation & Error Handling

#### Test 4a: Empty Form Submission
1. Go to role setup page
2. Click "Save & Continue" without filling fields
3. Browser should prevent submission (required fields)

#### Test 4b: Backend Error Simulation
1. Stop backend server
2. Try to submit profile form
3. **Expected:** Error message displays: "Failed to save profile"

#### Test 4c: Unauthorized Access
1. Clear localStorage token
2. Try to access `/api/users/profile` directly
3. **Expected:** 401 Unauthorized response

---

## Manual Testing Checklist

### Registration Flow
- [ ] Can access registration page at `/`
- [ ] Form validates required fields (email, password, confirm password)
- [ ] Password mismatch shows error
- [ ] Successful registration redirects to role-setup
- [ ] Token is saved in localStorage
- [ ] User data is created in app_users table

### Role Setup Flow
- [ ] Role setup page loads with correct role fields
- [ ] URL parameter `?role={role}` determines which fields show
- [ ] All role-specific forms render correctly (divorcee, lawyer, mediator, admin)
- [ ] Form submission shows loading state
- [ ] Successful save redirects to dashboard
- [ ] Failed save shows error message
- [ ] Profile data saves to app_users table

### Auth Context Integration
- [ ] AuthContext.register() successfully creates account
- [ ] Token is automatically used for subsequent API calls
- [ ] refreshMe() updates user data after profile save
- [ ] User object contains all saved profile fields
- [ ] Logout clears token and user data

### Dashboard Access
- [ ] Dashboard loads after completing profile
- [ ] User name displays correctly
- [ ] Role-specific dashboard content shows
- [ ] Protected routes require authentication

---

## Backend API Testing

### Test Profile Endpoint with curl

```powershell
# 1. Register a new user
$registerBody = @{
  email = "curltest@example.com"
  password = "password123"
  name = "Curl Test"
  role = "divorcee"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $registerBody

$token = ($response.Content | ConvertFrom-Json).token

# 2. Save profile
$profileBody = @{
  name = "Curl Test Updated"
  phone = "555-1234"
  address = @{
    street = "789 Test Ave"
  }
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4000/api/users/profile" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $profileBody

# 3. Fetch profile
Invoke-WebRequest -Uri "http://localhost:4000/api/users/me" `
  -Headers @{ "Authorization" = "Bearer $token" }
```

---

## Known Issues & Edge Cases

### ✅ Handled
- Password mismatch validation
- Required field validation
- Token persistence across page reloads
- Role-specific field mapping
- Error messages for network failures
- Loading states during async operations

### 🔧 To Be Addressed
1. **File upload fields** in RoleSetupForm (supportDocs) - currently type="file" but not wired to backend
2. **Profile completion flag** - No database field to track if profile is complete (optional enhancement)
3. **Email verification** - No email verification step (future enhancement)
4. **Password strength indicator** - Basic minLength validation only
5. **Address autocomplete** - Manual text entry, could add Google Places API

---

## Success Criteria

✅ User can register and create account  
✅ User is redirected to role-specific setup page  
✅ User can fill and submit profile form  
✅ Profile data saves to app_users table  
✅ User is redirected to dashboard after setup  
✅ Dashboard loads with correct user data  
✅ All role types work (divorcee, lawyer, mediator, admin)  
✅ Error handling works for validation and network errors  
✅ Loading states provide feedback during async operations  

---

## Next Steps After Testing

1. **If tests pass:** Mark sprint complete, update docs, commit changes
2. **If tests fail:** Debug issues, fix bugs, re-test
3. **Follow-up enhancements:**
   - Add file upload handling for lawyer/mediator documents
   - Add profile completion tracking
   - Add email verification
   - Improve validation with real-time feedback
   - Add password strength meter

---

## Test Results

### Test Session: [DATE]
**Tester:** [NAME]

| Test | Status | Notes |
|------|--------|-------|
| Register Divorcee | ⏳ | |
| Divorcee Profile Setup | ⏳ | |
| Register Lawyer | ⏳ | |
| Lawyer Profile Setup | ⏳ | |
| Register Mediator | ⏳ | |
| Mediator Profile Setup | ⏳ | |
| Error Handling | ⏳ | |
| Database Verification | ⏳ | |

---

## Console Monitoring

During testing, monitor browser console for:
```
[RegisterForm] submit
[auth:register] enter
[auth:register] ok
[RoleSetupForm] Saving profile
[users:profile:post] ENTER
[users:profile:post] OK
[RoleSetupForm] Profile saved successfully
```

Monitor backend terminal for:
```
[auth:register] enter { ct: 'application/json', type: 'object', keys: [...] }
[auth:register] upserted test_users { email: '...', rowId: '...' }
[auth:register] ok { userId: '...', role: '...' }
[users:profile:post] ENTER { userId: '...', role: '...' }
[users:profile:post] executing SQL { fieldsCount: 3, userId: '...' }
[users:profile:post] OK { userId: '...', role: '...' }
```
