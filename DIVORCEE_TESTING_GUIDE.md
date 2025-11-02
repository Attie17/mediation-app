# 🧪 DIVORCEE SECTION - TESTING GUIDE

**Status:** Ready for Testing  
**Test Date:** October 23, 2025

---

## 🚀 Quick Start Testing

### 1. Open the Application
✅ Browser opened at: `http://localhost:5173/signin`

### 2. Sign In as Divorcee User

**Test User Options:**

**Option A: Bob Divorcee** (Recommended)
```
Email: bob@example.com
Password: (Use your test password)
User ID: 22222222-2222-2222-2222-222222222222
Cases: 1 case assigned
```

**Option B: Dashboard Test Divorcee**
```
Email: dashboard.divorcee@example.com
Password: (Use your test password)
User ID: 33333333-3333-4333-8333-333333333333
Cases: 2 cases assigned
```

**Option C: Test Divorcee**
```
Email: test-divorcee-1760287975@example.com
Password: (Use your test password)
User ID: 2055190c-de7e-5134-9a95-04d9b9585d39
Cases: 0 cases (will show "no case" state)
```

### 3. After Sign In
- Should automatically redirect to `/divorcee`
- Dashboard should load with all sections

---

## ✅ Test Checklist

### Phase 1: Basic Loading (5 minutes)

**Dashboard Display:**
- [ ] Welcome header shows with user's name
- [ ] Progress card displays (shows X/16 documents)
- [ ] Next Steps card shows numbered tasks
- [ ] Document panel displays with topics
- [ ] Sessions card shows (with empty state)
- [ ] Activity card shows (with empty state)
- [ ] Help section with 4 buttons displays
- [ ] No console errors in browser dev tools (F12)

### Phase 2: Document Management (10 minutes)

**Document Topics:**
- [ ] Financial Documents section visible
- [ ] Personal Information section visible
- [ ] Children & Custody section visible
- [ ] Property & Assets section visible

**Document Upload:**
- [ ] Click on any document topic
- [ ] Upload button appears
- [ ] Click upload button - dialog opens
- [ ] Select a test file
- [ ] Upload progresses
- [ ] Document appears in list
- [ ] Status badge shows correct state (red/yellow/green)
- [ ] Progress bar updates

### Phase 3: Navigation & Features (5 minutes)

**Help Section:**
- [ ] "Privacy Policy" button clickable
- [ ] "What to Expect" button clickable
- [ ] "FAQ" button clickable
- [ ] "Chat with Mediator" button clickable

**Chat Feature:**
- [ ] Click "Chat with Mediator" button
- [ ] Chat drawer slides open from right
- [ ] Message input field visible
- [ ] Can type in message field
- [ ] Close button works

### Phase 4: Data Accuracy (5 minutes)

**Check Browser Console (F12):**
- [ ] Look for API call to `/dashboard/stats/divorcee/:userId`
- [ ] Should see 200 OK response
- [ ] Response should contain stats object with:
  - `caseStatus` (e.g., "active" or "no_case")
  - `documentsUploaded` (number)
  - `documentsPending` (number)
  - `unreadMessages` (number)

**Verify Stats Display:**
- [ ] Progress bar count matches `documentsUploaded`
- [ ] "Next Steps" reflects current progress
- [ ] If all 16 docs uploaded, shows completion message

### Phase 5: Error Handling (Optional)

**Test Offline:**
- [ ] Open browser dev tools (F12)
- [ ] Go to Network tab → Check "Offline"
- [ ] Refresh page
- [ ] Should show error message about connectivity
- [ ] Uncheck "Offline" to restore

**Test No Case User:**
- [ ] Sign in as `test-divorcee-1760287975@example.com`
- [ ] Should show "no_case" status
- [ ] Should display appropriate empty state
- [ ] No errors in console

---

## 🐛 What to Look For

### ✅ Good Signs
- Dashboard loads in under 2 seconds
- Progress bar animates smoothly
- Document topics are organized and clear
- Upload button appears when needed
- Chat drawer slides smoothly
- All text is readable and properly formatted

### ❌ Bad Signs (Report These)
- Console errors (red text in F12 console)
- "Failed to load stats" error message
- Blank/white sections where content should be
- Upload button not working
- Chat drawer not opening
- Incorrect progress counts

---

## 📊 Expected Backend API Calls

When dashboard loads, you should see these in Network tab (F12):

1. **GET /api/users/me**
   - Gets current user info
   - Should return 200 OK

2. **GET /dashboard/stats/divorcee/:userId**
   - Gets dashboard statistics
   - Should return 200 OK with stats object

3. **GET /api/cases/user/:userId**
   - Gets user's cases (if needed)
   - Should return 200 OK

4. **GET /api/cases/:caseId/uploads**
   - Gets case documents
   - Should return 200 OK with uploads array

---

## 🎯 Success Criteria

### Minimum (Must Pass)
- ✅ Dashboard loads without errors
- ✅ User sees their name and role
- ✅ Progress card displays
- ✅ Document panel shows topics
- ✅ Can navigate to help sections

### Standard (Should Pass)
- ✅ All above +
- ✅ Can upload documents
- ✅ Upload status updates
- ✅ Progress bar accurate
- ✅ Chat drawer works

### Excellent (Nice to Pass)
- ✅ All above +
- ✅ Smooth animations
- ✅ No loading delays
- ✅ Mobile responsive
- ✅ Helpful empty states

---

## 🔍 Testing Scenarios

### Scenario 1: New Divorcee (0 Documents)
**User:** bob@example.com  
**Expected:**
- Progress: 0/16
- Next Steps: Shows "Upload remaining documents" as step 1
- Document topics: All show "Not submitted" (red badge)
- Sessions: Empty state
- Activity: Empty state

### Scenario 2: Active Divorcee (5 Documents)
**Expected:**
- Progress: 5/16 (31%)
- Next Steps: Shows remaining count (11 documents)
- Document topics: Mix of red/yellow/green badges
- Sessions: Empty state (or upcoming session if scheduled)
- Activity: Shows recent uploads

### Scenario 3: Complete Divorcee (16 Documents)
**Expected:**
- Progress: 16/16 (100%)
- Next Steps: Shows completion celebration 🎉
- Document topics: All green badges
- Message: "All documents submitted!"

### Scenario 4: No Case Assigned
**User:** test-divorcee-1760287975@example.com  
**Expected:**
- Progress: 0/16
- Status: "no_case"
- Message about no active case
- Upload disabled or not shown

---

## 📝 Test Results

### Test Run #1
**Date:** _____________  
**Tester:** _____________  
**User Tested:** _____________  

**Results:**
- [ ] PASS - All basic features work
- [ ] PARTIAL - Some features work, some don't (list below)
- [ ] FAIL - Major issues (list below)

**Issues Found:**
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

**Notes:**
_________________________________________________
_________________________________________________

---

## 🆘 Troubleshooting

### Issue: Dashboard doesn't load
**Check:**
1. Are servers running? (`npm run start`)
2. Is user authenticated? (check localStorage for token)
3. Console errors? (F12 → Console tab)

### Issue: "Failed to load stats" error
**Check:**
1. Backend running on port 4000?
2. Database connected? (check backend logs)
3. User has valid user_id?

### Issue: Documents not showing
**Check:**
1. User has assigned case?
2. Case has documents in database?
3. API call to `/api/cases/:id/uploads` returning data?

### Issue: Upload not working
**Check:**
1. File size within limits?
2. Upload endpoint working? (check Network tab)
3. User has permission to upload?

---

## 📞 Support

**Backend Logs:** Check terminal running `npm run start` - backend section
**Frontend Errors:** Press F12 in browser → Console tab
**Network Calls:** Press F12 in browser → Network tab

**Documentation:**
- `DIVORCEE_SECTION_ANALYSIS_COMPLETE.md` - Full technical details
- `DIVORCEE_SECTION_DIAGNOSTIC_REPORT.md` - Executive summary

---

## ✅ Final Verification

Once all tests pass:

- [ ] Dashboard loads successfully
- [ ] All UI elements display
- [ ] Document upload works
- [ ] Chat drawer works
- [ ] No console errors
- [ ] Performance acceptable (< 2s load)
- [ ] Mobile responsive (test on phone or resize browser)

**Sign Off:**
- Tested By: _____________
- Date: _____________
- Status: ✅ APPROVED / ⚠️ NEEDS FIXES / ❌ BLOCKED

---

**Happy Testing! 🧪**

The divorcee section has been thoroughly screened and fixed. It should be 100% functional now!

