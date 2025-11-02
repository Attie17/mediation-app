# Sidebar Navigation - Visual Guide

## New Sidebar Structure

```
┌─────────────────────────────────┐
│  🎯 MediationApp                │
│     Mediator                    │
├─────────────────────────────────┤
│  DASHBOARDS                     │
│  👥 Mediator Dashboard          │
│  📄 Lawyer Dashboard            │
│  👥 Divorcee Dashboard          │
│                                 │
│  CASES                          │
│  📄 Case Workspace              │
│  📄 Case Details                │
│  📄 Case Uploads                │
│                                 │
│  CASE TOOLS            ⬅ NEW!  │
│  💬 Chat & AI Assistant         │
│  📅 Schedule Session            │
│                                 │
│  ADMIN TOOLS                    │
│  👥 User Management             │
│  🛡️ Role Management             │
│                                 │
│  ACCOUNT                        │
│  ⚙️ Profile Settings            │
│  🔔 Notifications               │
│                                 │
├─────────────────────────────────┤
│  mediator@test.com              │
│  Role: mediator                 │
│  🚪 Logout                      │
└─────────────────────────────────┘
```

## What Changed

### ❌ REMOVED from Dashboard
The "Open Chat & AI" button that was in the "Case Tools" card on the Mediator Dashboard

### ✅ ADDED to Sidebar
A new "Case Tools" section with:
- **Chat & AI Assistant** - Opens chat drawer with AI features
- **Schedule Session** - Navigate to session scheduling

## User Experience Flow

### Before:
```
1. User on any page
2. Navigate to Mediator Dashboard
3. Scroll to "Case Tools" card
4. Click "Open Chat & AI" button
5. ChatDrawer opens
```

### After:
```
1. User on any page
2. Click "Chat & AI Assistant" in sidebar
3. ChatDrawer opens immediately
```

**Result**: 2 fewer steps! 🎉

## Role-Based Visibility

| Section      | Admin | Mediator | Lawyer | Divorcee |
|--------------|-------|----------|--------|----------|
| Case Tools   | ✅    | ✅       | ✅     | ❌       |
| - Chat & AI  | ✅    | ✅       | ✅     | ❌       |
| - Schedule   | ✅    | ✅       | ❌     | ❌       |

## Click Behavior

### Regular Menu Items
```javascript
{ label: 'Schedule Session', path: '/mediator/schedule' }
```
→ Navigates to the specified route

### Action Menu Items
```javascript
{ label: 'Chat & AI Assistant', action: 'openChat' }
```
→ Triggers a callback function (opens ChatDrawer)

## ChatDrawer State Management

```
HomePage (Root Component)
  └─ Manages chatOpen state
  └─ Passes handleOpenChat to Sidebar
  └─ Renders <ChatDrawer> at app level

Sidebar
  └─ Receives onOpenChat prop
  └─ Calls onOpenChat() when clicked

Result: Chat accessible from anywhere!
```

## Quick Actions Card (Dashboard)

The dashboard card was renamed and updated:

**Old:**
```
┌─────────────────────────────┐
│ Case Tools                  │
├─────────────────────────────┤
│ [Create Case] [Schedule]    │
│ [Invite]      [Chat & AI]   │
└─────────────────────────────┘
```

**New:**
```
┌─────────────────────────────┐
│ Quick Actions               │
├─────────────────────────────┤
│ [Create Case] [Schedule]    │
│ [Invite]      [Draft Report]│
└─────────────────────────────┘
```

## Testing Checklist

- [ ] Sidebar shows "Case Tools" section
- [ ] "Chat & AI Assistant" button visible for mediators
- [ ] Click opens ChatDrawer
- [ ] ChatDrawer works from any page
- [ ] Dashboard no longer has "Open Chat & AI" button
- [ ] Dashboard shows "Draft Report" button instead
- [ ] Card title says "Quick Actions"
- [ ] Schedule Session in sidebar works
- [ ] Schedule Session in dashboard works (both go to same place)
