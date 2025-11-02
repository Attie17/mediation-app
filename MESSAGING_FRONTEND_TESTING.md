# 🧪 Messaging System - Frontend Testing Guide

**Date**: October 25, 2025  
**Status**: Frontend complete, ready for testing  
**URL**: http://localhost:5173/divorcee/messages

---

## ✅ What Was Built

### Components Created (4 files)
1. **`MessagesPage.jsx`** - Main page component with state management
2. **`MessageList.jsx`** - Scrollable message thread with empty state
3. **`MessageBubble.jsx`** - Individual message with timestamps and read receipts
4. **`MessageInput.jsx`** - Compose area with auto-resize and keyboard shortcuts

### Integration Complete
- ✅ Route added to `App.jsx`: `/divorcee/messages`
- ✅ Menu item added to Sidebar: "Messages" (in "My Case" section)
- ✅ Unread badge added (polls every 30 seconds)
- ✅ `apiFetch` integration for all API calls

---

## 🧪 Testing Checklist

### Test 1: Navigation
- [ ] Open http://localhost:5173
- [ ] Log in as Bob (divorcee)
- [ ] See "Messages" in sidebar under "My Case" section
- [ ] Click "Messages" → Navigate to `/divorcee/messages`

### Test 2: Empty State
- [ ] If no messages, see:
  - Message icon
  - "No messages yet" text
  - "Send a message to start the conversation" subtext

### Test 3: Load Existing Messages
- [ ] Page shows header with recipient name
- [ ] Message count shows correctly
- [ ] Existing message from Bob → Alice appears
- [ ] Message shows:
  - ✅ Content: "Hello Alice, this is Bob..."
  - ✅ Timestamp
  - ✅ Read receipt (✓✓ since Alice marked it read)
  - ✅ Teal background (own message)

### Test 4: Send New Message
- [ ] Type "Test message from frontend" in input box
- [ ] See character count updates
- [ ] Textarea auto-resizes as you type
- [ ] Press Enter → Message sends
- [ ] Loading state shows ("Sending...")
- [ ] Message appears in list immediately
- [ ] Input clears after send
- [ ] Auto-scrolls to bottom

### Test 5: Keyboard Shortcuts
- [ ] Type message
- [ ] Press Shift+Enter → Adds new line (doesn't send)
- [ ] Press Enter → Sends message
- [ ] Input focus maintained

### Test 6: Message Formatting
**Send a long message** (copy this):
```
This is a test message with multiple lines.

It should wrap properly and show:
- Line breaks
- Proper spacing
- Read receipts at bottom right
```

- [ ] Message wraps at 70% width
- [ ] Line breaks preserved
- [ ] Read receipt shows at bottom right
- [ ] Timestamp formatted correctly

### Test 7: Receive Message (Open as Alice)
- [ ] Open new incognito window
- [ ] Go to http://localhost:5173
- [ ] Log in as Alice (mediator)
  - Email: `alice.mediator@example.com`
  - User ID: `11111111-1111-4111-8111-111111111111`
- [ ] Navigate to Messages
- [ ] See Bob's messages
- [ ] Messages appear on LEFT (gray background)
- [ ] Shows sender email above message
- [ ] No read receipts (not own messages)

### Test 8: Send Reply (As Alice)
- [ ] Type "Hello Bob, I received your message!"
- [ ] Press Enter
- [ ] Message appears on RIGHT (teal background)
- [ ] Read receipt shows ✓ (delivered)

### Test 9: Unread Badge
- [ ] As Alice, send 2 messages to Bob
- [ ] Don't open as Bob yet
- [ ] In Bob's window, check sidebar
- [ ] "Messages" menu item shows badge with "2"
- [ ] Badge is teal/blue with white text
- [ ] Badge is circular

### Test 10: Mark as Read
- [ ] As Bob, click "Messages" menu item
- [ ] Page opens, messages load
- [ ] Badge should disappear (or count should decrease)
- [ ] In Alice's window, refresh messages
- [ ] Bob's messages now show ✓✓ (read)

### Test 11: Error Handling
**Test backend offline**:
- [ ] Stop backend server
- [ ] Refresh Messages page
- [ ] See error state:
  - Message icon
  - "Failed to load messages"
  - Error message
  - "Try Again" button
- [ ] Click "Try Again" → Shows same error
- [ ] Restart backend
- [ ] Click "Try Again" → Messages load

**Test send failure**:
- [ ] Stop backend
- [ ] Try to send message
- [ ] Should show error (console log)
- [ ] Message doesn't appear in list
- [ ] Input not cleared

### Test 12: Back Navigation
- [ ] Click back arrow (←) in header
- [ ] Navigate to `/divorcee/dashboard`
- [ ] Click "Messages" again
- [ ] Messages still there (state persists)

### Test 13: Responsive Design
- [ ] Resize browser window to mobile width (375px)
- [ ] Messages still readable
- [ ] Input area responsive
- [ ] Send button shows icon only on small screens
- [ ] Message bubbles max-width 70%

### Test 14: Performance
- [ ] Open Messages page
- [ ] Check load time (should be < 500ms)
- [ ] Send 10 messages rapidly
- [ ] UI remains responsive
- [ ] No lag in typing
- [ ] Auto-scroll smooth

### Test 15: Edge Cases
**Empty message**:
- [ ] Click in input, don't type anything
- [ ] Send button is disabled
- [ ] Can't submit with Enter

**Whitespace only**:
- [ ] Type "     " (5 spaces)
- [ ] Send button enabled (bug or feature?)
- [ ] Try to send → Backend should reject

**Very long message**:
- [ ] Type 500+ character message
- [ ] Textarea expands to max height (120px)
- [ ] Becomes scrollable
- [ ] Message sends successfully
- [ ] Displays with proper wrapping

---

## 🐛 Known Limitations (Not Real-time Yet)

### What Works Now:
- ✅ Send/receive messages
- ✅ Manual refresh to see new messages
- ✅ Unread badge (polls every 30s)
- ✅ Mark as read on page load

### What Doesn't Work Yet (Phase 3):
- ❌ Messages don't appear instantly (need to refresh)
- ❌ No typing indicators
- ❌ Badge updates every 30s, not instant
- ❌ No notification sound
- ❌ No browser notifications

---

## 🚀 Next: Add Real-time (Phase 3)

To get instant updates, we need to add Supabase real-time subscriptions:

### In `MessagesPage.jsx`, add:
```jsx
import { supabase } from '../../lib/supabase';

useEffect(() => {
  const channel = supabase
    .channel(`messages-case-${caseId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `case_id=eq.${caseId}`
    }, (payload) => {
      const newMessage = payload.new;
      
      // Only add if from other person
      if (newMessage.sender_id !== user.id) {
        setMessages(prev => [...prev, newMessage]);
        
        // Mark as read automatically
        apiFetch(`/api/messages/${newMessage.id}/read`, { method: 'POST' });
      }
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, [caseId]);
```

---

## 📊 Success Metrics

After testing, confirm:
- [ ] All 15 tests pass
- [ ] No console errors
- [ ] Load time < 500ms
- [ ] Smooth animations
- [ ] Accessible (keyboard navigation works)
- [ ] Mobile responsive
- [ ] Error states handled gracefully

---

## 🎉 When All Tests Pass

Document results and move to Phase 3 (Real-time)!

**Files to review**:
- `frontend/src/pages/divorcee/MessagesPage.jsx`
- `frontend/src/components/messages/MessageList.jsx`
- `frontend/src/components/messages/MessageBubble.jsx`
- `frontend/src/components/messages/MessageInput.jsx`
- `frontend/src/components/Sidebar.jsx`
- `frontend/src/App.jsx`
