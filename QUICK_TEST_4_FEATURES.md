# 🧪 Quick Testing Guide - 4 Priority Features

**Servers Running:**
- ✅ Backend: http://localhost:4000
- ✅ Frontend: http://localhost:5173

---

## 🚀 Quick Start (Copy-Paste This)

### Step 1: Open Browser
```
http://localhost:5173
```

### Step 2: Login as Mediator (Paste in Console - F12)
```javascript
localStorage.setItem('token','dev-fake-token');localStorage.setItem('user',JSON.stringify({id:'1a472c78-438c-4b3e-a14d-05ce39d5bfc2',email:'mediator@dev.local',name:'Dev Mediator',role:'mediator'}));localStorage.setItem('activeCaseId','4');localStorage.setItem('devMode','true');location.reload();
```

---

## ✅ Test Checklist

### 1️⃣ Document Review Workflow
**URL**: http://localhost:5173/#/mediator/review

**How to Test:**
1. From mediator dashboard, click **"Go to Review Page →"** in Action Required panel
2. OR directly navigate to: `http://localhost:5173/#/mediator/review`
3. ✅ Check: Pending uploads list appears
4. ✅ Click on a document → Details show in right panel
5. ✅ Click "Approve Document" → Document disappears from list
6. ✅ Click "Reject Document" → Enter reason → Document removed

**What to Look For:**
- ✅ Page loads without errors
- ✅ List shows document type, case ID, date, filename
- ✅ Selection works (right panel updates)
- ✅ Approve/Reject buttons work
- ✅ Success messages appear
- ✅ List refreshes after actions

---

### 2️⃣ Real Cases Display & Navigation
**URL**: http://localhost:5173/#/mediator

**How to Test:**
1. Go to mediator dashboard
2. Scroll to **"Your Cases"** section
3. ✅ Check: Real case titles show (not "Case A", "Case B")
4. ✅ Hover over case card → Scales up, shadow appears
5. ✅ Click on case card → Navigate to case details
6. ✅ Check URL changes to `/case/:caseId`
7. ✅ Click back → Return to dashboard
8. ✅ Click different case → Navigate to different case

**What to Look For:**
- ✅ Real data from database (not placeholder text)
- ✅ Status badges show colors (green=open, blue=in progress, etc.)
- ✅ Progress bars display
- ✅ Last activity dates show
- ✅ Hover effects work smoothly
- ✅ Navigation works both ways

---

### 3️⃣ Participant Management
**URL**: http://localhost:5173/#/case/:caseId (any case)

**How to Test:**
1. Click on any case from mediator dashboard
2. Look for **"Invite"** button (top right, next to progress bar)
3. ✅ Click "Invite" → Modal opens
4. ✅ Try submitting empty form → Validation error shows
5. ✅ Fill in form:
   - Email: `testlawyer@example.com`
   - Name: `Test Lawyer`
   - Role: Select "Lawyer"
6. ✅ Click "Send Invite" → Loading state shows
7. ✅ Check participants list → New participant appears
8. ✅ Check badge color → Purple for lawyer
9. ✅ Repeat with different role → Check correct badge color

**What to Look For:**
- ✅ Invite button visible for mediators
- ✅ Modal opens/closes smoothly
- ✅ Form validation works (email required)
- ✅ Loading state during submission
- ✅ Success message after invite
- ✅ Participant appears immediately
- ✅ Badge colors correct:
  - 🔵 Blue = Divorcee
  - 🟢 Teal = Mediator
  - 🟣 Purple = Lawyer
  - 🟠 Orange = Admin

---

### 4️⃣ Session Scheduler
**URL**: http://localhost:5173/#/mediator/schedule

**How to Test:**
1. From mediator dashboard, click **"Schedule Session"** button (in Case Tools section)
2. OR navigate to: `http://localhost:5173/#/mediator/schedule`
3. ✅ Page loads with "Upcoming Sessions" and "Past Sessions" sections
4. ✅ Click "Schedule Session" button → Modal opens
5. ✅ Try submitting empty form → Validation errors show
6. ✅ Fill in form:
   - Title: `Initial Mediation Session`
   - Date: Select tomorrow
   - Time: `14:00`
   - Duration: `60 minutes`
   - Location: `Virtual - Zoom` (optional)
   - Notes: `First meeting with both parties` (optional)
7. ✅ Click "Create Session" → Shows "Backend not implemented" message (expected)
8. ✅ Click Cancel → Modal closes without saving

**What to Look For:**
- ✅ Page layout clean and professional
- ✅ Modal opens/closes smoothly
- ✅ All form fields render correctly
- ✅ Date picker blocks past dates
- ✅ Duration dropdown works
- ✅ Optional fields can be left empty
- ✅ Form validation works
- ✅ UI responsive and user-friendly

---

## 📊 Quick Navigation Cheat Sheet

| Feature | Direct URL | Dashboard Button |
|---------|-----------|------------------|
| **Document Review** | `/#/mediator/review` | "Go to Review Page →" |
| **Cases Display** | `/#/mediator` | Default dashboard |
| **Participant Invite** | `/#/case/:caseId` | Click any case |
| **Session Scheduler** | `/#/mediator/schedule` | "Schedule Session" |

---

## 🐛 Common Issues & Fixes

### Issue: "Failed to fetch"
**Fix**: Check backend is running on port 4000
```powershell
curl http://localhost:4000/
```

### Issue: Not logged in
**Fix**: Paste mediator login in console (F12):
```javascript
localStorage.setItem('token','dev-fake-token');localStorage.setItem('user',JSON.stringify({id:'1a472c78-438c-4b3e-a14d-05ce39d5bfc2',email:'mediator@dev.local',name:'Dev Mediator',role:'mediator'}));location.reload();
```

### Issue: Page not found
**Fix**: Make sure using hash routes: `/#/mediator` not `/mediator`

### Issue: Console errors
**Fix**: Open DevTools (F12) → Console tab → Screenshot and report errors

---

## 📸 What Success Looks Like

### ✅ Document Review
- List of pending uploads
- Right panel shows details when clicked
- Buttons work and remove documents

### ✅ Cases Display
- Real case titles (not placeholders)
- Cards scale on hover
- Clicking navigates to case page

### ✅ Participant Management
- Invite modal opens
- Can add participants
- They appear with correct colored badges

### ✅ Session Scheduler
- Clean calendar interface
- Modal form works
- Date picker restricts past dates

---

## 🎯 Test Results Template

Copy this and fill in as you test:

```
✅ / ❌ Document Review Workflow
   - Page loads: 
   - List displays: 
   - Approve works: 
   - Reject works: 
   - Notes:

✅ / ❌ Cases Display & Navigation
   - Real data shows: 
   - Hover works: 
   - Navigation works: 
   - Notes:

✅ / ❌ Participant Management
   - Invite button visible: 
   - Modal works: 
   - Can add participant: 
   - Badge colors correct: 
   - Notes:

✅ / ❌ Session Scheduler
   - Page loads: 
   - Modal works: 
   - Form validation: 
   - Date picker works: 
   - Notes:
```

---

## 🚨 Report Issues

If you find any bugs, please note:
1. Which feature (1-4)
2. What you did (steps)
3. What happened (actual result)
4. What you expected (expected result)
5. Any console errors (F12 → Console)

---

**Ready to test!** Open http://localhost:5173 and paste the login script in console (F12). 🚀
