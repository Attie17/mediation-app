# End-to-End Testing Session - Case Creation Flow

**Date**: October 18, 2025  
**Test Objective**: Verify complete case creation workflow from login to case detail view  
**Status**: 🧪 IN PROGRESS

---

## 📋 Pre-Test Checklist

- [x] Backend running on port 4000
- [x] Frontend running on port 5173 or 5174
- [ ] Browser console open (F12)
- [ ] Network tab open to monitor API calls

---

## 🎯 Test Flow Overview

```
Login → Dashboard → Create Case → Complete Wizard → Submit → View Case Details
```

**Estimated Time**: 10-15 minutes

---

## Test 1: Login as Divorcee

### Test User
**Email**: `divorcee@test.com`  
**Password**: `div123`  
**Expected Role**: divorcee

### Steps
1. Open http://localhost:5173 (or 5174)
2. Click "Sign In" (should be on homepage)
3. Enter email: `divorcee@test.com`
4. Enter password: `div123`
5. Click "Sign In" button

### ✅ Success Criteria
- [ ] No errors in console
- [ ] Successfully redirected to /dashboard
- [ ] Can see "Hello [name], here is your dashboard" message
- [ ] localStorage contains 'token' and 'user' keys

### 🐛 Debug if Failed
```javascript
// Check in browser console (F12):
localStorage.getItem('user')
localStorage.getItem('token')
```

**Expected user object**:
```json
{
  "id": "86baaef1-1d52-54d3-97e9-a424da4113f9",
  "email": "divorcee@test.com",
  "role": "divorcee",
  "name": "Test Divorcee"
}
```

---

## Test 2: Dashboard Display

### What to Check

#### A. "+ Create New Case" Button
- [ ] Button is visible
- [ ] Button has white/20 background (stands out)
- [ ] Text says "+ Create New Case"

**If button not visible**:
- Check user.role in localStorage
- Should be exactly 'divorcee' (lowercase)

#### B. Stats Grid
- [ ] Stats grid appears (2-column layout)
- [ ] Shows loading briefly or immediately shows data
- [ ] No "Failed to load stats" error

**Expected Stats** (for new user with no cases):
```
Case Status: no_case
Documents Uploaded: 0
Documents Pending: 0
Unread Messages: 0
```

#### C. Cases List
- [ ] Shows "Your Cases" heading
- [ ] Shows "No cases yet. Click 'Create New Case' to get started." message
- [ ] OR shows list of existing cases (if you've created before)

### 🐛 Debug if Failed

**Check Network tab**:
- Look for call to `/api/dashboard/stats/divorcee/[userId]`
- Should return 200 OK
- Response should have `{ ok: true, stats: {...} }`

**Check backend terminal**:
- Should see: `📊 Fetching divorcee stats for user: [userId]`

---

## Test 3: Navigate to Case Creation

### Steps
1. Click "+ Create New Case" button
2. Wait for page to load

### ✅ Success Criteria
- [ ] URL changes to `/intake`
- [ ] Intake form wizard appears
- [ ] Step indicator shows "1/7" or similar
- [ ] First step shows "Case Details" fields

### 🐛 Debug if Failed
- Check console for routing errors
- Verify `/intake` route exists in App.jsx
- Check PrivateRoute is passing authentication

---

## Test 4: Complete Case Creation Wizard

### Step 0: Case Details (NEW!)
**Fields**:
- Case Title (required) ✏️
- Case Description (optional) ✏️

**Test Input**:
```
Title: "Test Divorce Case - Oct 18"
Description: "End-to-end testing of case creation workflow"
```

**Actions**:
- [ ] Enter title
- [ ] Enter description
- [ ] Click "Next"

**Validation Check**:
- [ ] Cannot proceed without title
- [ ] Shows error if clicking Next with empty title

---

### Step 1: Personal Info
**Fields**:
- Full Name (required)
- Date of Birth (required)
- Email (required)
- Phone (required)
- Address (required)

**Test Input** (use your preferences or):
```
Name: Test User
DOB: 1990-01-01
Email: testuser@example.com
Phone: (555) 123-4567
Address: 123 Test St, Test City, TS 12345
```

**Actions**:
- [ ] All fields accept input
- [ ] Date picker works for DOB
- [ ] Click "Next"

**Validation Check**:
- [ ] Cannot proceed with empty required fields
- [ ] Shows validation errors

---

### Step 2: Marriage Details
**Fields**:
- Date of Marriage (required)
- Date of Separation (required)
- Place of Marriage (required)

**Test Input**:
```
Marriage Date: 2015-06-15
Separation Date: 2024-01-01
Place: Las Vegas, NV
```

**Actions**:
- [ ] Date pickers work
- [ ] Text field accepts place
- [ ] Click "Next"

---

### Step 3: Children (Optional)
**Test Scenarios**:

**Scenario A: No Children**
- [ ] Click "Next" without adding children

**Scenario B: With Children** (recommended for full test)
- [ ] Click "Add Child"
- [ ] Fill in child details:
  ```
  Name: Child One
  Birthdate: 2018-03-15
  Notes: First child
  ```
- [ ] Click "Add Child" again for second child
- [ ] Fill in second child
- [ ] Click "Remove" on first child (test removal)
- [ ] Re-add first child
- [ ] Click "Next"

---

### Step 4: Financial Situation
**Fields**:
- Employment Status (required)
- Monthly Income (required)
- Monthly Expenses (required)
- Assets (optional)
- Debts (optional)
- File uploads (optional)

**Test Input**:
```
Employment: Employed Full-Time
Income: 5000
Expenses: 3500
Assets: House, Car
Debts: Mortgage, Credit Card
```

**Actions**:
- [ ] All fields accept input
- [ ] Number fields accept numbers only
- [ ] File uploads work (optional - can skip for speed)
- [ ] Click "Next"

---

### Step 5: Preferences/Concerns
**Fields**:
- Custody Preference (required dropdown)
- Main Concerns (optional)
- Notes (optional)

**Test Input**:
```
Custody: Joint Custody
Concerns: Fair division of assets
Notes: Amicable divorce process preferred
```

**Actions**:
- [ ] Dropdown works
- [ ] Text fields accept input
- [ ] Click "Next"

---

### Step 6: Summary
**What to Check**:
- [ ] All entered information displays correctly
- [ ] Can see case title and description
- [ ] Personal info shows
- [ ] Marriage details show
- [ ] Children show (if added)
- [ ] Financial info shows
- [ ] Preferences show

**Actions**:
- [ ] Review all information
- [ ] Click "Submit" button
- [ ] Watch for success message

---

## Test 5: Verify Case Submission

### Watch Backend Terminal
Look for these log messages:
```
🆕 POST /api/cases - Creating new case
✅ Found X cases for user [userId]
```

### Watch Browser
- [ ] Success message appears
- [ ] Loading indicator shows (optional)
- [ ] After ~1.5 seconds, redirects to /dashboard

### ✅ Success Criteria
- [ ] No errors in console
- [ ] No errors in backend logs
- [ ] Redirected to dashboard
- [ ] Success message showed before redirect

### 🐛 Debug if Failed

**Common Issues**:

1. **401 Unauthorized**
   - Check token in localStorage
   - Re-login and try again

2. **400 Missing required personal info**
   - Check all Step 1 fields were filled
   - Verify payload structure in Network tab

3. **500 Server Error**
   - Check backend terminal for detailed error
   - Check database connection
   - Verify Supabase credentials

---

## Test 6: Dashboard After Case Creation

### What Should Change
- [ ] "Your Cases (1)" heading appears
- [ ] Case card displays with title "Test Divorce Case - Oct 18"
- [ ] Status shows "Open"
- [ ] Description shows (truncated)
- [ ] Stats may update (documents uploaded, pending, etc.)

### Case Card Format
```
┌─────────────────────────────────────┐
│ Test Divorce Case - Oct 18          │
│ Status: Open                        │
│ End-to-end testing of case...      │
└─────────────────────────────────────┘
```

### ✅ Success Criteria
- [ ] Case appears in list
- [ ] Title is correct
- [ ] Card is clickable (hover effect)
- [ ] No errors in console

---

## Test 7: Case Detail Page

### Steps
1. Click on the newly created case card
2. Wait for page to load

### URL Check
- [ ] URL changes to `/case/[caseId]`

### Page Sections to Verify

#### A. Case Header
- [ ] Title shows: "Test Divorce Case - Oct 18"
- [ ] Description shows
- [ ] Created date shows (today's date)
- [ ] Progress percentage shows (likely 0% for new case)
- [ ] Progress bar displays

#### B. Stats Grid (4 cards)
- [ ] Total Documents: ~12 (from "Default Divorce" template)
- [ ] Confirmed: 0 (green card)
- [ ] Pending Review: 0 (yellow card)
- [ ] Missing: 12 (red card)

#### C. Document Requirements Section
- [ ] Shows "Document Requirements" heading
- [ ] List of ~12 documents displays
- [ ] Each has a status indicator (gray dots for missing)
- [ ] Document names formatted nicely (e.g., "Marriage Certificate")
- [ ] Shows "Required" or "Optional" for each

**Expected Documents** (from Default Divorce template):
- Marriage Certificate
- Tax Returns
- Bank Statements
- Pay Stubs
- Property Deeds
- Vehicle Titles
- Retirement Account Statements
- Credit Card Statements
- Loan Documents
- Insurance Policies
- (and more...)

#### D. Participants Panel
- [ ] Shows "Participants" heading
- [ ] Shows you as "Divorcee"
- [ ] Displays user name or "User"

#### E. Recent Documents Section
- [ ] Shows "Recent Documents" heading
- [ ] Either empty or shows "No documents yet"
- [ ] (Will populate when documents are uploaded)

#### F. AI Insights Section
- [ ] AI Insights component loads
- [ ] No errors displayed

### ✅ Success Criteria
- [ ] All sections load without errors
- [ ] Data is accurate
- [ ] Progress bar shows 0% (or correct percentage)
- [ ] Requirements list is complete
- [ ] Visual design looks polished

### 🐛 Debug if Failed

**Check Network tab**:
- Look for call to `/api/dashboard/cases/[caseId]/dashboard?userId=X&userRole=divorcee`
- Should return 200 OK
- Response should have case, participants, requirements, uploads, stats

**Check backend terminal**:
- Should see: `📊 Fetching dashboard data for case ID: [caseId]`

---

## Test 8: Database Verification (Optional)

### Check Case in Database

**Access Supabase Dashboard**: https://supabase.com  
**Project**: kjmwaoainmyzbmvalizu

**Run SQL Query**:
```sql
-- Get the newly created case
SELECT id, title, description, status, created_at 
FROM cases 
ORDER BY created_at DESC 
LIMIT 1;

-- Check requirements were seeded
SELECT COUNT(*) as requirement_count
FROM case_requirements 
WHERE case_id = '<your-case-id>';

-- Check participant was added
SELECT * FROM case_participants
WHERE case_id = '<your-case-id>';

-- Check children were added (if you added any)
SELECT * FROM case_children
WHERE case_id = '<your-case-id>';
```

### ✅ Expected Results
- [ ] Case exists with correct title
- [ ] ~12 requirements seeded
- [ ] 1 participant (you as divorcee)
- [ ] Children records match what you entered

---

## 📊 Test Summary

### Overall Test Status
- [ ] Login: ✅ Passed / ❌ Failed
- [ ] Dashboard Display: ✅ Passed / ❌ Failed
- [ ] Navigate to Intake: ✅ Passed / ❌ Failed
- [ ] Complete Wizard: ✅ Passed / ❌ Failed
- [ ] Submit Case: ✅ Passed / ❌ Failed
- [ ] Dashboard Update: ✅ Passed / ❌ Failed
- [ ] Case Detail Page: ✅ Passed / ❌ Failed

### Issues Found
```
Issue #1: [Description]
- Steps to reproduce:
- Expected:
- Actual:
- Console errors:
- Backend errors:

Issue #2: [Description]
...
```

### Performance Notes
- Login time: ___ seconds
- Wizard load time: ___ seconds
- Case submission time: ___ seconds
- Case detail load time: ___ seconds

---

## 🎉 Success Metrics

**Test is PASSING if**:
- ✅ Can login as divorcee
- ✅ Dashboard loads with "Create New Case" button
- ✅ Can complete all 7 wizard steps
- ✅ Case submits successfully
- ✅ Redirects back to dashboard
- ✅ Case appears with custom title
- ✅ Case detail page shows all sections
- ✅ No console or backend errors

**Test is FAILING if**:
- ❌ Cannot login
- ❌ Wizard doesn't load
- ❌ Submit fails with errors
- ❌ Case doesn't appear on dashboard
- ❌ Case detail page shows errors

---

## 🚀 Next Steps After Testing

### If All Tests Pass ✅
1. Mark todo items as complete
2. Document any observations
3. Move to Option B: Connect Mediator Dashboard
4. Test document upload workflow

### If Tests Fail ❌
1. Document all errors
2. Fix issues one by one
3. Re-test after each fix
4. Update this document with solutions

---

## 📝 Notes & Observations

```
[Space for tester notes]





```

---

**Tester**: ___________  
**Date Completed**: ___________  
**Duration**: ___________ minutes  
**Final Status**: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL
