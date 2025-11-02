# Registration Flow Test - October 17, 2025

## Test Session Log

### Test 1: Divorcee Registration

**Time Started:** [Current Time]

#### Step 1: Navigate to Registration
- URL: http://localhost:5174/
- Expected: Blue gradient background with registration form
- Status: ⏳

#### Step 2: Fill Registration Form
Test User Details:
- Full Name: `Sarah Johnson`
- Email: `sarah.test@example.com`
- Role: `Divorcee`
- Password: `testpass123`
- Confirm Password: `testpass123`

Action: Click "Register" button
- Expected: Redirect to `/role-setup?role=divorcee`
- Status: ⏳

#### Step 3: Complete Role Setup (Divorcee Profile)
Profile Details:
- Date of Birth: `1988-05-15`
- Residential Address: `456 Oak Street, Springfield, IL`
- Spouse's Name: `Michael Johnson`
- Preferred Language: `English`
- Children Involved: `2`

Action: Click "Save & Continue"
- Expected: 
  - Loading state shows "Saving..."
  - Redirect to `/dashboard`
  - User logged in with profile data
- Status: ⏳

#### Step 4: Verify Dashboard Access
- Expected:
  - Dashboard loads successfully
  - User name "Sarah Johnson" displays
  - Divorcee-specific dashboard content shows
- Status: ⏳

---

### Backend Logs to Monitor

Watch for these log entries:

**Registration:**
```
[auth:register] enter { ct: 'application/json', ... }
[auth:register] upserted test_users { email: 'sarah.test@example.com', ... }
[auth:register] ok { userId: '...', role: 'divorcee' }
```

**Profile Save:**
```
[users:profile:post] ENTER { userId: '...', role: 'divorcee' }
[users:profile:post] executing SQL { fieldsCount: ..., userId: '...' }
[users:profile:post] OK { userId: '...', role: 'divorcee' }
```

**Profile Fetch:**
```
[users:me:get] ENTER { userId: '...', ... }
[users:me:get] OK { userId: '...', role: 'divorcee' }
```

---

### Browser Console to Monitor

Watch for these console logs:

```
RegisterForm mounted
RegisterForm submit
[RoleSetupForm] Saving profile { role: 'divorcee', data: {...} }
[RoleSetupForm] Profile saved successfully
```

---

### Database Verification

After successful registration, check the database:

```sql
-- Check test_users table
SELECT id, email, created_at 
FROM test_users 
WHERE email = 'sarah.test@example.com';

-- Check app_users table (main profile)
SELECT user_id, email, name, role, phone, address, created_at, updated_at
FROM app_users 
WHERE email = 'sarah.test@example.com';
```

Expected results:
- ✅ Row exists in test_users
- ✅ Row exists in app_users
- ✅ name = 'Sarah Johnson'
- ✅ role = 'divorcee'
- ✅ address JSONB contains residential address
- ✅ phone and other fields populated

---

## Test Results

### ✅ Success Criteria
- [ ] Registration form displays correctly with blue background
- [ ] Form validation works (password match, required fields)
- [ ] Registration creates account successfully
- [ ] Token is saved to localStorage
- [ ] Redirect to role-setup page works
- [ ] Role-specific fields display correctly
- [ ] Profile form submits without errors
- [ ] Loading state shows during save
- [ ] Redirect to dashboard works
- [ ] Dashboard loads with user data
- [ ] Database records created correctly
- [ ] No console errors
- [ ] No backend errors

### 🐛 Issues Found
(Document any issues here)

---

## Next Test: Lawyer Registration

**Test User Details:**
- Full Name: `David Martinez`
- Email: `david.lawyer@example.com`
- Role: `Lawyer`
- Password: `testpass123`

**Profile Details:**
- Law Firm: `Martinez & Associates`
- Registration Number: `LAW-IL-12345`
- Office Address: `789 Legal Plaza, Suite 200, Chicago, IL`
- Client Management Preference: `Email and phone`

---

## Next Test: Mediator Registration

**Test User Details:**
- Full Name: `Dr. Emily Chen`
- Email: `emily.mediator@example.com`
- Role: `Mediator`
- Password: `testpass123`

**Profile Details:**
- Accreditation Number: `MED-2024-0789`
- Years of Experience: `12`
- Specialization: `Family Law & Custody`
- Availability: `Monday-Friday 9AM-6PM`
- Mediation Preference: `Both office and online`

---

## Instructions for Manual Testing

1. **Open Browser Developer Tools**
   - Press F12
   - Go to Console tab
   - Keep it open to monitor logs

2. **Start Fresh**
   - Clear localStorage: `localStorage.clear()`
   - Refresh page

3. **Test Registration Flow**
   - Click "Register" or navigate to http://localhost:5174/register
   - Fill form with test data
   - Submit and observe

4. **Test Role Setup**
   - Fill role-specific profile form
   - Submit and observe

5. **Verify Dashboard**
   - Check user data displays
   - Verify role-specific content

6. **Check Backend Terminal**
   - Look for successful log entries
   - Verify no errors

7. **Check Database** (Optional)
   - Use Supabase dashboard or SQL client
   - Verify records created

---

## Automated Testing Commands

```powershell
# Test registration endpoint
$body = @{
  email = "test.automated@example.com"
  password = "testpass123"
  name = "Automated Test"
  role = "divorcee"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

$token = ($response.Content | ConvertFrom-Json).token
Write-Host "Token: $token"

# Test profile endpoint
$profileBody = @{
  name = "Automated Test"
  phone = "555-9999"
  address = @{ street = "123 Test St" }
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4000/api/auth/profile" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $profileBody

# Test profile fetch
Invoke-WebRequest -Uri "http://localhost:4000/api/users/me" `
  -Headers @{ "Authorization" = "Bearer $token" }
```
