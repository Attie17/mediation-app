# Testing Session - Four Priority Tasks
**Date**: October 19, 2025  
**Time**: Live Testing Session  
**Servers**: Both running (Frontend: 5173, Backend: 4000)

---

## 🧪 Test Plan

### Pre-Test Setup
- [x] Backend server running on port 4000
- [x] Frontend server running on port 5173
- [x] Browser opened at http://localhost:5173
- [ ] Login as mediator user
- [ ] Verify authentication token present

---

## Test 1: Document Review Workflow 📄

### Test Steps:
1. **Login as Mediator**
   - Navigate to: `http://localhost:5173`
   - Sign in with mediator credentials
   - Expected: Redirect to mediator dashboard

2. **Navigate to Review Page**
   - Click "Go to Review Page →" in Action Required panel
   - OR navigate to: `http://localhost:5173/#/mediator/review`
   - Expected: Document Review page loads

3. **Verify Pending Uploads List**
   - Expected: List of pending uploads displays
   - Should show: Document type, case ID, upload date, filename
   - If empty: "No pending document reviews" message

4. **Select Document**
   - Click on any document in the list
   - Expected: Details appear in right panel
   - Should show: Preview/download link, metadata, action buttons

5. **Test Approve Flow**
   - Click "Approve Document" button
   - Expected: Confirmation dialog appears
   - Click "Confirm"
   - Expected: 
     - API call to `POST /api/uploads/:id/confirm`
     - Success message
     - Document removed from list
     - List refreshes

6. **Test Reject Flow**
   - Select another document
   - Click "Reject Document" button
   - Expected: Rejection reason modal appears
   - Enter reason: "Missing signature"
   - Click "Submit Rejection"
   - Expected:
     - API call to `POST /api/uploads/reject`
     - Success message
     - Document removed from list

### Expected API Calls:
```
GET /api/uploads/list?status=pending
POST /api/uploads/:id/confirm
POST /api/uploads/reject
```

### Success Criteria:
- [ ] Page loads without errors
- [ ] Pending uploads list displays
- [ ] Can select documents
- [ ] Approve functionality works
- [ ] Reject functionality works
- [ ] List updates after actions
- [ ] Error handling works

---

## Test 2: Real Cases Display & Navigation 📋

### Test Steps:
1. **Navigate to Mediator Dashboard**
   - Go to: `http://localhost:5173/#/mediator`
   - Expected: Dashboard loads with stats and cases

2. **Verify Cases Section**
   - Scroll to "Your Cases" section
   - Expected: Real cases display (not placeholders)
   - Should show:
     - Case title or "Case #ID"
     - Status badge (color-coded)
     - Last activity date
     - Progress bar

3. **Test Case Card Hover**
   - Hover over any case card
   - Expected: 
     - Card scales up slightly
     - Shadow appears
     - Cursor changes to pointer

4. **Test Case Navigation**
   - Click on first case card
   - Expected: Navigate to `/case/:caseId`
   - Case overview page loads
   - URL changes to case detail route

5. **Return and Test Another Case**
   - Click browser back button
   - Click different case card
   - Expected: Navigate to different case

6. **Verify "Show More" (if applicable)**
   - If more than 3 cases, check "+X more cases" link
   - Expected: Shows total case count

### Expected API Calls:
```
GET /dashboard/stats/mediator/:userId
GET /api/cases/user/:userId
```

### Success Criteria:
- [ ] Real case data displays (not "Case A", "Case B")
- [ ] Case cards are clickable
- [ ] Hover effects work
- [ ] Navigation to case details works
- [ ] Status badges show correct colors
- [ ] Progress bars display

---

## Test 3: Participant Management 👥

### Test Steps:
1. **Navigate to Case Overview**
   - Click on any case from mediator dashboard
   - Expected: Case overview page loads
   - Should see: Case details, participants, documents, timeline

2. **Verify Invite Button**
   - Look for "Invite" button (top right, next to progress)
   - Expected: Button visible for mediators
   - Button should have user-plus icon

3. **Open Invite Modal**
   - Click "Invite" button
   - Expected: Modal dialog appears
   - Should show: Title "Invite Participant"
   - Form fields: Email, Name, Role

4. **Test Form Validation**
   - Try to submit empty form
   - Expected: Email field validation error
   - Enter invalid email: "notanemail"
   - Expected: Email format validation error

5. **Invite New Participant**
   - Enter valid email: "newlawyer@test.com"
   - Enter name: "Jane Lawyer"
   - Select role: "Lawyer"
   - Click "Send Invite"
   - Expected:
     - API call to `POST /api/cases/:caseId/participants`
     - Loading state shows
     - Success message
     - Modal closes
     - Participant appears in list

6. **Verify Participant Display**
   - Check participants section
   - Expected: New participant visible
   - Should show:
     - Name and email
     - Role badge (purple for lawyer)
     - Proper styling

7. **Test Different Roles**
   - Invite another participant with role "Mediator"
   - Expected: Teal badge appears
   - Invite with role "Divorcee"
   - Expected: Blue badge appears

### Expected API Calls:
```
POST /api/cases/:caseId/participants
Body: { email, role, name? }
```

### Success Criteria:
- [ ] Invite button visible for mediators
- [ ] Modal opens/closes correctly
- [ ] Form validation works
- [ ] Can submit valid invitation
- [ ] Participant appears in list
- [ ] Role badges show correct colors:
  - Divorcee: Blue
  - Mediator: Teal
  - Lawyer: Purple
  - Admin: Orange
- [ ] Participant count updates

---

## Test 4: Session Scheduler UI 📅

### Test Steps:
1. **Navigate to Session Scheduler**
   - From mediator dashboard, click "Schedule Session" button
   - OR go to: `http://localhost:5173/#/mediator/schedule`
   - Expected: Session scheduler page loads

2. **Verify Page Layout**
   - Expected to see:
     - Header with "Schedule Session" button
     - "Upcoming Sessions" section
     - "Past Sessions" section
     - Back button

3. **Open Create Session Modal**
   - Click "Schedule Session" button
   - Expected: Modal dialog appears
   - Should show form fields:
     - Session Title (required)
     - Date (required)
     - Time (required)
     - Duration dropdown
     - Location (optional)
     - Case ID (optional)
     - Notes (optional)

4. **Test Form Validation**
   - Try to submit empty form
   - Expected: Validation errors for required fields
   - Enter title only
   - Expected: Date and time required errors

5. **Test Date Picker**
   - Click on date field
   - Try to select past date
   - Expected: Past dates disabled (min: today)
   - Select future date
   - Expected: Date accepted

6. **Test Duration Dropdown**
   - Click duration field
   - Expected: Options: 30, 60, 90, 120 minutes
   - Select 60 minutes
   - Expected: Selected value shows

7. **Fill and Submit Form**
   - Title: "Initial Mediation Session"
   - Date: Tomorrow
   - Time: "14:00"
   - Duration: 60 minutes
   - Location: "Virtual - Zoom"
   - Notes: "First session with both parties"
   - Click "Create Session"
   - Expected:
     - Placeholder message appears (backend not implemented)
     - OR if backend ready: Session appears in list

8. **Test Cancel/Close**
   - Open modal again
   - Click "Cancel" or X button
   - Expected: Modal closes without saving

### Expected API Calls (when implemented):
```
POST /api/sessions
Body: { title, date, time, duration, location?, caseId?, notes? }
```

### Success Criteria:
- [ ] Page loads without errors
- [ ] Schedule button visible
- [ ] Modal opens/closes correctly
- [ ] All form fields render
- [ ] Form validation works
- [ ] Date picker restricts past dates
- [ ] Duration dropdown works
- [ ] Can enter optional fields
- [ ] Submit shows appropriate message
- [ ] UI is responsive and user-friendly

---

## Additional Checks

### Performance:
- [ ] Pages load within 2 seconds
- [ ] No console errors
- [ ] Smooth animations
- [ ] Responsive on different screen sizes

### Error Handling:
- [ ] Graceful handling of network errors
- [ ] User-friendly error messages
- [ ] Loading states during API calls
- [ ] Empty states when no data

### Authentication:
- [ ] JWT token sent in Authorization header
- [ ] 401 errors handled gracefully
- [ ] Redirect to login if unauthorized

### Navigation:
- [ ] Browser back button works
- [ ] URL updates correctly
- [ ] Can bookmark specific pages

---

## Test Results Log

### Test 1: Document Review
**Status**: ⏳ In Progress  
**Notes**:

### Test 2: Cases Display
**Status**: ⏳ In Progress  
**Notes**:

### Test 3: Participant Management
**Status**: ⏳ In Progress  
**Notes**:

### Test 4: Session Scheduler
**Status**: ⏳ In Progress  
**Notes**:

---

## Issues Found

### Critical Issues:
(None yet)

### Minor Issues:
(None yet)

### Enhancement Ideas:
(To be added during testing)

---

## Next Steps After Testing

1. Fix any critical issues found
2. Implement session backend endpoint
3. Add real progress calculation
4. Enhance document preview
5. Add email notifications

---

**Testing Started**: [TIME]  
**Testing Completed**: [TIME]  
**Overall Status**: 🔄 In Progress
