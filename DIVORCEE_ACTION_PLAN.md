# Divorcee Section - Quick Action Plan 🚀

**For Tonight's Session / Next Development Sprint**

---

## 🎯 Tonight's Quick Wins (30-60 minutes)

### **1. Make Help Buttons Functional** ⏱️ 15 min
**Current**: Buttons are placeholders  
**Fix**: Create actual pages or modals

```jsx
// In divorcee/index.jsx, replace:
<button>Privacy Policy</button>
<button>What to Expect</button>
<button>FAQ</button>

// With:
<button onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
<button onClick={() => setShowGuide(true)}>What to Expect</button>
<button onClick={() => setShowFAQ(true)}>FAQ</button>
```

**Files to Create**:
- `frontend/src/components/modals/PrivacyModal.jsx`
- `frontend/src/components/modals/ProcessGuideModal.jsx`
- `frontend/src/components/modals/FAQModal.jsx`

---

### **2. Add Progress to Page Title** ⏱️ 5 min
```jsx
// In divorcee/index.jsx
useEffect(() => {
  const percent = Math.round((score.submittedCount / score.total) * 100);
  document.title = `My Case (${percent}% Complete) | Mediation`;
}, [score]);
```

---

### **3. Add "Recent Activity" Section** ⏱️ 20 min
**Replace empty placeholder with actual activity**

```jsx
// Fetch recent activities
const [activities, setActivities] = useState([]);

useEffect(() => {
  const fetchActivities = async () => {
    const data = await apiFetch(`/api/activities/${userId}?limit=5`);
    setActivities(data.activities || []);
  };
  fetchActivities();
}, [userId]);

// Show in UI
<div className="space-y-2">
  {activities.length > 0 ? (
    activities.map(activity => (
      <ActivityItem key={activity.id} activity={activity} />
    ))
  ) : (
    <EmptyState title="No recent activity" />
  )}
</div>
```

**Backend Needed**: Activity tracking endpoint

---

### **4. Add Keyboard Shortcuts** ⏱️ 15 min
```jsx
// Add useKeyboardShortcuts hook
import { useEffect } from 'react';

function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Don't trigger if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const handler = shortcuts[e.key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);
}

// Use in dashboard
useKeyboardShortcuts({
  'c': () => setChatOpen(true),
  '?': () => setShowHelp(true)
});
```

---

### **5. Add Estimated Time Remaining** ⏱️ 10 min
```jsx
// Calculate estimated time
const docsRemaining = score.total - score.submittedCount;
const estimatedMinutes = docsRemaining * 3; // 3 min per document
const estimatedHours = Math.floor(estimatedMinutes / 60);
const remainingMinutes = estimatedMinutes % 60;

// Display in Next Steps card
<div className="text-sm text-slate-400 mt-2">
  ⏱️ Estimated time to complete: 
  {estimatedHours > 0 && ` ${estimatedHours}h`}
  {remainingMinutes > 0 && ` ${remainingMinutes}m`}
</div>
```

---

## 📋 This Week's Priorities (20-30 hours)

### **Priority 1: Messaging System** 🔴 CRITICAL
**Estimated Time**: 12-15 hours

#### **Frontend Tasks**:
1. **Message Center Page** (`/divorcee/messages`) - 4 hours
   - Message list view
   - Thread selection
   - Message composer
   - File attachment UI

2. **Chat Components** - 3 hours
   - `MessageThread.jsx`
   - `MessageBubble.jsx`
   - `MessageComposer.jsx`
   - `AttachmentPreview.jsx`

3. **Real-time Integration** - 2 hours
   - Supabase subscriptions for messages
   - Typing indicators
   - Read receipts
   - Notification badges

#### **Backend Tasks**:
1. **Messages Table** - 1 hour
   ```sql
   CREATE TABLE messages (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     case_id INT REFERENCES cases(id),
     sender_id UUID REFERENCES users(id),
     recipient_id UUID REFERENCES users(id),
     content TEXT NOT NULL,
     attachments JSONB,
     read_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Messages API** - 3 hours
   - `GET /api/messages/:caseId` - List messages
   - `POST /api/messages` - Send message
   - `PUT /api/messages/:id/read` - Mark as read
   - `POST /api/messages/:id/attachment` - Upload attachment

3. **Real-time Triggers** - 1 hour
   - Supabase trigger for new messages
   - Email notification on new message

---

### **Priority 2: Session Management** 🔴 CRITICAL
**Estimated Time**: 8-10 hours

#### **Frontend Tasks**:
1. **Upcoming Sessions Card Enhancement** - 3 hours
   - Fetch actual session data
   - Display session details (date, time, mediator)
   - Join button (for virtual sessions)
   - Preparation checklist

2. **Session Detail Modal** - 2 hours
   - Full session information
   - Participant list
   - Agenda/topics
   - Reschedule request button

3. **Session Preparation Page** - 2 hours
   - Pre-session checklist
   - Document review
   - Questions to ask
   - Virtual session tech check

#### **Backend Tasks**:
1. **Sessions Table** - 1 hour
   ```sql
   CREATE TABLE sessions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     case_id INT REFERENCES cases(id),
     mediator_id UUID REFERENCES users(id),
     session_date TIMESTAMP NOT NULL,
     duration_minutes INT DEFAULT 60,
     location TEXT,
     virtual_link TEXT,
     status TEXT DEFAULT 'scheduled',
     notes TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Sessions API** - 2 hours
   - `GET /api/sessions/:caseId` - List sessions
   - `POST /api/sessions` - Create session (mediator only)
   - `PUT /api/sessions/:id/reschedule` - Request reschedule

---

### **Priority 3: Case Timeline/Overview** 🟡 HIGH
**Estimated Time**: 6-8 hours

#### **Frontend Tasks**:
1. **Case Overview Page** (`/divorcee/case`) - 4 hours
   - Case status summary
   - Timeline component
   - Participant cards
   - Key dates & milestones
   - Document completion tracker

2. **Timeline Component** - 3 hours
   ```jsx
   <Timeline>
     <TimelineItem 
       date="Dec 1, 2024"
       event="Case Created"
       icon={<CheckCircle />}
       status="complete"
     />
     <TimelineItem 
       date="Dec 5, 2024"
       event="Documents Uploaded (11/16)"
       icon={<FileText />}
       status="in-progress"
     />
     <TimelineItem 
       date="TBD"
       event="First Session"
       icon={<Calendar />}
       status="upcoming"
     />
   </Timeline>
   ```

#### **Backend Tasks**:
1. **Case Timeline API** - 1 hour
   - `GET /api/cases/:id/timeline` - Get all activities
   - Auto-generate from existing data (uploads, messages, sessions)

---

## 🎨 Next Week: UX Enhancements (15-20 hours)

### **1. Document Enhancements**
- [ ] Document templates page
- [ ] Bulk upload with drag-and-drop
- [ ] Camera upload for mobile
- [ ] Document preview before upload
- [ ] Upload progress indicator

### **2. Educational Content**
- [ ] FAQ page with 20+ common questions
- [ ] "What to Expect" guide (step-by-step)
- [ ] Video tutorials (embedded)
- [ ] Glossary of terms
- [ ] Privacy policy content

### **3. Notifications**
- [ ] Notification bell in navbar
- [ ] Notification list view
- [ ] Mark as read/unread
- [ ] Email notification settings

### **4. Profile Management**
- [ ] Edit profile page
- [ ] Change password
- [ ] Email preferences
- [ ] Privacy settings

---

## 🚀 Month 1 Roadmap

### **Week 1**: Critical Features Part 1
- ✅ Messaging system (frontend + backend)
- ✅ Session management (frontend + backend)
- Testing & bug fixes

### **Week 2**: Critical Features Part 2
- ✅ Case timeline/overview
- ✅ Activity feed
- Testing & bug fixes

### **Week 3**: Enhanced Documents
- ✅ Document templates
- ✅ Bulk upload
- ✅ Mobile camera integration
- ✅ Document preview

### **Week 4**: Education & Communication
- ✅ FAQ page
- ✅ "What to Expect" guide
- ✅ Notifications center
- ✅ Profile management

---

## 📊 Success Metrics

### **Track These KPIs**:
1. **Document Completion Rate**
   - % of users who upload all 16 documents
   - Average time to complete uploads

2. **User Engagement**
   - Daily active users
   - Messages sent per user
   - Session attendance rate

3. **User Satisfaction**
   - Net Promoter Score (NPS)
   - Feature usage rates
   - Support tickets reduction

4. **AI Effectiveness**
   - % users who interact with AI
   - % users who complete welcome guide
   - Proactive nudge conversion rate

---

## 🎯 Definition of Done

### **For Each Feature**:
- [ ] Frontend UI implemented
- [ ] Backend API working
- [ ] Real-time updates (if applicable)
- [ ] Mobile responsive
- [ ] Error handling in place
- [ ] Loading states shown
- [ ] Empty states designed
- [ ] Accessibility checked
- [ ] Documentation updated
- [ ] User tested (internal)

---

## 💼 Resource Allocation

### **If Solo Developer**:
- Focus on **messaging first** (highest impact)
- Then **session management**
- Then **case timeline**
- Polish and iterate

### **If Team of 2**:
- **Developer 1**: Messaging + Sessions (backend + frontend)
- **Developer 2**: Timeline + Documents (frontend + UX)

### **If Team of 3+**:
- **Developer 1**: Backend APIs (messages, sessions, timeline)
- **Developer 2**: Frontend features (messaging, sessions)
- **Developer 3**: UX enhancements (documents, education, notifications)
- **Designer**: UI/UX improvements, mobile design
- **QA**: Testing, accessibility, user feedback

---

## 🎓 Learning Resources

### **For Messaging Implementation**:
- Supabase real-time subscriptions
- WebSocket basics
- Chat UI best practices
- File upload handling

### **For Session Management**:
- Calendar integration (.ics files)
- Video API integration (Zoom, Jitsi)
- Scheduling algorithms
- Timezone handling

### **For Timeline**:
- Event sourcing patterns
- Activity feed design
- Infinite scroll implementation
- Date/time formatting

---

## 🛠️ Tools & Libraries Needed

### **Frontend**:
```bash
npm install @dnd-kit/core @dnd-kit/sortable  # Drag and drop
npm install react-dropzone                    # File upload
npm install date-fns                          # Date formatting
npm install react-webcam                      # Camera access
npm install react-markdown                    # Markdown rendering
```

### **Backend**:
```bash
npm install multer                            # File uploads
npm install nodemailer                        # Email notifications
npm install agenda                            # Job scheduling
npm install socket.io                         # WebSocket (alternative)
```

---

## 🎉 Celebrate Wins

### **After Tonight**:
- Help buttons work! ✅
- Progress in page title ✅
- Keyboard shortcuts ✅
- Estimated time shown ✅

### **After Week 1**:
- Users can message their mediator! 🎉
- Sessions are visible and joinable! 🎉
- Case timeline shows progress! 🎉

### **After Month 1**:
- Full-featured divorcee experience! 🚀
- Educational resources complete! 📚
- Mobile-friendly! 📱
- Happy users! 😊

---

**Remember**: Progress over perfection. Ship small, iterate fast, get feedback, improve! 🔥

---

*Action Plan Created: December 2024*  
*Next Update: After Week 1 completion*
