# Mediator Documents Page Implementation

## Problem Identified
The "Documents" link in the mediator sidebar was pointing to `/cases/:caseId/uploads`, which is the divorcee's upload page for a specific case. Mediators need a comprehensive view of all documents across all their cases.

## Solution Implemented

### 1. New Mediator Documents Page
**File:** `frontend/src/routes/mediator/Documents.jsx`

**Features:**
- **Cases Overview Section**
  - Grid of all cases with document statistics
  - Shows total documents, pending reviews, approved, and new (unviewed) counts per case
  - Click to filter documents by specific case
  - Visual indicators with color-coded badges

- **Document Statistics Per Case:**
  - Total documents
  - Pending reviews (orange)
  - New/unviewed documents (blue)
  - Approved documents (green)

- **Advanced Filtering:**
  - **By Status:** All, New, Pending, Approved
  - **By Case:** Click any case card to filter, or "Show all cases"
  - **By Search:** Search by document type, filename, or case name

- **Documents List:**
  - All documents across all cases in one view
  - Shows document type, case name, upload date, status
  - "New" badge for documents not yet viewed by mediator
  - Status badges (Pending, Approved, Rejected)
  - Relative time display (e.g., "2 days ago", "Yesterday")

- **Quick Actions:**
  - Preview button (opens DocumentViewer modal)
  - Download button (direct download link)
  - Click anywhere on card to preview

- **Document Information Displayed:**
  - Document type (formatted nicely)
  - Case name and ID
  - Upload date (relative time)
  - Original filename
  - Status badges
  - New indicator

### 2. Routing Updates
**File:** `frontend/src/App.jsx`

- Added import for `MediatorDocuments`
- Added route: `/mediator/documents`
- Protected with `RoleBoundary` for mediator/admin only

### 3. Navigation Updates
**File:** `frontend/src/components/Sidebar.jsx`

**Changes:**
- Removed "Documents" from "My Case" section for mediators
- Added "All Documents" link in "Case Tools" section (mediator-specific)
- Points to `/mediator/documents`
- "My Case" section now only shows for divorcees and lawyers
- Clearer separation between role-specific navigation

**New Structure:**
```
My Case (divorcee/lawyer only)
  - Messages
  - My Documents (case-specific)

Case Tools (mediator/admin)
  - Create New Case
  - All Documents ← NEW
  - Invite Participants
  - Reviews
  - Schedule Session
  - Draft Report
```

## Benefits

1. **Centralized View:** Mediators can see all documents across all cases in one place
2. **Better Organization:** Documents grouped by case with clear statistics
3. **Quick Filtering:** Multiple filter options for finding specific documents
4. **New Document Tracking:** Visual indicators for unviewed documents
5. **Status Overview:** Quick view of pending vs approved documents
6. **Easy Access:** One-click preview and download
7. **Search Capability:** Find documents by type, filename, or case name
8. **Responsive Design:** Works on desktop and mobile

## Technical Details

- Uses existing API endpoints (cases and uploads)
- Integrates with DocumentViewer component for previews
- Consistent styling with other mediator pages
- No backend changes required
- Leverages existing authentication and authorization

## Future Enhancements (Optional)

1. Mark documents as "viewed by mediator" (requires backend update)
2. Bulk actions (approve multiple, download multiple)
3. Comment count display (when comment UI is implemented)
4. Sort options (by date, case, type, status)
5. Export list to CSV
6. Document type filtering (e.g., only show ID cards)

## Testing Checklist

- [ ] Navigate to `/mediator/documents`
- [ ] Verify cases display with correct statistics
- [ ] Click case card to filter documents
- [ ] Test all filter buttons (All, New, Pending, Approved)
- [ ] Test search functionality
- [ ] Click preview button to view document
- [ ] Click download button to download document
- [ ] Verify status badges display correctly
- [ ] Test "Show all cases" button
- [ ] Verify navigation from sidebar works
- [ ] Check responsive design on mobile

## API Endpoints Used

1. `GET /api/cases/user/:userId` - Fetch mediator's cases
2. `GET /api/cases/:caseId/uploads` - Fetch documents for each case

## Notes

- The page aggregates data from multiple API calls (one per case)
- Documents are sorted by upload date (newest first)
- The "viewed by mediator" feature requires a backend update to track views
- Preview uses the existing DocumentViewer component
- All existing functionality (document review, approval) remains in `/mediator/review`
