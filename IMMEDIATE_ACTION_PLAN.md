# Immediate Action Plan - Next Steps

**Date**: October 18, 2025  
**Goal**: Get to 85% completion in next 2 weeks

---

## 🎯 This Week's Focus: Connect & Test

### Day 1-2: Testing & Dashboard Connection
**Time**: 8-10 hours

#### Morning (4 hours)
1. **Test Case Creation Flow** (QUICK_TEST_GUIDE.md)
   - Login as divorcee
   - Create case with custom title
   - Verify all 7 steps work
   - Check database records created
   - Document any issues

2. **Test All Dashboards**
   - Login as each role (divorcee/mediator/lawyer/admin)
   - Check stats load correctly
   - Note placeholders vs real data
   - Screenshot any errors

#### Afternoon (4 hours)
3. **Connect Mediator Dashboard**
   - Wire stats API call (1 hour)
   - Fetch assigned cases (1 hour)
   - Display pending uploads list (1 hour)
   - Test and verify (1 hour)

4. **Connect Lawyer Dashboard**
   - Wire stats API call (1 hour)
   - Fetch client cases (1 hour)
   - Show required documents (1 hour)
   - Test and verify (1 hour)

**Deliverable**: All dashboards showing real data

---

### Day 3-4: Document Review Workflow
**Time**: 12-14 hours

#### Tasks
1. **Create Pending Review Page** (3 hours)
   - New route `/mediator/reviews`
   - Fetch pending uploads: `GET /api/uploads?status=uploaded&case_id=X`
   - Display list with case info
   - Click to open detail view

2. **Document Viewer Component** (3 hours)
   - Modal or full-page view
   - Show document preview (if image/PDF)
   - Display metadata (uploaded by, date, type)
   - Approve/Reject buttons

3. **Wire Approval Actions** (2 hours)
   - POST /api/uploads/:id/confirm
   - POST /api/uploads/:id/reject
   - Update UI on success
   - Show success/error toasts

4. **Notification Integration** (2 hours)
   - Create notification on review complete
   - Divorcee sees notification
   - Document status updates in real-time

5. **Testing** (2 hours)
   - Upload document as divorcee
   - Review as mediator
   - Verify notification received
   - Check all edge cases

**Deliverable**: Working document review workflow

---

### Day 5: Case Assignment
**Time**: 6-8 hours

#### Tasks
1. **Admin Case Assignment UI** (3 hours)
   - Add "Assign" button to case list
   - Modal with mediator dropdown
   - Call PUT /api/cases/:id with mediator_id
   - Success confirmation

2. **Mediator Case Acceptance** (2 hours)
   - Notification on assignment
   - Accept/Decline buttons
   - Update case status
   - Add to "My Cases" list

3. **Case List Enhancements** (2 hours)
   - Show assignment status
   - Filter by status (unassigned/assigned/active)
   - Sort by date/priority

4. **Testing** (1 hour)
   - Assign case as admin
   - Accept as mediator
   - Verify case appears on mediator dashboard

**Deliverable**: Case assignment system working

---

## 🎯 Week 2 Focus: Essential Features

### Day 6-7: Session Scheduler
**Time**: 10-12 hours

1. **Calendar Component** (4 hours)
   - Install `react-big-calendar` or `fullcalendar`
   - Create Calendar page
   - Fetch sessions from backend
   - Display on calendar

2. **Session Creation** (3 hours)
   - "New Session" button
   - Modal with form (date, time, participants, case)
   - POST /api/settlement-sessions/
   - Refresh calendar

3. **Session Details** (2 hours)
   - Click event to view details
   - Edit/Cancel functionality
   - Send notifications to participants

4. **Testing** (2 hours)
   - Create session
   - View on calendar
   - Edit/cancel
   - Check notifications

**Deliverable**: Working session scheduler

---

### Day 8-9: Reports & Polish
**Time**: 10-12 hours

1. **Report Templates** (3 hours)
   - Create report template (React component)
   - Fetch case data
   - Format as printable page
   - Add print CSS

2. **PDF Generation** (3 hours)
   - Install `react-to-pdf` or `jspdf`
   - Convert template to PDF
   - Download functionality
   - Backend storage (optional)

3. **UI Polish** (3 hours)
   - Add loading states everywhere
   - Add error boundaries
   - Improve empty states
   - Add toast notifications
   - Fix responsive issues

4. **Testing** (2 hours)
   - Generate reports for different cases
   - Test all browsers
   - Test mobile view
   - Fix any issues

**Deliverable**: Report generation + polished UI

---

### Day 10: Comprehensive Testing
**Time**: 6-8 hours

1. **End-to-End Flows** (3 hours)
   - Divorcee: Register → Create case → Upload docs → Chat
   - Mediator: Review docs → Approve → Schedule session
   - Lawyer: View case → Review docs → Communicate
   - Admin: Assign case → Manage users → View stats

2. **Error Scenarios** (2 hours)
   - Invalid inputs
   - Network failures
   - Missing data
   - Expired sessions

3. **Performance** (1 hour)
   - Check load times
   - Optimize slow queries
   - Test with large datasets

4. **Bug Fixing** (2 hours)
   - Fix any issues found
   - Retest critical flows
   - Document known issues

**Deliverable**: Fully tested v1.0

---

## 📋 Quick Reference - Backend Endpoints

### Cases
```
GET    /api/cases/user/:userId        # Get user's cases
POST   /api/cases                     # Create new case
GET    /api/cases/:id                 # Get case details
PUT    /api/cases/:id                 # Update case
GET    /api/cases/:id/requirements    # Get requirements
POST   /api/cases/:id/requirements    # Add requirement
GET    /api/cases/:id/uploads         # Get case uploads
```

### Dashboard Stats
```
GET    /dashboard/stats/divorcee/:userId
GET    /dashboard/stats/mediator/:userId
GET    /dashboard/stats/lawyer/:userId
GET    /dashboard/stats/admin
GET    /dashboard/cases/:caseId/dashboard   # Comprehensive case data
```

### Uploads
```
POST   /api/uploads/file               # Upload document
GET    /api/uploads/list               # List uploads (with filters)
POST   /api/uploads/:id/confirm        # Approve upload
POST   /api/uploads/:id/reject         # Reject upload
GET    /api/uploads/history            # Upload history
```

### Participants
```
POST   /api/cases/:id/participants/invite   # Invite participant
POST   /api/cases/:id/participants/accept   # Accept invitation
GET    /api/cases/:id/participants          # List participants
PATCH  /api/cases/:id/participants/:userId  # Update participant
DELETE /api/cases/:id/participants/:userId  # Remove participant
```

### Sessions
```
POST   /api/settlement-sessions/                    # Create session
GET    /api/settlement-sessions/case/:caseId        # Get case sessions
GET    /api/settlement-sessions/:sessionId          # Get session details
PATCH  /api/settlement-sessions/:sessionId/status   # Update status
```

### Users
```
GET    /api/users/me                   # Current user profile
PUT    /api/users/me                   # Update profile
POST   /api/users/profile              # Extended profile
GET    /api/users                      # All users (admin)
PATCH  /api/users/:id/role             # Update user role
```

### AI & Chat
```
GET    /api/ai/insights/:caseId        # Get AI insights
POST   /api/ai/analyze-tone            # Analyze message tone
POST   /api/ai/suggest-rephrase        # Suggest rephrasing
GET    /api/chat/channels              # List channels
POST   /api/chat/channels              # Create channel
POST   /api/chat/messages              # Send message
GET    /api/chat/messages/:channelId   # Get messages
```

---

## 🛠️ Development Shortcuts

### Start Servers
```powershell
# Terminal 1 - Backend
cd C:\mediation-app\backend
npm run dev

# Terminal 2 - Frontend  
cd C:\mediation-app\frontend
npm run dev
```

### Quick Test Login
```
Divorcee:  sarah.test@example.com
Mediator:  mediator@test.com
Lawyer:    lawyer@test.com
Admin:     admin@test.com
```

### Check Logs
```powershell
# Backend logs (in backend terminal)
# Look for: API calls, errors, database queries

# Frontend logs (browser console F12)
# Look for: React errors, network failures
```

### Database Queries
```sql
-- Check recent cases
SELECT id, title, status, created_at 
FROM cases 
ORDER BY created_at DESC 
LIMIT 10;

-- Check user's cases
SELECT c.*, cp.role 
FROM cases c
JOIN case_participants cp ON c.id = cp.case_id
WHERE cp.user_id = '<user-uuid>';

-- Check pending uploads
SELECT * FROM uploads
WHERE status = 'uploaded'
ORDER BY created_at DESC;
```

---

## ✅ Success Checklist

### End of Week 1
- [ ] All dashboards connected to backend
- [ ] Stats displaying real data
- [ ] Document review workflow functional
- [ ] Case assignment working
- [ ] No critical bugs blocking workflow

### End of Week 2
- [ ] Session scheduler operational
- [ ] Reports can be generated
- [ ] All core flows tested
- [ ] UI polished with loading/error states
- [ ] Ready for user acceptance testing

### Ready for Production
- [ ] All P0/P1 features complete
- [ ] Security audit passed
- [ ] Performance optimized
- [ ] Documentation complete
- [ ] Deployment plan ready

---

## 📞 When Stuck

### Debug Checklist
1. Check browser console for errors
2. Check backend terminal for API errors
3. Verify backend server running (port 4000)
4. Verify frontend server running (port 5173/5174)
5. Check auth token in localStorage
6. Verify user role is set correctly
7. Check database for expected records
8. Try in incognito window (clear cache)

### Common Issues
- **401 errors**: Token expired or missing, re-login
- **404 errors**: Endpoint doesn't exist, check route
- **500 errors**: Backend crash, check backend logs
- **White screen**: React error, check browser console
- **Data not loading**: Check network tab for failed requests

---

**Let's execute this plan systematically!** 

Start with Day 1 testing, document all issues, then fix them one by one. The goal is steady progress, not perfection. 🚀
