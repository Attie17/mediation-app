# Case Menu Fix - October 13, 2025

## Issue
When clicking "Case Overview" in the sidebar, got error:
```
invalid input syntax for type uuid: "4"
```

## Root Cause
The application was using `'4'` as a fallback case ID, but the database expects UUID format (e.g., `'550e8400-e29b-41d4-a716-446655440000'`).

## Solution
**Hide case-related menu items** if there's no valid case ID stored.

### Changes Made

#### 1. `frontend/src/components/Sidebar.jsx`
- Added validation check: `hasValidCase = caseId && caseId.length > 10`
- Wrapped Cases section in conditional rendering: `...(hasValidCase ? [{ ... }] : [])`
- Cases section now only appears when user has a valid case ID

#### 2. `frontend/src/pages/HomePage.jsx`
- Same validation check added to HamburgerMenuOverlay (legacy component)
- Cases section conditionally rendered

## Behavior

### Before:
- ❌ Cases menu always visible
- ❌ Clicking "Case Overview" caused UUID error
- ❌ Using hardcoded fallback `'4'` (invalid UUID)

### After:
- ✅ Cases menu **only shows** if valid case exists
- ✅ No errors when case ID is missing
- ✅ Clean user experience - no broken links

## When Cases Section Appears

The **Cases** menu section (Overview, Details, Uploads) will show when:
- User has completed intake process
- A case ID is stored in `localStorage` as `activeCaseId`
- The case ID is valid (longer than 10 characters, UUID-like)

## When Cases Section is Hidden

The **Cases** menu section will be hidden when:
- User hasn't created a case yet
- No `activeCaseId` in localStorage
- Case ID is invalid or too short

## User Experience

### New User (No Case):
```
📍 Navigation
  - Home

📊 Dashboards
  - My Dashboard
  - [role-specific dashboards]

🔧 Admin Tools (admin only)
  - User Management
  - Role Management

👤 Account
  - Profile Settings
  - Notifications

🚪 Logout
```

### User with Case:
```
📍 Navigation
  - Home

📊 Dashboards
  - My Dashboard
  - [role-specific dashboards]

📋 Cases ← NOW VISIBLE
  - Case Overview
  - Case Details
  - Case Uploads

🔧 Admin Tools (admin only)
  - User Management
  - Role Management

👤 Account
  - Profile Settings
  - Notifications

🚪 Logout
```

## Testing

To test:
1. **New user** - Cases section should be hidden
2. **After intake** - Cases section appears (when activeCaseId is set)
3. **Click Case Overview** - Should work without UUID error

## Future Improvements

Could enhance by:
- [ ] Show "Create Case" button when no case exists
- [ ] Display case name/number in menu instead of generic "Case Overview"
- [ ] Add case selector if user has multiple cases
- [ ] Show case status indicator in menu

---

*Fixed: October 13, 2025*
*Files: Sidebar.jsx, HomePage.jsx*
