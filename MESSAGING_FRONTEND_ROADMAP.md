# 🎯 Messaging System - Next Steps

**Current Status**: Backend Phase 1 ✅ COMPLETE  
**Next Phase**: Frontend Components  
**Estimated Time**: 4-5 hours

---

## 📋 What's Done

✅ **Database Layer**:
- Messages table with proper schema
- 5 performance indexes
- RLS security policies
- Helper functions

✅ **Backend API** (All tested and working):
- GET `/api/messages/case/:caseId` - Fetch messages
- POST `/api/messages` - Send message
- POST `/api/messages/:id/read` - Mark as read
- POST `/api/messages/bulk-read` - Bulk mark read
- GET `/api/messages/unread/count` - Unread count
- GET `/api/messages/conversations` - All conversations

✅ **Schema Fixes**:
- Updated all queries to use `app_users` table
- Updated case access to use `case_participants` table
- Fixed UUID casting throughout

---

## 🚀 Next: Build Frontend

### Step 1: Create MessagesPage (45 min)

**File**: `frontend/src/pages/divorcee/MessagesPage.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/apiClient';
import MessageList from '../../components/messages/MessageList';
import MessageInput from '../../components/messages/MessageInput';

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get active case from localStorage or context
  const caseId = localStorage.getItem('activeCaseId') || '3bcb2937-0e55-451a-a9fd-659187af84d4';
  
  useEffect(() => {
    fetchMessages();
  }, [caseId]);
  
  async function fetchMessages() {
    try {
      const data = await apiFetch(`/api/messages/case/${caseId}`);
      setMessages(data.messages);
      setParticipants(data.participants);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setLoading(false);
    }
  }
  
  async function handleSendMessage(content) {
    const recipient = participants.find(p => p.id !== user.id);
    
    if (!recipient) {
      alert('No recipient found');
      return;
    }
    
    try {
      await apiFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          recipient_id: recipient.id,
          content,
          attachments: []
        })
      });
      
      fetchMessages(); // Refresh list
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  }
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  const otherParticipant = participants.find(p => p.id !== user.id);
  
  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4">
        <h1 className="text-xl font-semibold text-slate-100">
          Messages with {otherParticipant?.email || 'Mediator'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {messages.length} messages
        </p>
      </header>
      
      {/* Message List */}
      <MessageList 
        messages={messages} 
        currentUserId={user.id} 
      />
      
      {/* Input */}
      <MessageInput onSend={handleSendMessage} />
    </div>
  );
}
```

**To Do**:
- [ ] Create the file
- [ ] Test it renders
- [ ] Verify messages fetch
- [ ] Verify send works

---

### Step 2: Create MessageList Component (30 min)

**File**: `frontend/src/components/messages/MessageList.jsx`

```jsx
import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, currentUserId }) {
  const bottomRef = useRef(null);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="text-lg mb-2">No messages yet</p>
          <p className="text-sm">Send a message to start the conversation</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map(msg => (
        <MessageBubble 
          key={msg.id}
          message={msg}
          isOwnMessage={msg.sender_id === currentUserId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
```

---

### Step 3: Create MessageBubble Component (30 min)

**File**: `frontend/src/components/messages/MessageBubble.jsx`

```jsx
import React from 'react';

export default function MessageBubble({ message, isOwnMessage }) {
  const timestamp = new Date(message.created_at);
  const timeString = timestamp.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
  });
  
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-[70%] rounded-lg p-3 shadow-lg
        ${isOwnMessage 
          ? 'bg-teal-500 text-white' 
          : 'bg-slate-700 text-slate-100'
        }
      `}>
        {/* Sender name (only for received messages) */}
        {!isOwnMessage && (
          <div className="text-xs font-semibold mb-1 opacity-80">
            {message.sender_email}
          </div>
        )}
        
        {/* Message content */}
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        {/* Timestamp and read receipt */}
        <div className="flex items-center justify-end gap-2 text-xs opacity-70 mt-2">
          <span>{timeString}</span>
          {isOwnMessage && (
            <span>{message.read_at ? '✓✓' : '✓'}</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### Step 4: Create MessageInput Component (30 min)

**File**: `frontend/src/components/messages/MessageInput.jsx`

```jsx
import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function MessageInput({ onSend }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (content.trim().length === 0) return;
    
    setSending(true);
    await onSend(content);
    setContent('');
    setSending(false);
  }
  
  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }
  
  return (
    <form 
      onSubmit={handleSubmit}
      className="bg-slate-800 border-t border-slate-700 p-4"
    >
      <div className="flex gap-2 items-end">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          className="flex-1 bg-slate-700 text-slate-100 rounded-lg px-4 py-2 
                     min-h-[44px] max-h-[120px] resize-none
                     focus:outline-none focus:ring-2 focus:ring-teal-500"
          disabled={sending}
          rows={1}
        />
        
        <button
          type="submit"
          disabled={content.trim().length === 0 || sending}
          className="bg-teal-500 hover:bg-teal-600 disabled:bg-slate-600 
                     text-white rounded-lg px-4 py-2 h-[44px]
                     transition-colors flex items-center gap-2"
        >
          {sending ? (
            <span>Sending...</span>
          ) : (
            <>
              <Send size={18} />
              <span>Send</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
```

---

### Step 5: Add Route to App (5 min)

**File**: `frontend/src/App.jsx`

Add this import:
```jsx
import MessagesPage from './pages/divorcee/MessagesPage';
```

Add this route (inside divorcee routes):
```jsx
<Route path="/divorcee/messages" element={<MessagesPage />} />
```

---

### Step 6: Add to Sidebar Menu (10 min)

**File**: `frontend/src/components/Sidebar.jsx`

Add `MessageSquare` to imports:
```jsx
import { MessageSquare, ... } from 'lucide-react';
```

Add to menu items array:
```jsx
{
  label: 'Messages',
  path: '/divorcee/messages',
  icon: MessageSquare,
  badge: unreadCount > 0 ? unreadCount : null
}
```

Add state and effect for unread count:
```jsx
const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  async function fetchUnread() {
    try {
      const data = await apiFetch('/api/messages/unread/count');
      setUnreadCount(data.unread);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }
  
  fetchUnread();
  const interval = setInterval(fetchUnread, 30000); // Poll every 30s
  return () => clearInterval(interval);
}, []);
```

---

### Step 7: Add Real-time (Optional - 1 hour)

**In MessagesPage.jsx**, add Supabase subscription:

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

## 🧪 Testing Checklist

After building frontend:

- [ ] Navigate to `/divorcee/messages`
- [ ] Page loads without errors
- [ ] Messages fetch and display
- [ ] Can send a message
- [ ] Message appears in list immediately
- [ ] Empty state shows when no messages
- [ ] Auto-scroll to bottom works
- [ ] Enter key sends message
- [ ] Shift+Enter adds new line
- [ ] Read receipts show (✓ vs ✓✓)
- [ ] Timestamps format correctly
- [ ] Mobile responsive layout
- [ ] Unread badge shows in sidebar
- [ ] Badge clears when opening messages

---

## 📦 Files to Create Summary

```
frontend/src/
├── pages/divorcee/
│   └── MessagesPage.jsx         (NEW)
└── components/messages/
    ├── MessageList.jsx          (NEW)
    ├── MessageBubble.jsx        (NEW)
    └── MessageInput.jsx         (NEW)
```

**Files to Modify**:
- `frontend/src/App.jsx` - Add route
- `frontend/src/components/Sidebar.jsx` - Add menu item + unread badge

---

## 🎉 When Complete

You'll have a fully functional messaging system with:
- ✅ Real-time message delivery
- ✅ Read receipts
- ✅ Unread count badge
- ✅ Beautiful UI
- ✅ Mobile responsive
- ✅ Keyboard shortcuts

**Total Time**: ~4-5 hours

Let's build it! 🚀
