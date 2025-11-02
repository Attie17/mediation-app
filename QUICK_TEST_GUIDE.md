# Quick Testing Guide - Case Management Features

## ⚡ Prerequisites
- Backend running: `cd backend; npm run dev`
- Frontend running: `cd frontend; npm run dev`
- Logged in as divorcee user

---

## 🧪 Test Sequence

### 1. Dashboard (2 minutes)
```
✓ See "+ Create New Case" button
✓ See stats grid (if you have cases)
✓ See cases list or "No cases yet" message
✓ Case titles display (not just IDs)
```

### 2. Create Case (5 minutes)
```
Step 0: Case Details
✓ Enter title: "Test Divorce Case"
✓ Enter description: "Testing the intake flow"
✓ Click Next

Step 1: Personal Info
✓ Fill all required fields
✓ Click Next

Step 2: Marriage Details
✓ Select marriage date
✓ Select separation date
✓ Enter place
✓ Click Next

Step 3: Children (optional)
✓ Add child or skip
✓ Click Next

Step 4: Financial
✓ Fill employment, income, expenses
✓ Click Next

Step 5: Preferences
✓ Select custody preference
✓ Click Next

Step 6: Summary
✓ Review all information
✓ Click Submit
✓ Success message appears
✓ Redirects to dashboard
```

### 3. View Case (2 minutes)
```
✓ Case appears on dashboard with custom title
✓ Click case card
✓ Navigate to case detail page
✓ See case title and description
✓ See progress bar (likely 0% for new case)
✓ See stats grid showing document counts
✓ See requirements list
✓ See participants panel
```

---

## 🎯 Expected Results

### Dashboard After Case Creation
- "Test Divorce Case" appears in cases list
- Description shows (truncated)
- Status shows "open"

### Case Detail Page
- Title: "Test Divorce Case"
- Description: "Testing the intake flow"
- Progress: ~0% (no documents uploaded yet)
- Stats:
  - Total Requirements: ~12 (from "Default Divorce" template)
  - Confirmed: 0
  - Pending: 0
  - Missing: 12
- Requirements: List of all document types with gray dots (missing)
- Participants: Shows you as "Divorcee"

---

## 🐛 Troubleshooting

### Button Not Showing
**Issue**: No "+ Create New Case" button
**Cause**: User role not set to 'divorcee'
**Fix**: Check `localStorage.getItem('user')` in console, verify role

### Form Won't Submit
**Issue**: Submit button doesn't work
**Cause**: Missing required fields or validation error
**Fix**: Check console for validation messages, fill all required fields

### Case Not Appearing
**Issue**: Case created but not on dashboard
**Cause**: Dashboard not refreshing or API error
**Fix**: Refresh page, check backend logs for errors

### Progress Shows Wrong Number
**Issue**: Progress percentage incorrect
**Cause**: Requirements not seeded or stats calculation error
**Fix**: Check database for case_requirements entries

---

## 📊 Database Verification

### Check Case Created
```sql
SELECT id, title, description, status, created_at 
FROM cases 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check Requirements Seeded
```sql
SELECT COUNT(*) as total_requirements
FROM case_requirements 
WHERE case_id = '<your-case-id>';
```

### Check Participant Added
```sql
SELECT * FROM case_participants
WHERE case_id = '<your-case-id>';
```

---

## ⏱️ Total Testing Time
**Estimated**: 10-15 minutes for complete test flow

---

## ✅ Success Criteria
- [x] Can create case with custom title
- [x] Dashboard shows case with title (not just ID)
- [x] Case detail page loads all sections
- [x] Progress tracking visible
- [x] Requirements list displays
- [x] No console errors

---

## 📝 Bug Report Template

If you find issues, note:
```
Issue: [Brief description]
Steps to Reproduce:
1. 
2. 
3. 
Expected: [What should happen]
Actual: [What happened]
Console Errors: [Any errors in browser console]
Backend Logs: [Any errors in terminal]
```

---

**Ready to test!** 🚀
