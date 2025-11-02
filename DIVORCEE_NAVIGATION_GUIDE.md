# Divorcee Navigation Guide

## What Should Divorcees See?

### 1. **Main Dashboard** (`/divorcee`)
**Purpose**: Your home base with overview and quick actions

**What you'll see**:
- Welcome message with your name
- Progress bar showing document completion (X of 16 complete)
- Case status indicator
- **Required Documents** section with upload functionality
- Upcoming session card
- Recent activity feed
- Support/Help section

**This is your MAIN landing page after login** ✅

---

### 2. **Case Overview** (`/case/:caseId`)
**Purpose**: Detailed workspace view of your case

**What you'll see**:
- Case title and description
- Overall progress percentage
- List of participants (you, spouse, mediator, lawyer)
- Document requirements with status
- Recent uploads
- AI insights about your case
- Invite participant button (mediator only - you won't see this)

**Good for**: Getting a comprehensive view of everything happening in your case

**Is this appropriate for divorcees?** ✅ YES - Shows all case information in one place

---

### 3. **Case Details** (`/cases/:id`)
**Purpose**: Administrative view with timeline and contacts

**What you'll see**:
- Case status badge (open, in_progress, resolved, closed)
- Created date
- Full participant list with contact information
- Upcoming mediation sessions with date/time/location
- Back button to return to previous page
- "Go to Workspace" button linking to Case Overview

**Good for**: Checking session schedules and contacting participants

**Is this appropriate for divorcees?** ✅ YES - Shows important administrative info

---

### 4. **Upload Documents** (`/cases/:id/uploads`)
**Purpose**: Dedicated page for managing all document uploads

**What you'll see**:
- Progress summary (Submitted / Remaining / Total Required)
- Green/Orange/Teal status cards
- Upload guidelines (file formats, size limits, review timeline)
- Full document checklist organized by category
- Upload/Replace buttons for each document
- View buttons to see previously uploaded files

**Good for**: Focusing on document uploads without distractions

**Is this appropriate for divorcees?** ✅ YES - Essential for completing case requirements

---

## Recommended Navigation Flow

### For First-Time Users:
1. **Start at Divorcee Dashboard** (`/divorcee`)
   - See your overall progress
   - Understand what needs to be done
   
2. **Click "Upload Documents"** in sidebar
   - Go to dedicated upload page
   - Upload all required documents
   
3. **Check Case Overview** occasionally
   - See participant activity
   - Review AI insights
   
4. **Use Case Details** when needed
   - Find contact information
   - Check session schedules

### Sidebar Menu Explained:

**Dashboards Section**:
- `Divorcee Dashboard` → Your main home page ⭐

**My Case Section** (only shows if you have an active case):
- `Case Overview` 📂 → Comprehensive case workspace
- `Case Details` ℹ️ → Administrative info & contacts
- `Upload Documents` 📤 → Dedicated upload interface

**Case Tools**:
- `AI Assistant` 💬 → Chat with AI for help (coming soon)

**Account**:
- `Profile Settings` ⚙️ → Update your information
- `Notifications` 🔔 → View alerts and messages

---

## Which Page Should Divorcees Land On After Login?

### Current Setup: ✅ CORRECT
After dev-login or password login, divorcees are redirected to:
1. `/dashboard` → This route triggers `DashboardRedirect.jsx`
2. `DashboardRedirect.jsx` checks user role
3. For divorcees, redirects to `/divorcee` 
4. **Result**: Divorcee Dashboard loads

This is **exactly right** because:
- Shows personalized welcome
- Displays progress at a glance
- Provides quick access to documents
- Shows upcoming sessions
- Offers help/support section

---

## Case Overview vs Divorcee Dashboard

### When to use Divorcee Dashboard (`/divorcee`):
- ✅ Daily check-in
- ✅ See overall progress
- ✅ Quick document uploads
- ✅ Check status at a glance
- ✅ Access AI Assistant

### When to use Case Overview (`/case/:caseId`):
- ✅ Need detailed case information
- ✅ Want to see all participants
- ✅ Review document requirements in detail
- ✅ See what everyone else uploaded
- ✅ Check AI case insights

**Both are appropriate!** They serve different purposes:
- **Divorcee Dashboard** = Personal, focused, action-oriented
- **Case Overview** = Comprehensive, detailed, collaborative

---

## Answer to Your Question: "Is Case Overview the Right Landing Page for Divorcees?"

### Short Answer: **NO** ❌

**The Divorcee Dashboard (`/divorcee`) should be the landing page**, and it currently is! ✅

### Why?
1. **Personal**: Shows progress specific to the divorcee
2. **Actionable**: Highlights what needs to be done
3. **Simple**: Not overwhelming with too much information
4. **Focused**: Designed for divorcee workflow

### Case Overview Should Be:
- Accessible from sidebar menu ✅ (already is: "Case Overview")
- Used when divorcee wants more details ✅
- Not the default landing page ❌

---

## Summary

✅ **Divorcee Dashboard** (`/divorcee`) = Correct landing page  
✅ **Case Overview** (`/case/:caseId`) = Good for detailed view, accessible from sidebar  
✅ **Case Details** (`/cases/:id`) = Good for admin info, accessible from sidebar  
✅ **Upload Documents** (`/cases/:id/uploads`) = Dedicated upload page, accessible from sidebar  

**Current setup is correct!** Divorcees land on their personalized dashboard and can navigate to other views as needed.

