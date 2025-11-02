# Case Creation Flow - Testing Guide

## Changes Made

### 1. Dashboard Enhancement
**File**: `frontend/src/pages/Dashboard.jsx`
- Added "Create New Case" button (visible for divorcees only)
- Button navigates to `/intake` route
- Styled with white/20 background to stand out

### 2. Routing Setup
**File**: `frontend/src/App.jsx`
- Imported `DivorceeIntakeForm` component
- Added `/intake` route wrapped in `PrivateRoute`
- Route renders within HomePage layout

### 3. Form Integration
**File**: `frontend/src/components/DivorceeIntakeForm.jsx`
- Updated `handleSubmit()` to send single API call matching backend structure
- Removed `userId` prop requirement (uses auth token instead)
- Payload structure:
  ```javascript
  {
    personalInfo: { name, dateOfBirth, email, phone, address },
    marriageDetails: { marriageDate, separationDate, place },
    children: [{ name, birthdate, notes }],
    financialSituation: { employment, income, expenses, assets, debts },
    preferences: { custody, concerns, notes },
    status: 'open'
  }
  ```
- Success redirects to `/dashboard` instead of case-specific page
- Clears localStorage draft on successful submission

### 4. Backend Endpoint (Already Exists)
**Endpoint**: `POST /api/cases`
**Location**: `backend/src/routes/cases.js` (line 243)
**Features**:
- Creates case record
- Seeds requirements from "Default Divorce" template
- Adds user as divorcee participant
- Links children to case
- Auto-links pending uploads to case
- Returns case_id, participants, children, requirements, uploads

## Testing Steps

### 1. Login as Divorcee
- Email: `sarah.test@example.com` (or your test divorcee account)
- Should see dashboard with "Create New Case" button

### 2. Navigate to Intake Form
- Click "+ Create New Case" button
- Should navigate to `/intake`
- Form should display in HomePage right panel

### 3. Complete Step 1: Personal Info
- **Name**: (auto-populated from profile or enter manually)
- **Date of Birth**: (required)
- **Email**: (auto-populated)
- **Phone**: (required)
- **Address**: (required)
- Click "Next"

### 4. Complete Step 2: Marriage Details
- **Date of Marriage**: Select date
- **Date of Separation**: Select date
- **Place of Marriage**: Enter city/state
- Click "Next"

### 5. Complete Step 3: Children (Optional)
- Click "Add Child" to add children
- For each child:
  - **Name**: Required
  - **Birthdate**: Required
  - **Notes**: Optional
- Click "Remove" to delete a child
- Click "Next"

### 6. Complete Step 4: Financial Situation
- **Employment Status**: (e.g., "Employed Full-Time")
- **Monthly Income**: (e.g., 5000)
- **Monthly Expenses**: (e.g., 3500)
- **Assets**: Optional
- **Debts**: Optional
- **Proof of Income**: Optional file upload
- **Bank Statement**: Optional file upload
- Click "Next"

### 7. Complete Step 5: Preferences/Concerns
- **Custody Preference**: Select from dropdown (No Preference, Sole, Joint, Other)
- **Concerns**: Optional text area
- **Notes**: Optional text area
- Click "Next"

### 8. Review Summary (Step 6)
- Review all entered information
- Click "Submit" to create case

### 9. Verify Success
- Success message should appear
- After 1.5 seconds, redirect to `/dashboard`
- "Create New Case" button should still be visible
- (Next: Dashboard will be updated to show cases list)

## Expected Backend Behavior

### Database Changes After Submission
1. **cases table**: New row with status='open', mediator_id=null
2. **case_participants table**: New row linking user as divorcee
3. **case_requirements table**: Multiple rows seeded from "Default Divorce" template
4. **case_children table**: Rows for each child added
5. **uploads table**: Previously uploaded files linked to case_id

### Response Structure
```json
{
  "case_id": "uuid",
  "status": "open",
  "participants": [...],
  "children": [...],
  "requirements": [...],
  "uploads": [...]
}
```

## Testing Scenarios

### Scenario 1: Minimal Case (No Children)
- Complete only required fields
- Skip children step
- Submit
- ✅ Should create case successfully

### Scenario 2: Complete Case with Children
- Fill all fields including optionals
- Add 2-3 children
- Upload financial documents
- Submit
- ✅ Should create case with all data

### Scenario 3: Draft Persistence
- Start filling form
- Refresh page mid-flow
- ✅ Form should restore from localStorage
- Complete and submit
- ✅ Draft should be cleared after success

### Scenario 4: Validation Errors
- Try to proceed without required fields
- ✅ Should show validation errors
- ✅ Should not allow "Next" until fixed

## Troubleshooting

### Issue: "User authentication required"
- Check browser console for auth token
- Ensure logged in as divorcee
- Token should be in localStorage

### Issue: "Missing required personal info"
- Check all Step 1 fields are filled
- Ensure payload structure matches backend

### Issue: Form not displaying
- Check React Router path is correct
- Verify PrivateRoute is passing auth
- Check browser console for errors

### Issue: Redirect not working
- Check dashboard route exists
- Verify setTimeout delay (1.5s)
- Check for navigation errors

## Next Steps After Testing
1. ✅ Verify case created in database
2. Update Dashboard to fetch and display user's cases
3. Add case list view with status indicators
4. Update "Cases" button to navigate to case detail page
5. Resolve "Failed to load stats" with real case data

## Database Verification

### Check Case Created
```sql
SELECT * FROM cases 
WHERE id IN (
  SELECT case_id FROM case_participants 
  WHERE user_id = '<your-user-id>'
);
```

### Check Requirements Seeded
```sql
SELECT * FROM case_requirements 
WHERE case_id = '<new-case-id>';
```

### Check Children Added
```sql
SELECT * FROM case_children 
WHERE case_id = '<new-case-id>';
```
