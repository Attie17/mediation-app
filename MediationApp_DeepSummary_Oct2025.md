# Mediation App — Deep Technical & Product Summary (October 2025)

## 1. Project Overview
Mediation App is a full-stack, multi-role platform for managing divorce mediation cases, document workflows, real-time chat, and AI-powered insights. It is designed for divorcees, mediators, lawyers, and admins, with a focus on privacy, empathy, and legal compliance. The app is built with React (frontend), Node/Express (backend), and Supabase (database, auth, real-time sync).

---

## 2. Architecture & Technology Stack
- **Frontend:** React (Vite), Tailwind CSS, React Router, custom UI components
- **Backend:** Node.js, Express, Supabase (PostgreSQL, Auth, Realtime)
- **AI:** OpenAI API (gpt-4o-mini), backend auto-analysis, frontend AI insights
- **Dev Tools:** Hot Module Reload, singleton pattern for client instances, dev auth with fake tokens for local testing
- **Testing:** Automated smoke tests, PowerShell scripts, backend test runners

---

## 3. Key Features by Role
### Divorcee
- Personalized dashboard with progress tracker
- Document upload panel (16 required docs, grouped by topic)
- Upcoming events calendar
- Document history viewer
- Real-time chat with mediator and AI assistant
- AI insights sidebar (tone, risk, suggestions)
- Intake form for initial case info

### Mediator
- Dashboard with client/case list
- Today’s schedule, assigned cases
- Action queues (needs review, pending invites)
- Case tools: invite, update phase, draft reports
- Notifications feed
- Chat drawer with AI insights

### Lawyer
- Dashboard with client cases
- Required docs & access requests
- Timeline & legal notices
- Communication with mediator

### Admin
- System KPIs, user/role management
- Policies, audit logs, health checks
- Assign/modify user roles

---

## 4. Core Pages & Route Structure
```
/                  → HomePage (nested)
  ├─ register      → RegisterForm
  ├─ signin        → SignInForm
  ├─ profile       → ProfileSetup
  ├─ dashboard     → DashboardRedirect
  ├─ divorcee      → DivorceeDashboard
  ├─ mediator      → MediatorDashboard
  ├─ lawyer        → LawyerDashboard
  ├─ admin         → AdminDashboard
  ├─ admin/roles   → AdminPage
  └─ case/:caseId  → CaseOverviewPage
/landing           → LandingPage
/cases/:id         → CaseDetailPage
/cases/:id/uploads → UploadsPage
/admin/users       → UserManagementPage
/setup             → RoleSetupForm
/plasmic-host      → PlasmicHost
/plasmic           → PlasmicPage
/test-home-layout  → Test page
/*                 → NotFoundPage
```

---

## 5. Chat & AI Features
- Real-time chat (Supabase subscriptions)
- Message threading, typing indicators
- AI Assistant sidebar (OpenAI-powered)
- Tone analysis, risk alerts, suggestions
- Auto-generated insights every 5 seconds
- ChatDrawer, ChatRoom, ChatAISidebar components

---

## 6. Document & Case Management
- Upload/replace/delete docs, status badges
- Mediator review workflow (planned)
- Case metadata, participant list, timeline
- AI insights on case overview
- Document history, annotation (planned)

---

## 7. Authentication & Authorization
- JWT-based auth, role-based dashboards
- PrivateRoute/RoleBoundary for protected pages
- Dev mode: fake token, x-dev-email headers
- Admin endpoints for user/role management

---

## 8. Notifications System
- Real-time bell counter, dropdown menu
- Mark as read, notification types (info, upload, participant, note)
- Global notifications panel

---

## 9. Design & UX
- Pastoral, empathetic design (NGK-inspired)
- Responsive layouts (mobile-first, grid, drawers)
- Custom UI library (button, card, badge, dialog, etc.)
- Theming: blue/green palette, soft shadows, rounded corners

---

## 10. Implementation Status (Oct 2025)
### Fully Implemented
- Auth flow (register, login, logout)
- Role-based dashboards (all 4 roles)
- Document upload system
- Chat system with real-time sync
- Notifications system
- Case overview with AI insights
- Backend auto-analysis (Phase 4.2.1)
- Real-time AI insights frontend (Phase 4.2.2)

### Partially Implemented
- Mediator dashboard (needs case management tools)
- Lawyer dashboard (needs client case features)
- Admin dashboard (needs full admin tools)

### Not Yet Implemented
- Case creation wizard
- Document review interface
- Session scheduler
- Reports & exports
- Advanced AI features (Phases 4.3-4.5)
- Agreement tracking, billing, analytics

---

## 11. Roadmap & Next Steps
- Case creation workflow
- Document review/annotation
- Session management (calendar, notes)
- Advanced AI (context-aware, summaries, escalation)
- Reporting & analytics
- Payment/billing integration

---

## 12. Security & Privacy
- All data stored in Supabase/PostgreSQL
- JWT auth, role-based access
- Document privacy tiers (public/private)
- Secure upload/download endpoints
- Privacy policy and FAQ pages

---

## 13. Testing & DevOps
- Automated smoke tests (backend)
- PowerShell scripts for dev UUIDs
- Hot reload, singleton client pattern
- .env-based config for secrets

---

## 14. Team & Collaboration
- Modular codebase, clear separation of concerns
- Markdown docs for architecture, priorities, and testing
- Designed for easy onboarding of new devs/partners

---

## 15. Contact & Demo
- Demo users: divorcee@test.com, mediator@test.com, admin@test.com
- Local dev: `npm run start` (concurrently runs backend/frontend)
- See README.md for setup, .env config, and test scripts

---

*This document was auto-generated by GitHub Copilot on October 16, 2025. For the latest details, see the in-repo markdown docs.*
