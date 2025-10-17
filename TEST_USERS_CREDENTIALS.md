# Test User Credentials

All dashboards have been updated to fetch real data from the backend. Use these credentials to test each dashboard:

## Login at: http://localhost:5173

### Admin User
- **Email:** admin@test.com
- **Password:** admin123
- **User ID:** 440342fe-b388-5a85-99b4-17a334fecc1e
- **Dashboard:** http://localhost:5173/admin
- **Can Access:** All dashboards (admin bypass enabled)

### Mediator User
- **Email:** mediator@test.com
- **Password:** med123
- **User ID:** 1dd8067d-daf8-5183-bf73-4e685cf6d58a
- **Dashboard:** http://localhost:5173/mediator

### Lawyer User
- **Email:** lawyer@test.com
- **Password:** law123
- **User ID:** f88052b2-553c-55b1-9a35-94a63a7dd2ae
- **Dashboard:** http://localhost:5173/lawyer

### Divorcee User
- **Email:** divorcee@test.com
- **Password:** div123
- **User ID:** 86baaef1-1d52-54d3-97e9-a424da4113f9
- **Dashboard:** http://localhost:5173/divorcee

---

## What to Test

For each user:
1. ✅ Login successfully
2. ✅ Dashboard loads without errors
3. ✅ Stats show loading ('...') briefly
4. ✅ Stats display numbers (currently zeros due to no case data)
5. ✅ No "Failed to fetch" or "Unable to connect to server" errors
6. ✅ Open browser console (F12) and verify no errors
7. ✅ Check Network tab - API call to /dashboard/stats/* should return 200

## Expected Stats (No Data Yet)

All stats will show **0** because there's no test data in the database yet:

- **Admin:** totalUsers=0, activeCases=0, resolvedCases=0, pendingInvites=0
- **Mediator:** activeCases=0, pendingReviews=0, todaySessions=0, resolvedThisMonth=0
- **Lawyer:** clientCases=0, pendingDocuments=0, upcomingSessions=0, completedThisMonth=0
- **Divorcee:** caseStatus='no_case', documentsUploaded=0, documentsPending=0, unreadMessages=0

---

## Phase 2 Complete! ✨

All 4 dashboards are now:
- ✅ Fetching real data from backend APIs
- ✅ Showing loading states
- ✅ Handling errors gracefully
- ✅ Using consistent patterns (useState/useEffect)

*Created: October 13, 2025*
