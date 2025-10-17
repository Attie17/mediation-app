# Next Step: Connect Frontend to Backend - Action Plan

## Current Status Analysis

### ✅ What's Already Connected:
1. **Authentication** - Login/Register working
2. **Case Overview Page** - Shows real AI insights and case data
3. **Document Uploads** - Divorcee can upload documents
4. **Chat System** - Messages and AI analysis working
5. **Basic API Infrastructure** - All endpoints exist

### ❌ What's NOT Connected (Still Using Placeholder Data):
1. **Dashboard Statistics** - All showing zeros
2. **Real User Data** - Using hardcoded names
3. **Dynamic Lists** - Cases, documents, sessions all empty
4. **Role-Specific Data** - No filtering by user role

## The Problem

All three main dashboards have this pattern:

```javascript
// TODO: Fetch real data from backend
const stats = {
  activeCases: 0,        // ❌ Should come from backend
  pendingReviews: 0,     // ❌ Should come from backend
  todaySessions: 0,      // ❌ Should come from backend
  resolvedThisMonth: 0   // ❌ Should come from backend
};
```

**Affected Dashboards:**
- ❌ Lawyer Dashboard (`frontend/src/routes/lawyer/index.jsx`)
- ❌ Mediator Dashboard (`frontend/src/routes/mediator/index.jsx`)
- ❌ Admin Dashboard (`frontend/src/routes/admin/index.jsx`)
- ✅ Divorcee Dashboard - Partially connected (has documents)

## Yes, This Should Be Your Next Step! 🎯

Here's why:
1. **UI/UX is Complete** - All dashboards look professional
2. **Backend Endpoints Exist** - Just need to call them
3. **User Experience Gap** - Empty dashboards feel incomplete
4. **Testing Needs** - Can't properly test with fake data

## Implementation Plan

### Phase 1: Create Dashboard Stats Endpoints (Backend)

#### 1.1 Create Admin Stats Endpoint
**File:** `backend/src/routes/admin-stats.js`
```javascript
// GET /api/admin/stats
- Total users count
- Active cases count
- Resolved cases count
- Pending invites count
- System health metrics
```

#### 1.2 Create Mediator Stats Endpoint
**File:** `backend/src/routes/mediator-stats.js`
```javascript
// GET /api/dashboard/mediator/:userId
- Assigned cases count
- Pending reviews count
- Today's sessions count
- Resolved this month count
- Recent activity
```

#### 1.3 Create Lawyer Stats Endpoint
**File:** `backend/src/routes/lawyer-stats.js`
```javascript
// GET /api/dashboard/lawyer/:userId
- Client cases count
- Pending documents count
- Upcoming sessions count
- Completed this month count
- Client list
```

#### 1.4 Create Divorcee Stats Endpoint (if needed)
```javascript
// GET /api/dashboard/divorcee/:userId
- Active case progress
- Document upload status
- Upcoming sessions
- Recent messages
```

### Phase 2: Connect Frontend (React Hooks)

#### 2.1 Create API Service Hook
**File:** `frontend/src/hooks/useDashboardStats.js`
```javascript
export function useDashboardStats(role, userId) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await apiFetch(`/api/dashboard/${role}/${userId}`);
        setStats(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [role, userId]);

  return { stats, loading, error };
}
```

#### 2.2 Update Dashboard Components
Replace hardcoded stats with API calls:

```javascript
// BEFORE
const stats = {
  activeCases: 0,
  pendingReviews: 0,
  todaySessions: 0,
  resolvedThisMonth: 0
};

// AFTER
const { user } = useAuth();
const { stats, loading, error } = useDashboardStats('mediator', user.id);

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

### Phase 3: Database Queries

For each endpoint, create efficient queries:

#### Admin Stats Query
```sql
SELECT 
  (SELECT COUNT(*) FROM app_users) as total_users,
  (SELECT COUNT(*) FROM cases WHERE status = 'active') as active_cases,
  (SELECT COUNT(*) FROM cases WHERE status = 'resolved') as resolved_cases,
  (SELECT COUNT(*) FROM invitations WHERE status = 'pending') as pending_invites
```

#### Mediator Stats Query
```sql
SELECT 
  (SELECT COUNT(*) FROM case_participants 
   WHERE user_id = $1 AND role = 'mediator') as assigned_cases,
  (SELECT COUNT(*) FROM uploads 
   WHERE case_id IN (SELECT case_id FROM case_participants WHERE user_id = $1)
   AND status = 'pending') as pending_reviews,
  (SELECT COUNT(*) FROM sessions 
   WHERE mediator_id = $1 AND DATE(scheduled_at) = CURRENT_DATE) as todays_sessions,
  (SELECT COUNT(*) FROM cases 
   WHERE mediator_id = $1 
   AND status = 'resolved' 
   AND DATE(resolved_at) >= DATE_TRUNC('month', CURRENT_DATE)) as resolved_this_month
```

#### Lawyer Stats Query
```sql
SELECT 
  (SELECT COUNT(*) FROM case_participants 
   WHERE user_id = $1 AND role = 'lawyer') as client_cases,
  (SELECT COUNT(*) FROM document_requirements 
   WHERE case_id IN (SELECT case_id FROM case_participants WHERE user_id = $1)
   AND status = 'pending') as pending_documents,
  (SELECT COUNT(*) FROM sessions 
   WHERE case_id IN (SELECT case_id FROM case_participants WHERE user_id = $1)
   AND scheduled_at > NOW()) as upcoming_sessions,
  (SELECT COUNT(*) FROM cases 
   WHERE case_id IN (SELECT case_id FROM case_participants WHERE user_id = $1)
   AND status = 'resolved' 
   AND DATE(resolved_at) >= DATE_TRUNC('month', CURRENT_DATE)) as completed_this_month
```

## Implementation Order (Recommended)

### Sprint 1: Backend API Endpoints (2-3 days)
1. ✅ Day 1: Create admin stats endpoint + test
2. ✅ Day 2: Create mediator stats endpoint + test
3. ✅ Day 3: Create lawyer stats endpoint + test

### Sprint 2: Frontend Integration (2-3 days)
1. ✅ Day 1: Create `useDashboardStats` hook + API service
2. ✅ Day 2: Connect Admin & Mediator dashboards
3. ✅ Day 3: Connect Lawyer dashboard + error handling

### Sprint 3: Polish & Real Data (1-2 days)
1. ✅ Add loading states and spinners
2. ✅ Add error boundaries
3. ✅ Test with real user scenarios
4. ✅ Add auto-refresh (optional)

## Benefits of This Approach

### 1. **Progressive Enhancement**
- Dashboards already look good with placeholder data
- Real data makes them functional
- Can deploy incrementally (one dashboard at a time)

### 2. **Improved Testing**
- Can test with real scenarios
- Catch data inconsistencies early
- Validate business logic

### 3. **Better User Experience**
- Users see their actual data
- Makes the app feel "real"
- Builds confidence in the system

### 4. **Enables New Features**
- Can't add features without real data
- Filtering, sorting, searching all need real data
- Analytics and reporting need real data

## Current vs. After Implementation

### Current State:
```
Mediator Dashboard:
├── Active Cases: 0          ← Hardcoded
├── Pending Reviews: 0       ← Hardcoded
├── Today's Sessions: 0      ← Hardcoded
└── Resolved This Month: 0   ← Hardcoded
```

### After Implementation:
```
Mediator Dashboard:
├── Active Cases: 5          ← From database
├── Pending Reviews: 3       ← From database
├── Today's Sessions: 2      ← From database
└── Resolved This Month: 8   ← From database
```

## Quick Win Opportunity

**Start with ONE dashboard** to prove the pattern works:
1. **Mediator Dashboard** (most complex, most features)
2. Once working, replicate for Lawyer and Admin
3. Pattern: Backend endpoint → Frontend hook → Update component

## Files That Need Changes

### Backend (Create New):
- `backend/src/routes/admin-stats.js` (new)
- `backend/src/routes/mediator-stats.js` (new)
- `backend/src/routes/lawyer-stats.js` (new)
- `backend/src/index.js` (add new routes)

### Frontend (Modify):
- `frontend/src/hooks/useDashboardStats.js` (new)
- `frontend/src/routes/mediator/index.jsx` (update)
- `frontend/src/routes/lawyer/index.jsx` (update)
- `frontend/src/routes/admin/index.jsx` (update)

## Estimated Effort

**Total Time:** 5-7 days
- Backend endpoints: 2-3 days
- Frontend integration: 2-3 days
- Testing & polish: 1-2 days

**Complexity:** Medium
- Database queries: Moderate
- React hooks: Easy
- API integration: Easy

## Alternative: Quick Mock Data

If you want to see the dashboards with data **immediately** without backend work:

```javascript
// Quick mock for testing UI
const stats = {
  activeCases: 5,
  pendingReviews: 3,
  todaySessions: 2,
  resolvedThisMonth: 8
};
```

But this is NOT a real solution - just for visual testing!

---

## Recommendation: YES, Do This Next! 🚀

**Why:**
1. ✅ UI is ready and looks great
2. ✅ Natural progression after Phase 4 (UI/UX)
3. ✅ Makes the app actually functional
4. ✅ Unlocks testing and validation
5. ✅ Relatively straightforward implementation

**Start with:** Mediator Dashboard backend endpoint
**Timeline:** Can have basic version working in 1 week
**Impact:** HIGH - Transforms app from prototype to functional system

---

**Status:** Ready to implement
**Priority:** HIGH
**Next Phase:** Phase 5 - Backend-Frontend Data Integration
