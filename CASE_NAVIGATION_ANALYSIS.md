# Case Navigation Duplication Analysis

## Current State

### Issue 1: Access Denied to Case ID `3fa96133-d9a3-4aee-91e3-9c86ce21663d`

**Root Cause:**
The UUID appears to be a case ID that's being accessed but the user doesn't have proper permissions. This is likely happening in one of these scenarios:

1. **localStorage activeCase Issue**: The case ID stored in `localStorage` might be from a different user's session
2. **API Permission Check**: Backend is correctly blocking access, but frontend is still trying to fetch data
3. **Session/Case Mismatch**: User switched accounts but old case ID persists

**Where it's happening:**
- Sidebar "My Case" section tries to load: `/case/${caseId}` where `caseId = localStorage.getItem('activeCaseId')`
- Multiple API calls reference this case ID

---

### Issue 2: Case Navigation Duplication

**Current Duplication Issues:**

#### **A. Dashboard vs Sidebar**
1. **"Active Cases" (Stats Card)** → Scrolls to "Your Cases" section on dashboard
2. **"Your Cases" (Dashboard Card)** → Lists all cases with click to navigate to `/case/{id}`

#### **B. Sidebar Navigation**
1. **"Case Overview"** → `/case/${caseId}` (My Case section)
2. **"Case Details"** → `/cases/${caseId}` (My Case section)

**Problems Identified:**

| Item | Location | Purpose | Issue |
|------|----------|---------|-------|
| **Active Cases** | Dashboard Stats (Button) | Shows count, scrolls to cases list | ✅ Good - Quick stats |
| **Your Cases** | Dashboard (Card/List) | Shows all assigned cases | ✅ Good - Main list |
| **Case Overview** | Sidebar → `/case/{id}` | Single case details | ⚠️ Confusing name |
| **Case Details** | Sidebar → `/cases/{id}` | Same as overview? | ❌ **DUPLICATE** |

**Path Confusion:**
- `/case/{id}` - Case Overview
- `/cases/{id}` - Case Details (appears to be duplicate route)

---

## Recommendations

### Fix 1: Clear localStorage on Logout
**Problem**: Old case IDs persist across sessions
**Solution**: Clear `activeCaseId` when user logs out

### Fix 2: Consolidate Case Navigation
**Problem**: Too many ways to access the same information
**Solution**: Streamline navigation structure

#### Proposed New Structure:

**Dashboard (Keep):**
- ✅ **Active Cases** stat card (with count)
- ✅ **Your Cases** section (list view with cards)

**Sidebar (Simplify):**

**Current "My Case" Section:**
```
My Case
├── Case Overview      → /case/{id}
├── Communication      → /divorcee/messages
├── Case Details       → /cases/{id}  ← REMOVE (duplicate)
└── Upload Documents   → /cases/{id}/uploads
```

**Proposed "My Case" Section:**
```
My Case
├── Case Dashboard     → /case/{id}  (renamed from "Overview")
├── Messages          → /divorcee/messages (shortened)
└── Documents         → /cases/{id}/uploads (renamed)
```

**Benefits:**
1. Remove `/cases/{id}` route entirely (merge into `/case/{id}`)
2. Clearer naming: "Dashboard" vs "Details"
3. Simplified: 3 items instead of 4
4. Less confusion for users

---

## Implementation Plan

### Step 1: Fix Access Denied Error
- Clear `activeCaseId` from localStorage on logout
- Add validation before using stored case ID
- Show friendly error if case not accessible

### Step 2: Remove Duplicate Route
- Remove "Case Details" from sidebar
- Ensure `/case/{id}` page has all necessary information
- Delete `/cases/{id}` route if it's truly duplicate

### Step 3: Rename for Clarity
- "Case Overview" → "Case Dashboard"
- "Communication Channels" → "Messages"
- "Upload Documents" → "Documents"

### Step 4: Update Active Cases Card
- Keep as-is (works well as quick stat)
- Clicking scrolls to "Your Cases" list ✅

---

## Questions to Answer

1. **Does `/cases/{id}` show different data than `/case/{id}`?**
   - If YES: Rename to clarify difference
   - If NO: Remove duplicate route

2. **Should sidebar show single case or all cases?**
   - Current: Shows single active case
   - Better: Could show "Your Cases" link to dashboard section

3. **What's the primary workflow?**
   - Mediators work on multiple cases → List view important
   - Divorcees have one case → Single case view important

---

## Decision Matrix

| Navigation Item | Keep? | Reason |
|----------------|-------|--------|
| Active Cases (stat) | ✅ YES | Quick overview |
| Your Cases (list) | ✅ YES | Primary case management |
| Case Overview | ✅ YES | But rename to "Case Dashboard" |
| Case Details | ❌ NO | Duplicate of Overview |
| Communication | ✅ YES | But rename to "Messages" |
| Upload Documents | ✅ YES | But rename to "Documents" |
