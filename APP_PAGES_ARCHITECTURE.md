# Mediation App - Complete Pages Architecture

## Overview
This document maps out all pages/routes that should be available in the completed mediation application, organized by user role and functionality.

---

## 🌐 Public Pages (Unauthenticated)

### 1. **Landing Page** `/landing`
- **Purpose**: Marketing/informational page about the mediation service
- **Features**: Service description, benefits, call-to-action
- **Component**: `LandingPage.jsx`
- **Status**: ✅ Implemented

### 2. **Home/Welcome Page** `/`
- **Purpose**: Main entry point with split-panel layout
- **Features**: 
  - Left panel: Welcome message, rotating pastoral messages
  - Right panel: Dynamic content based on auth state (register/signin/dashboard)
  - Menu dropdown for navigation
- **Component**: `HomePage.jsx` with `HomeLayout.jsx`
- **Status**: ✅ Implemented

### 3. **Registration Page** `/register`
- **Purpose**: New user account creation
- **Features**: Email/password registration, role selection (divorcee/mediator/lawyer/admin)
- **Component**: `RegisterForm.jsx`
- **Authentication**: JWT token-based
- **Status**: ✅ Implemented

### 4. **Sign In Page** `/signin`
- **Purpose**: Existing user authentication
- **Features**: Email/password login, role-based redirect
- **Component**: `SignInForm.jsx`
- **Status**: ✅ Implemented

### 5. **Profile Setup** `/profile`
- **Purpose**: Initial profile configuration after registration
- **Features**: Role-specific profile fields
- **Component**: `ProfileSetup.jsx`
- **Status**: ✅ Implemented

### 6. **Role Setup Form** `/setup`
- **Purpose**: Role-specific detailed setup
- **Features**: Different fields based on role (lawyer: firm details, mediator: accreditation, divorcee: personal details)
- **Component**: `RoleSetupForm.jsx`
- **Status**: ✅ Implemented (legacy route)

---

## 👥 Divorcee Dashboard Pages

### 1. **Divorcee Dashboard** `/divorcee`
- **Purpose**: Main dashboard for divorcees
- **Features**:
  - Progress tracker (submitted documents count)
  - Document upload panel (16 required documents grouped by topic)
  - Upcoming events calendar
  - Document history viewer
  - Chat drawer with AI insights sidebar
- **Component**: `routes/divorcee/index.jsx`
- **Key Sub-components**:
  - `DivorceeDocumentsPanel` - Document management with upload/replace/history
  - `ChatDrawer` - Real-time chat with mediator + AI insights
- **Status**: ✅ Implemented with AI integration

### 2. **Divorcee Intake Form** (Embedded in dashboard)
- **Purpose**: Initial case information gathering
- **Features**: Multi-step form for case details
- **Component**: `DivorceeIntakeForm.jsx`
- **Status**: ✅ Implemented

---

## 🧑‍⚖️ Mediator Dashboard Pages

### 1. **Mediator Dashboard** `/mediator`
- **Purpose**: Main dashboard for mediators
- **Features**:
  - Client list (active cases)
  - Today's schedule at a glance
  - Assigned cases overview
  - Action queues (needs review, pending invitations)
  - Case tools (invite participants, update phase, draft reports)
  - Notifications feed
  - Chat drawer with AI insights
- **Component**: `routes/mediator/index.jsx`
- **Status**: ✅ Core structure implemented, needs expansion for case management features

### 2. **Case Management Features** (To be added)
- Invite participants to cases
- Update case phase/status
- Draft and export session reports
- Review uploaded documents
- Manage case participants

---

## ⚖️ Lawyer Dashboard Pages

### 1. **Lawyer Dashboard** `/lawyer`
- **Purpose**: Main dashboard for legal representatives
- **Features**:
  - Client cases list
  - Required documents & access requests
  - Timeline & legal notices
  - Communication with mediator
- **Component**: `routes/lawyer/index.jsx`
- **Status**: ✅ Basic structure implemented, needs expansion

### 2. **Lawyer Features** (To be added)
- View client case documents
- Request additional documentation
- Submit legal opinions/advice
- Track case milestones

---

## 👨‍💼 Admin Dashboard Pages

### 1. **Admin Dashboard** `/admin`
- **Purpose**: System administration and oversight
- **Features**:
  - User & role management
  - System overview KPIs
  - Policies & configuration
  - Audit logs
  - Health checks
- **Component**: `routes/admin/index.jsx`
- **Status**: ✅ Basic structure implemented

### 2. **Role Management** `/admin/roles`
- **Purpose**: Assign and modify user roles
- **Features**: User list, role assignment, permissions
- **Component**: `AdminPage` (same as admin dashboard)
- **Status**: ✅ Implemented

### 3. **User Management** `/admin/users`
- **Purpose**: User account administration
- **Features**: User list, account management
- **Component**: `UserManagementPage.jsx`
- **Status**: ✅ Implemented

---

## 📁 Case Pages (All Roles)

### 1. **Case Overview** `/case/:caseId`
- **Purpose**: Comprehensive case status and AI insights
- **Features**:
  - Case ID display
  - Documents summary panel
  - Timeline visualization
  - **AI Insights Dashboard** (Phase 4.1 ✅)
    - Tone analysis charts
    - Risk assessment indicators
    - Session summaries
    - Key points extracted
    - Auto-generated insights from chat messages
- **Component**: `components/case/CaseOverviewPage.jsx`
- **Sub-components**: `AIInsightsDashboard.jsx`
- **Status**: ✅ Core structure with AI insights implemented

### 2. **Case Details** `/cases/:id`
- **Purpose**: Detailed case information (legacy route)
- **Features**: Case details, participants, notes, requirements
- **Component**: `CaseDetailsPage.jsx`
- **Status**: ✅ Implemented

### 3. **Case Uploads** `/cases/:id/uploads`
- **Purpose**: Document upload management for specific case
- **Features**: Upload list, status, mediator review actions
- **Component**: `UploadsPage.jsx`
- **Status**: ✅ Implemented

---

## 💬 Chat & Communication Features

### **Chat System** (Integrated in dashboards)
- **Purpose**: Real-time communication between parties
- **Features**:
  - Message threading
  - Typing indicators
  - Real-time sync via Supabase subscriptions
  - **AI Assistant Sidebar** (Phase 4.2 ✅)
    - Real-time tone analysis
    - Escalation risk monitoring
    - High-risk alert banners
    - AI-generated suggestions
    - Auto-generated insights every 5 seconds
- **Components**:
  - `ChatDrawer.jsx` - Main chat interface
  - `ChatRoom.jsx` - Message display
  - `ChatInput.jsx` - Message composition
  - `ChatAISidebar.jsx` - AI insights sidebar
- **Status**: ✅ Fully implemented with Phase 4.2.2 real-time AI features

---

## 🔔 Notifications

### **Notifications System** (Global)
- **Purpose**: System-wide notifications for all users
- **Features**:
  - Real-time notification bell counter
  - Dropdown notifications menu
  - Mark as read functionality
  - Notification types: info, upload, participant, note
- **Components**:
  - `NotificationsBell.jsx`
  - `NotificationsMenu.jsx`
  - `NotificationsList.jsx`
  - `NotificationsPanel.jsx`
- **Status**: ✅ Implemented

---

## 🤖 AI Features Integration

### **Completed AI Features** (Phase 1-4.2)
1. ✅ **AI Service Foundation** - OpenAI API integration with 7 functions
2. ✅ **AI Insights Dashboard** - Visual insights display on case overview
3. ✅ **Backend Auto-Analysis** - Automatic AI processing on every chat message
4. ✅ **Real-time Insight Updates** - Frontend polling and high-risk alerts

### **Planned AI Features** (Phase 4.3-4.5)
- 🔲 **Context-Aware Analysis** - Multi-message conversation context
- 🔲 **Session Summary Generator** - End-of-session reports
- 🔲 **Escalation Monitoring** - Advanced risk tracking with alerts
- 🔲 **Real-time Tone Coach** - Suggest neutral rephrasing before sending

---

## 🧪 Development/Testing Pages

### 1. **Plasmic Host** `/plasmic-host`
- **Purpose**: Plasmic design system integration
- **Component**: `PlasmicHost.jsx`
- **Status**: ✅ Implemented

### 2. **Plasmic Test** `/plasmic`
- **Purpose**: Plasmic component testing
- **Component**: `PlasmicPage.jsx`
- **Status**: ✅ Implemented

### 3. **Test Home Layout** `/test-home-layout`
- **Purpose**: Layout component testing
- **Component**: `HomeLayout.jsx`
- **Status**: ✅ Implemented

---

## 🚀 Pages To Be Added (Roadmap)

### High Priority
1. **Case Creation Wizard** `/cases/new`
   - Mediator-initiated case setup
   - Invite initial participants
   - Set case metadata (type, timeline, goals)

2. **Document Review Interface** `/cases/:id/review`
   - Mediator document approval workflow
   - Side-by-side document viewer
   - Annotation and feedback tools

3. **Session Scheduler** `/sessions` or `/mediator/schedule`
   - Calendar view of mediation sessions
   - Schedule new sessions
   - Send invites to participants

4. **Reports & Exports** `/cases/:id/reports`
   - Generate mediation session summaries
   - Export case documentation
   - AI-generated settlement proposals

5. **Mediator Case Assignment** `/admin/assign-cases`
   - Admin assigns cases to mediators
   - Workload balancing view

### Medium Priority
6. **Client Profile Pages** `/clients/:id`
   - Detailed participant profiles
   - Case history
   - Document access

7. **Agreement Tracking** `/cases/:id/agreements`
   - Track agreed-upon terms
   - Version history
   - Digital signatures (future)

8. **Payment/Billing** `/billing`
   - Payment tracking
   - Invoice generation
   - Fee structure management

9. **Knowledge Base** `/help` or `/kb`
   - FAQs
   - Process guides
   - Video tutorials

### Low Priority
10. **Analytics Dashboard** `/admin/analytics`
    - System-wide metrics
    - Case success rates
    - Time-to-resolution tracking
    - AI insights effectiveness metrics

11. **Settings/Preferences** `/settings`
    - User preferences
    - Notification settings
    - Privacy controls

---

## 📊 Route Structure Summary

```
/                              → HomePage (nested routes below)
  ├─ register                  → RegisterForm
  ├─ signin                    → SignInForm
  ├─ profile                   → ProfileSetup
  ├─ dashboard                 → DashboardRedirect (role-based)
  ├─ divorcee                  → DivorceeDashboard
  ├─ mediator                  → MediatorDashboard
  ├─ lawyer                    → LawyerDashboard
  ├─ admin                     → AdminDashboard
  ├─ admin/roles               → AdminPage
  └─ case/:caseId              → CaseOverviewPage

/landing                       → LandingPage
/cases/:id                     → CaseDetailPage
/cases/:id/uploads             → UploadsPage
/admin/users                   → UserManagementPage
/setup                         → RoleSetupForm (legacy)
/plasmic-host                  → PlasmicHost
/plasmic                       → PlasmicPage
/test-home-layout              → Test page
/*                             → NotFoundPage
```

---

## 🔐 Authentication & Authorization

### Protected Routes
All dashboard and case pages require authentication via `PrivateRoute` or `RoleBoundary` components.

### Role-Based Access
- **Divorcee**: Can access own cases, documents, chat
- **Mediator**: Can access assigned cases, all participants, review documents
- **Lawyer**: Can access client cases (where assigned as participant)
- **Admin**: Can access all pages, manage users and roles

### Dev Mode
Development mode uses `dev-fake-token` with `x-dev-email` headers for simplified testing.

---

## 📱 Mobile Responsiveness

All pages use responsive design with Tailwind CSS:
- Grid layouts with `md:` breakpoints
- Mobile-first approach
- Touch-friendly UI elements
- Drawer components for mobile chat

---

## 🎨 Design System

### Components Library
- **UI Components**: `components/ui/` (button, card, badge, dialog, etc.)
- **Layout**: `Layout.jsx`, `DashboardFrame.jsx`, `HomeLayout.jsx`
- **Domain Components**: Case, Documents, Chat, AI, Notifications

### Theme
- Primary color: Blue (#4A90E2)
- Success: Green (#10B981)
- Dark background: Navy (#0f1a2b, #1b2a45)
- Pastoral/calming aesthetic with rounded corners and soft shadows

---

## 📚 Key Features By Page Type

### Dashboard Pages (All Roles)
- Role-specific navigation
- Action cards/tiles
- Quick stats/KPIs
- Notifications integration
- Consistent header with logout

### Case Pages
- Case metadata display
- Participant list
- Document management
- Timeline/activity feed
- AI insights integration

### Document Pages
- Upload/replace/delete actions
- Status badges (pending, confirmed, rejected)
- History tracking
- Mediator review workflow

### Communication Pages
- Real-time chat
- AI assistance sidebar
- Typing indicators
- Message history
- High-risk alerts

---

## ✅ Implementation Status

### Fully Implemented
- Authentication flow (register, login, logout, JWT)
- Role-based dashboards (all 4 roles)
- Document upload system (16 required docs)
- Chat system with real-time sync
- Notifications system
- Case overview with AI insights
- Backend auto-analysis (Phase 4.2.1)
- Real-time AI insights frontend (Phase 4.2.2)

### Partially Implemented
- Mediator dashboard (core structure, needs case management tools)
- Lawyer dashboard (core structure, needs client case features)
- Admin dashboard (core structure, needs full admin tools)

### Not Yet Implemented
- Case creation wizard
- Document review interface
- Session scheduler
- Reports & exports
- Advanced AI features (Phases 4.3-4.5)
- Agreement tracking
- Billing/payments
- Analytics dashboard

---

## 🎯 Next Steps for Complete Application

1. **Case Management System**
   - Case creation workflow
   - Participant invitation system
   - Phase/status management

2. **Document Review Workflow**
   - Mediator approval interface
   - Document annotation
   - Feedback system

3. **Session Management**
   - Calendar/scheduler
   - Session notes
   - Attendance tracking

4. **Advanced AI Features**
   - Context-aware analysis (Phase 4.2.3)
   - Session summaries (Phase 4.3)
   - Escalation monitoring (Phase 4.4)
   - Tone coach (Phase 4.5)

5. **Reporting & Analytics**
   - Case reports
   - System analytics
   - Export functionality

---

## 📝 Notes

- This architecture supports a multi-role mediation platform with AI-assisted communication
- The app uses a pastoral, empathetic design approach (NGK-inspired)
- Real-time features use Supabase subscriptions
- AI features use OpenAI API (gpt-4o-mini model)
- All routes are client-side with React Router
- Backend API runs on Express.js with PostgreSQL via Supabase

**Last Updated**: Phase 4.2.2 Complete (October 2025)
