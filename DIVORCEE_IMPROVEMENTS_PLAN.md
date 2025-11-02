# Divorcee Dashboard - Issues & Improvements Needed

## 🐛 Current Issues

### 1. Sidebar Menu Duplication
**Problem**: Three "Divorcee" items appear in Case Workspace and Case Details sections
**Status**: ❌ NEEDS INVESTIGATION
**Location**: Check `DashboardFrame.jsx` or sidebar component for duplicate menu generation
**Fix Needed**: Remove duplicate entries, keep only "Divorcee Dashboard" in main navigation

### 2. Case Uploads - No Page
**Problem**: "Case Uploads" menu item exists but shows blank page
**Status**: ❌ BROKEN
**Location**: Route `/divorcee/uploads` not defined in App.jsx
**Fix Needed**: 
- Add route in App.jsx: `<Route path="divorcee/uploads" element={<DivorceeUploadsPage />} />`
- Create `DivorceeUploadsPage` component
- OR redirect "Case Uploads" to main divorcee dashboard which already has document panel

---

## ✨ Features to Add

### 3. Document Checklist (16 Items)
**Status**: ⏳ PARTIALLY EXISTS
**Current**: `DivorceeDocumentsPanel` component exists and is rendered
**Missing**: 
- Explicit checklist UI showing all 16 documents
- Tick/check marks when uploaded
- Categories:
  - **Financial** (4 docs): Bank statements, Tax returns, Pay stubs, Asset list
  - **Personal** (4 docs): ID, Marriage certificate, Separation agreement, Contact info
  - **Children** (4 docs): Birth certificates, School records, Custody preferences, Child support calc
  - **Property** (4 docs): Deeds, Mortgage, Vehicle titles, Valuations

**Implementation Plan**:
```jsx
const REQUIRED_DOCUMENTS = [
  { id: 1, category: 'Financial', name: 'Bank Statements (last 6 months)', uploaded: false },
  { id: 2, category: 'Financial', name: 'Tax Returns (last 2 years)', uploaded: false },
  // ... 14 more
];

// UI with checkboxes showing completion status
```

### 4. AI Chat Integration
**Status**: ✅ EXISTS BUT HIDDEN
**Current**: `ChatDrawer` component is imported and functional (line 270 of divorcee/index.jsx)
**Access**: Button exists: "Chat with Mediator" in Support Section
**Issues**:
- Not prominent enough
- Should be labeled "AI Assistant" not "Chat with Mediator"
- Should be persistent/floating, not just in support section

**Improvements Needed**:
- Add floating AI button (bottom-right corner) visible on all divorcee pages
- Rename to "AI Assistant" or "Ask AI"
- Icon: Robot/Sparkles instead of MessageSquare

### 5. AI Document Validation
**Status**: ❌ NOT IMPLEMENTED
**Requirement**: AI should automatically review uploaded documents and provide feedback
**Features Needed**:
- Scan document after upload
- Check for:
  - Correct document type
  - Readability/quality
  - Required information present
  - Dates are current/valid
- Provide instant feedback: ✅ "Looks good!" or ⚠️ "Please check: dates seem outdated"

**Technical Approach**:
```javascript
// After document upload
const validateDocument = async (fileId, docType) => {
  const response = await fetch('/api/ai/validate-document', {
    method: 'POST',
    body: JSON.stringify({ fileId, docType, userId })
  });
  return response.json(); // { valid: true, feedback: "Document looks complete" }
};
```

### 6. Proactive AI Nudges
**Status**: ❌ NOT IMPLEMENTED
**Requirement**: Detect hesitation and offer help
**Triggers**:
- Idle on upload page > 30 seconds
- Mouse hovering over help icon
- Returning to same page multiple times
- No activity for 2 minutes

**UI**: 
- Small animated bubble from AI button
- Message: "I'm here to help! Need guidance?" or "Having trouble? Just ask!"
- Non-intrusive, dismissible

**Implementation**:
```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    if (!hasInteracted) {
      showAINudge("I'm here to help! Need guidance?");
    }
  }, 30000); // 30 seconds
  
  return () => clearTimeout(timer);
}, [hasInteracted]);
```

### 7. First-Time AI Introduction
**Status**: ❌ NOT IMPLEMENTED
**Requirement**: Show introduction modal when divorcee logs in for first time
**Content**:
- "Meet Your AI Assistant"
- What it can help with:
  - Document guidance
  - Process questions
  - Deadline reminders
  - General support
- Privacy assurance: "Your information is confidential"
- CTA: "Got it!" or "Take a tour"

**Implementation**:
```javascript
useEffect(() => {
  const hasSeenIntro = localStorage.getItem('ai-intro-seen');
  if (!hasSeenIntro && user?.role === 'divorcee') {
    setShowAIIntro(true);
    localStorage.setItem('ai-intro-seen', 'true');
  }
}, [user]);
```

---

## 📋 Implementation Priority

### Phase 1: Critical Fixes (Do First)
1. ✅ **Fix sidebar duplication** - Remove duplicate menu items
2. ✅ **Fix Case Uploads page** - Either create page or redirect to main dashboard
3. ✅ **Make AI Chat more prominent** - Floating button, rename to "AI Assistant"

### Phase 2: Document Management (Week 1)
4. ✅ **Complete document checklist** - Show all 16 items with categories
5. ✅ **Add checkmarks/ticks** - Visual feedback when uploaded
6. ✅ **AI document validation** - Instant feedback after upload

### Phase 3: AI Enhancements (Week 2)
7. ✅ **Proactive AI nudges** - Detect hesitation, offer help
8. ✅ **First-time introduction** - Welcome modal explaining AI assistant

---

## 🎯 Expected Outcome

After implementation, divorcee experience should be:
1. **Clear navigation** - No duplicate menu items
2. **Guided process** - Checklist shows exactly what's needed
3. **Supportive AI** - Always available, proactive when needed
4. **Quality assurance** - Documents validated immediately
5. **Confidence building** - First-time users understand AI is there to help

---

## 📁 Files to Modify/Create

### Existing Files to Update:
- `frontend/src/routes/divorcee/index.jsx` - Add floating AI button
- `frontend/src/components/DashboardFrame.jsx` - Fix sidebar duplication
- `frontend/src/components/documents/DivorceeDocumentsPanel.jsx` - Add detailed checklist
- `frontend/src/App.jsx` - Add Case Uploads route

### New Files to Create:
- `frontend/src/routes/divorcee/uploads.jsx` - Dedicated uploads page (OR redirect)
- `frontend/src/components/ai/FloatingAIButton.jsx` - Persistent AI access
- `frontend/src/components/ai/AIIntroModal.jsx` - First-time introduction
- `frontend/src/components/ai/AINudge.jsx` - Proactive help prompts
- `backend/src/routes/ai-document-validation.js` - Document validation endpoint

### Backend Routes to Add:
- `POST /api/ai/validate-document` - AI document validation
- `POST /api/ai/chat` - AI conversation (may already exist)
- `GET /api/documents/checklist/:userId` - Get user's document completion status

---

## 🚀 Quick Start Action Items

1. **TODAY**: Investigate sidebar duplication, fix Case Uploads route
2. **THIS WEEK**: Implement document checklist UI with 16 items
3. **NEXT WEEK**: Add floating AI button and first-time introduction
4. **FOLLOWING**: AI document validation and proactive nudges

