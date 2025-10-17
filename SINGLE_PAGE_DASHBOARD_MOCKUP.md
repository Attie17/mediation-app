# Single-Page Dashboard Layout - Design Mockup

## Overview
Replace the two-frame blue layout with a modern, full-page dashboard that serves as the main landing page after sign-in.

---

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  ☰  MediationApp            👤 Attie Nel (Mediator)    [Logout]    │ ← Top Navigation Bar
│                                                                       │   (Slate-800 background)
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│   Good morning, Attie ☀️                                            │ ← Welcome Section
│   You have 5 active cases and 3 pending reviews                     │   (Large, friendly)
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────── Quick Actions ─────────────────────────────────────┐
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐│
│  │   📋        │  │   👥        │  │   📄        │  │   💬      ││
│  │             │  │             │  │             │  │           ││
│  │ My Cases    │  │ My Clients  │  │  Documents  │  │   Chat    ││ ← Large Action Cards
│  │             │  │             │  │             │  │           ││   (Gradient backgrounds)
│  │   5 active  │  │   12 total  │  │  3 pending  │  │  2 unread ││   (Teal/Blue/Coral)
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘│
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────── All Pages ────────────────────────────────────────┐
│                                                                       │
│  DASHBOARDS                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐│
│  │ 🏠          │  │ 👤          │  │ ⚖️          │  │ 👔        ││
│  │ My          │  │ Divorcee    │  │ Mediator    │  │ Lawyer    ││ ← Navigation Cards
│  │ Dashboard   │  │ Dashboard   │  │ Dashboard   │  │ Dashboard ││   (Gradient on hover)
│  │             │  │             │  │             │  │           ││
│  │ ✓ Access    │  │ 🔒 Locked   │  │ ✓ Access    │  │ 🔒 Locked││
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘│
│                                                                       │
│  CASES                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ 📋          │  │ 📄          │  │ 📎          │                │
│  │ Case        │  │ Case        │  │ Case        │                │
│  │ Overview    │  │ Details     │  │ Uploads     │                │
│  │             │  │             │  │             │                │
│  │ ✓ Access    │  │ ✓ Access    │  │ ✓ Access    │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│                                                                       │
│  ADMIN                                                               │
│  ┌─────────────┐  ┌─────────────┐                                  │
│  │ 👥          │  │ 🔐          │                                  │
│  │ User        │  │ Role        │                                  │
│  │ Management  │  │ Management  │                                  │
│  │             │  │             │                                  │
│  │ 🔒 Locked   │  │ 🔒 Locked   │                                  │
│  └─────────────┘  └─────────────┘                                  │
│                                                                       │
│  ACCOUNT                                                             │
│  ┌─────────────┐                                                    │
│  │ ⚙️          │                                                    │
│  │ Profile     │                                                    │
│  │ Setup       │                                                    │
│  │             │                                                    │
│  │ ✓ Access    │                                                    │
│  └─────────────┘                                                    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Color Scheme

### Top Navigation Bar
```
Background: Slate-800 (#1e293b)
Text: White
Logo: Teal accent (#14b8a6)
User badge: Slate-700 with white text
```

### Welcome Section
```
Background: Gradient from Slate-800 to Slate-900
Heading: White, 3xl font
Subtext: Slate-400
```

### Quick Action Cards (Top Priority)
```
Card 1 (My Cases): Gradient Teal → Blue
Card 2 (My Clients): Gradient Blue → Purple  
Card 3 (Documents): Gradient Coral → Orange
Card 4 (Chat): Gradient Teal → Cyan

All cards:
- Large icons (3rem)
- White text
- Drop shadow on hover
- Scale transform on hover (1.05)
- Shimmer animation on primary action
```

### Navigation Cards
```
Authorized:
- Background: Slate-700/30 with gradient overlay
- Border: Slate-600/50
- Hover: Scale 1.03, border becomes teal
- Icon: Colorful (matches card theme)
- Status: Green checkmark "✓ Access"

Locked:
- Background: Slate-800/50
- Border: Slate-700/30
- Text: Slate-500 (grayed)
- Icon: Slate-600 (desaturated)
- Status: Lock icon "🔒 Locked"
- Cursor: not-allowed
```

---

## Responsive Behavior

### Desktop (1440px+)
- 4 cards per row for Quick Actions
- 4 cards per row for Navigation Cards
- Full navigation visible

### Tablet (768px - 1439px)
- 2 cards per row for Quick Actions
- 3 cards per row for Navigation Cards
- Hamburger menu auto-collapses

### Mobile (< 768px)
- 1-2 cards per row (stacked)
- Simplified Quick Actions (top 2 only)
- Hamburger menu always
- Compact spacing

---

## Hamburger Menu (Overlay)

When clicking ☰ in top-left:

```
┌─────────────────────────────────┐
│  [✕] Close                      │
│                                  │
│  DASHBOARDS                      │
│  🏠 My Dashboard        →       │
│  👤 Divorcee Dashboard  🔒      │
│  ⚖️  Mediator Dashboard  →       │
│  👔 Lawyer Dashboard    🔒      │
│  👨‍💼 Admin Dashboard     🔒      │
│                                  │
│  CASES                           │
│  📋 Case Overview       →       │
│  📄 Case Details        →       │
│  📎 Case Uploads        →       │
│                                  │
│  ADMIN                           │
│  👥 User Management     🔒      │
│  🔐 Role Management     🔒      │
│                                  │
│  ACCOUNT                         │
│  ⚙️  Profile Setup       →       │
│                                  │
│  ────────────────────────        │
│  👤 ds.attie.nel@gmail.com      │
│  Role: Mediator                  │
└─────────────────────────────────┘
```

- Full-screen overlay (same as current)
- Slate-800 background
- Same role-based access control
- Grayed items with 🔒 for locked pages

---

## Key Improvements

### 1. **Removes Blue Frame**
- No more dated blue background
- Modern slate-gray color scheme
- Matches new dashboard designs

### 2. **Single Scrollable Page**
- No more two separate scroll areas
- Cleaner user experience
- Better for mobile

### 3. **Visual Page Discovery**
- See all available pages at once
- Clear visual indication of access level
- Cards invite exploration

### 4. **Better Space Utilization**
- Full-width content area
- No wasted horizontal space
- Responsive grid layout

### 5. **Consistent Design Language**
- Uses same card components as dashboards
- Same color palette (teal/coral/blue)
- Same gradient effects and hover states

### 6. **Role-Based Clarity**
- Immediately see what you can access
- Locked pages visible but clearly marked
- No confusion about permissions

---

## Technical Implementation

### Component Structure
```
HomePage (new layout)
├── TopNavigationBar
│   ├── Logo
│   ├── HamburgerMenu (trigger)
│   ├── UserBadge
│   └── LogoutButton
├── WelcomeSection
│   ├── Greeting (time-based)
│   └── StatusSummary
├── QuickActionsGrid
│   └── ActionCard (4x, primary CTAs)
├── NavigationCardsSection
│   ├── SectionHeading (Dashboards/Cases/Admin/Account)
│   └── NavigationCard (many, role-based)
└── HamburgerMenuOverlay (same as current)
```

### Props for NavigationCard Component
```javascript
{
  icon: '📋',
  label: 'Case Overview',
  path: '/case/4',
  authorized: true,
  gradient: 'from-teal-500/20 to-blue-500/5',
  badge: '5 active' // optional
}
```

---

## User Flow

### Current (Two-Frame)
1. Sign in → See blue frame with menu on left
2. Click menu items to navigate
3. Content shows on right side
4. Menu always visible (takes space)

### New (Single Dashboard)
1. Sign in → **Full-page role dashboard** (Mediator/Divorcee/etc)
2. See quick action cards at top
3. Scroll to see all available pages as cards
4. Click any card to navigate
5. Hamburger menu available for quick navigation
6. Each page uses full width

---

## Before/After Comparison

### BEFORE: Two-Frame Layout
```
┌──────────┬────────────────────────┐
│  Menu    │  Content               │
│  (Blue)  │                        │
│          │  Dashboard here        │
│  Items   │                        │
│  Listed  │                        │
│          │                        │
└──────────┴────────────────────────┘
```

### AFTER: Single Dashboard
```
┌─────────────────────────────────────┐
│  Top Bar (☰ Logo User Logout)     │
├─────────────────────────────────────┤
│  Welcome Section                    │
│  Quick Actions (4 large cards)     │
│  All Pages (categorized cards)     │
│    - Dashboards                     │
│    - Cases                          │
│    - Admin                          │
│    - Account                        │
└─────────────────────────────────────┘
```

---

## Mobile View

```
┌─────────────────────────┐
│ ☰  MediationApp    👤   │
├─────────────────────────┤
│ Good morning, Attie ☀️ │
│ 5 cases, 3 reviews      │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │  📋 My Cases        │ │
│ │  5 active           │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │  💬 Chat            │ │
│ │  2 unread           │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ DASHBOARDS              │
│ ┌─────────────────────┐ │
│ │ 🏠 My Dashboard     │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ ⚖️ Mediator (Locked)│ │
│ └─────────────────────┘ │
│ [scroll for more...]    │
└─────────────────────────┘
```

---

## Animation & Interactions

### Card Hover States
- Scale: 1 → 1.03
- Shadow: md → lg
- Border: slate-600 → teal-500
- Duration: 200ms ease

### Locked Card Interactions
- Cursor: not-allowed
- Tooltip: "You need [role] access"
- No hover scale
- Slightly reduced opacity

### Quick Action Cards
- Shimmer animation on gradient
- Pulse on notification badge
- Smooth color transition

---

## Accessibility

- **Keyboard Navigation**: Tab through all cards
- **Focus States**: Visible teal ring on focus
- **Screen Readers**: Proper ARIA labels
- **Color Contrast**: All text meets WCAG AA
- **Status Indicators**: Text + icons (not color alone)

---

## Next Steps to Implement

1. Create new `HomePage.jsx` with single-page layout
2. Create `NavigationCard` component
3. Create `QuickActionCard` component  
4. Create `TopNavigationBar` component
5. Update routing to show dashboard as default
6. Keep hamburger menu overlay (already works)
7. Remove old two-frame layout
8. Test responsive behavior

**Estimated Time**: 2-3 hours

---

**Status**: 📋 Mockup Ready for Review
**Design Version**: 2.0 (Post Two-Frame Removal)
