# Implementation Priority Plan
## Systematic Approach: Fix → Connect → Expand

**Philosophy**: Get what we have working properly before adding new features.

---

## 🔧 PHASE 1: Fix Existing Pages (Current Sprint)

### 1.1 Start Servers & Verify Basic Connectivity
- [ ] Kill stray Node processes (7 currently running)
- [ ] Start backend cleanly on port 4000
- [ ] Start frontend cleanly on port 5173
- [ ] Verify healthz endpoint responds
- [ ] Verify frontend can reach backend

### 1.2 Fix Divorcee Dashboard (`/divorcee`)
**Status**: Mostly working but needs verification
- [ ] Test document upload functionality (16 docs)
- [ ] Verify progress tracker updates correctly
- [ ] Test ChatDrawer opens and displays messages
- [ ] Verify AI insights sidebar polling works
- [ ] Fix any console errors
- [ ] Connect to real case data from backend

**Issues to Check**:
- Hard-coded `caseId = 4` in component
- `activeCaseId` from localStorage - is this set properly?
- Document upload endpoint connections

### 1.3 Fix Mediator Dashboard (`/mediator`)
**Status**: Basic layout only, not connected to backend
- [ ] Connect "Assigned Cases" to `/api/cases` endpoint
- [ ] Connect "Action Queues" to real upload data
- [ ] Wire up "Invite Participants" button
- [ ] Wire up "Update Phase" button  
- [ ] Wire up "Draft/Export Report" button
- [ ] Add ChatDrawer integration (just added, needs testing)
- [ ] Connect notifications feed to real data

**Current Issues**:
- All data is placeholder text
- No API calls to backend
- Buttons don't do anything
- Uses old `DashboardFrame` instead of `MediatorDashboard.jsx` component

### 1.4 Fix Lawyer Dashboard (`/lawyer`)
**Status**: Basic layout only, not connected
- [ ] Connect "Client Cases" to `/api/cases` filtered by lawyer
- [ ] Connect "Required Docs" to case requirements
- [ ] Add timeline/milestones display
- [ ] Add communication channel with mediator
- [ ] Fix navigation and role-based access

**Current Issues**:
- All placeholder text
- No backend connectivity
- No real functionality

### 1.5 Fix Admin Dashboard (`/admin`)
**Status**: Partially working
- [ ] Test "Manage roles" link (`/admin/roles`)
- [ ] Connect "System Overview" KPIs to backend
- [ ] Implement "Invite user" functionality
- [ ] Add audit log display
- [ ] Add health checks display
- [ ] Test user management page (`/admin/users`)

**Current Issues**:
- Most features are placeholders
- Need backend endpoints for KPIs
- Health checks not implemented

### 1.6 Fix Case Overview Page (`/case/:caseId`)
**Status**: AI Insights working, but basic info missing
- [x] AI Insights Dashboard working ✅
- [ ] Add real case metadata display (parties, status, dates)
- [ ] Connect documents summary to real data
- [ ] Implement timeline visualization
- [ ] Add navigation to case details/uploads
- [ ] Show case participants

**Current Issues**:
- Only shows case ID and AI insights
- Documents and timeline are placeholders

### 1.7 Fix Chat System
**Status**: Backend working, frontend partially working
- [x] Backend auto-analysis working ✅
- [x] Real-time insights polling working ✅
- [ ] Test chat message sending
- [ ] Verify typing indicators work
- [ ] Test real-time message updates
- [ ] Verify channel creation
- [ ] Test multiple users in same channel

**Potential Issues**:
- Channel ID management
- User ID consistency between auth and chat
- Real-time subscriptions

---

## 🔌 PHASE 2: Connect Frontend to Backend (Next Sprint)

### 2.1 Backend Endpoints Audit
Review what endpoints exist vs what frontend needs:

**Existing Endpoints** (from `backend/src/index.js`):
- `/api/auth/*` - Registration, login ✅
- `/api/users/*` - User management ✅
- `/api/cases/*` - Case management ✅
- `/api/cases/:id/participants` - Participants ✅
- `/api/cases/:id/dashboard` - Dashboard data ✅
- `/api/cases/:id/overview` - Overview data ✅
- `/api/uploads` - Document uploads ✅
- `/api/notifications` - Notifications ✅
- `/api/chat/*` - Chat channels & messages ✅
- `/api/ai/*` - AI insights ✅
- `/api/intake` - Intake forms (legacy)

**Missing Endpoints Needed**:
- [ ] `/api/cases` GET - List all cases (filtered by user role)
- [ ] `/api/cases` POST - Create new case
- [ ] `/api/cases/:id` PATCH - Update case status/phase
- [ ] `/api/cases/:id/participants` POST - Invite participant
- [ ] `/api/uploads/pending` GET - Uploads awaiting review (for mediator)
- [ ] `/api/reports/:caseId` GET - Generate case report
- [ ] `/api/dashboard/mediator/:userId` GET - Mediator-specific dashboard data
- [ ] `/api/dashboard/lawyer/:userId` GET - Lawyer-specific dashboard data
- [ ] `/api/admin/stats` GET - System-wide KPIs

### 2.2 API Integration Checklist

For each dashboard, wire up real data:

**Divorcee Dashboard**:
- [x] Document upload endpoints ✅
- [ ] Get active case for user
- [ ] Get document requirements
- [ ] Get upload history

**Mediator Dashboard**:
- [ ] GET assigned cases list
- [ ] GET pending uploads for review
- [ ] GET today's schedule/sessions
- [ ] POST invite participant
- [ ] PATCH update case phase

**Lawyer Dashboard**:
- [ ] GET client cases (where lawyer is participant)
- [ ] GET required documents per case
- [ ] GET case timeline/events
- [ ] POST request additional documents

**Admin Dashboard**:
- [ ] GET system stats (user counts, case counts)
- [ ] GET audit log entries
- [ ] POST invite user
- [ ] GET system health status

### 2.3 Data Flow Verification
- [ ] User registration → creates app_users record
- [ ] User login → returns valid JWT
- [ ] Case creation → creates case and case_participants
- [ ] Document upload → triggers notification
- [ ] Chat message → triggers AI analysis
- [ ] AI analysis → creates ai_insights record
- [ ] Insight creation → appears in frontend within 5 seconds

---

## 🎯 PHASE 3: Core Feature Completion (After Fix + Connect)

Only start this after Phases 1 & 2 are solid.

### 3.1 Essential Missing Features
**Priority 1** (blocks user workflow):
1. Case creation wizard (mediators can't create cases)
2. Case assignment (admin assigns cases to mediators)
3. Participant invitation (add parties to existing case)
4. Document review workflow (mediators approve/reject uploads)

**Priority 2** (improves UX):
5. Session scheduler (calendar view)
6. Case status/phase updates (workflow progression)
7. Notification settings (what alerts to receive)

**Priority 3** (nice-to-have):
8. Reports generation
9. Analytics dashboard
10. Agreement tracking

### 3.2 Implementation Order
Do these **one at a time**, fully testing each before moving on:

1. **Case List & Details** (Week 1)
   - GET /api/cases with role-based filtering
   - Display cases on mediator/lawyer/admin dashboards
   - Click case → navigate to case overview
   - Show real case metadata

2. **Document Review Workflow** (Week 2)
   - Mediator sees pending uploads
   - Click review → show document preview
   - Approve/reject buttons
   - Notifications to divorcee on decision

3. **Case Creation** (Week 3)
   - "New Case" button on mediator dashboard
   - Multi-step form (case details, initial parties)
   - POST /api/cases endpoint
   - Redirect to new case overview

4. **Participant Management** (Week 4)
   - "Invite Participant" button on case page
   - Modal with role selection (divorcee/lawyer)
   - POST /api/cases/:id/participants
   - Email invitation (future)

5. **Session Scheduler** (Week 5)
   - Calendar component
   - Create session with date/time/parties
   - Notifications for scheduled sessions

---

## 🧪 Testing Strategy

### Test Each Page Systematically
1. **Start Fresh**
   - Clear localStorage
   - Clear cookies
   - Restart servers

2. **Test User Journey**
   - Register new user
   - Login with role
   - Navigate to role dashboard
   - Verify all sections load
   - Test each button/link
   - Check console for errors

3. **Test Data Flow**
   - Action in frontend → API call → Database change
   - Database change → Real-time update → Frontend display
   - Example: Upload document → Notification → Mediator sees it

4. **Test Role Access**
   - Divorcee can't access mediator routes
   - Mediator can access assigned cases only
   - Admin can access everything

---

## 📋 Immediate Action Items (Today)

### Step 1: Clean Environment
```powershell
# Kill all Node processes
taskkill /F /IM node.exe

# Verify clean
Get-Process node -ErrorAction SilentlyContinue
```

### Step 2: Start Backend
```powershell
cd c:\mediation-app\backend
node src/index.js
# Should see: "Backend running on port 4000"
```

### Step 3: Start Frontend (separate terminal)
```powershell
cd c:\mediation-app\frontend
npm run dev
# Should see: "Local: http://localhost:5173"
```

### Step 4: Smoke Test
1. Open http://localhost:5173
2. Register new user (any role)
3. Navigate to dashboard
4. Check browser console for errors
5. Check backend logs for API calls

### Step 5: Document Issues
Create a checklist of what's broken:
- [ ] Page X: Error Y
- [ ] Component Z: Not loading
- [ ] API endpoint /path: 404 or 500

---

## 📝 Current Status Summary

### ✅ What's Working
- Authentication (register, login, JWT)
- AI service (analyzing messages, generating insights)
- Chat backend (messages, channels, auto-analysis)
- Document upload system (basic upload works)
- Database schema (all tables exist)
- Dev auth flow (dev-fake-token)

### ⚠️ What's Partially Working
- Divorcee dashboard (works but hard-coded data)
- Case overview page (shows AI insights, missing case data)
- Chat frontend (implemented but needs testing)
- Notifications (bell works, content needs backend)

### ❌ What's Not Working
- Mediator dashboard (no backend connection)
- Lawyer dashboard (no backend connection)
- Admin dashboard (limited functionality)
- Case creation (doesn't exist)
- Document review workflow (doesn't exist)
- Case assignment (doesn't exist)

---

## 🎯 Success Criteria

**Phase 1 Complete When**:
- All 4 role dashboards display without errors
- User can navigate between pages smoothly
- No console errors on page load
- All existing buttons either work or are clearly disabled

**Phase 2 Complete When**:
- Each dashboard shows real data from backend
- User actions (clicks, forms) trigger API calls
- Database updates reflect in frontend immediately
- All CRUD operations work for core entities

**Phase 3 Complete When**:
- Mediator can create and assign cases
- Mediator can review and approve documents
- Divorcee can complete full workflow (register → upload docs → chat → receive feedback)
- Admin can manage users and monitor system

---

## 🚀 Next Steps

1. **Stop and clean up** - Kill stray processes
2. **Start fresh** - Backend + Frontend running cleanly
3. **Test existing pages** - Document all issues
4. **Fix issues one by one** - Mediator dashboard first
5. **Connect to backend** - Wire up real API calls
6. **Test again** - Full user journey
7. **Then expand** - Add missing features

**Let's start with Step 1-3 right now?**
