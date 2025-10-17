# Menu System - Role-Based Navigation

## Overview
The hamburger menu in the top-left of the application provides comprehensive navigation to all pages in the system, with role-based access control.

## Features

### 1. **Automatic Role Detection**
- Menu items are enabled/disabled based on user's role
- Unauthorized pages are grayed out with a lock icon 🔒
- Tooltip shows which roles can access each page

### 2. **Complete Page Listing**
The menu shows ALL pages organized into sections:

#### **Dashboards Section**
- 🏠 My Dashboard (redirects to role-specific dashboard)
- 👤 Divorcee Dashboard (divorcee, admin)
- ⚖️ Mediator Dashboard (mediator, admin)
- 👔 Lawyer Dashboard (lawyer, admin)
- 👨‍💼 Admin Dashboard (admin only)

#### **Cases Section**
- 📋 Case Overview (all roles)
- 📄 Case Details (all roles)
- 📎 Case Uploads (all roles)

#### **Admin Section**
- 👥 User Management (admin only)
- 🔐 Role Management (admin only)

#### **Account Section**
- ⚙️ Profile Setup (all authenticated users)

### 3. **Visual Indicators**
- **Active page**: Highlighted with white background and bold text
- **Accessible pages**: White text, hover effect
- **Restricted pages**: Grayed out (30% opacity), lock icon, no hover effect
- **Current role**: Shown at bottom of menu with email

### 4. **Not Signed In**
When user is not authenticated:
- Menu shows only "Sign In" and "Register" options
- All other pages are hidden until authentication

## Role Access Matrix

| Page                    | Divorcee | Mediator | Lawyer | Admin |
|-------------------------|----------|----------|--------|-------|
| My Dashboard            | ✅       | ✅       | ✅     | ✅    |
| Divorcee Dashboard      | ✅       | ❌       | ❌     | ✅    |
| Mediator Dashboard      | ❌       | ✅       | ❌     | ✅    |
| Lawyer Dashboard        | ❌       | ❌       | ✅     | ✅    |
| Admin Dashboard         | ❌       | ❌       | ❌     | ✅    |
| Case Overview           | ✅       | ✅       | ✅     | ✅    |
| Case Details            | ✅       | ✅       | ✅     | ✅    |
| Case Uploads            | ✅       | ✅       | ✅     | ✅    |
| User Management         | ❌       | ❌       | ❌     | ✅    |
| Role Management         | ❌       | ❌       | ❌     | ✅    |
| Profile Setup           | ✅       | ✅       | ✅     | ✅    |

## Developer Access

### Testing as Admin
To test with full access to all pages:

1. **Register as Admin**:
   - Navigate to `/register`
   - Select role: **Admin**
   - Complete registration

2. **Sign In**:
   - Use your admin credentials
   - Menu will show all pages enabled

3. **Verify Access**:
   - Open menu (hamburger icon top-left)
   - All pages should be white (not grayed)
   - No lock icons should appear
   - Click each page to verify access

### Using Dev Token for Testing
You can also use the dev authentication system:

```javascript
// In browser console:
localStorage.setItem('token', 'dev-fake-token');
localStorage.setItem('user', JSON.stringify({
  id: '862b3a3e-8390-57f8-a307-12004a341a2e',
  email: 'admin@test.com',
  role: 'admin',
  name: 'Admin User'
}));
// Refresh page
location.reload();
```

### Quick Admin User Creation
Run this in backend to ensure admin user exists:

```powershell
cd c:\mediation-app\backend
node -e "
import('./src/db.js').then(async ({ pool }) => {
  const userId = '862b3a3e-8390-57f8-a307-12004a341a2e';
  const result = await pool.query(
    'INSERT INTO app_users (user_id, email, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET role = $4 RETURNING *',
    [userId, 'admin@test.com', 'Admin User', 'admin']
  );
  console.log('Admin user created/updated:', result.rows[0]);
  process.exit(0);
});
"
```

## Menu Behavior

### Opening/Closing
- Click "Menu" button to toggle open/closed
- Click outside menu to close
- Press `Escape` key to close
- Automatically closes when navigating to a page

### Scrolling
- Menu supports scrolling if content exceeds viewport height
- Maximum height: 80vh (80% of viewport height)
- Smooth scroll with custom scrollbar styling

### Responsive Design
- Fixed position in top-left
- Always visible on all pages
- Maintains position during scroll
- Z-index 50 ensures it appears above content

## Implementation Details

### Component Location
`frontend/src/pages/HomePage.jsx` - `LeftDropdownMenu` component

### Key Props
- `user` - Current authenticated user object (from AuthContext)
- `navigate` - React Router navigation function

### State Management
- Uses local `useState` for open/closed state
- Uses `useRef` for click-outside detection
- Automatically closes on route change via `useEffect`

### Styling
- Tailwind CSS classes for responsive design
- Glass-morphism effect (backdrop blur, transparency)
- Smooth transitions and hover effects
- Consistent with app's navy blue color scheme

## Customization

### Adding New Menu Items
Edit `menuSections` array in `LeftDropdownMenu`:

```javascript
{
  title: 'New Section',
  items: [
    { 
      label: 'New Page', 
      path: '/new-page', 
      roles: ['admin'], 
      icon: '🆕' 
    }
  ]
}
```

### Changing Access Control
Modify the `roles` array for each menu item:
- `['admin']` - Admin only
- `['mediator','admin']` - Mediator and Admin
- `['divorcee','mediator','lawyer','admin']` - All authenticated users

### Icons
Use emoji icons or replace with icon library (lucide-react, react-icons, etc.)

## Testing Checklist

- [ ] Menu appears when not signed in (shows Sign In/Register only)
- [ ] Menu appears after signing in (shows role-specific items)
- [ ] Unauthorized pages are grayed out with lock icon
- [ ] Authorized pages are clickable and white
- [ ] Active page is highlighted
- [ ] Menu closes when clicking outside
- [ ] Menu closes when pressing Escape
- [ ] Menu closes when navigating to a page
- [ ] Admin can see all pages (no grayed items)
- [ ] Divorcee can only access divorcee pages
- [ ] Mediator can only access mediator pages
- [ ] Lawyer can only access lawyer pages
- [ ] Hover effects work on accessible items
- [ ] No hover effects on restricted items
- [ ] Current role displayed at bottom
- [ ] Email displayed at bottom (if available)

## Troubleshooting

### Menu Not Showing
- Check if `user` object is available from AuthContext
- Verify component is rendered in HomePage
- Check z-index conflicts with other elements

### All Items Grayed Out
- Verify user object has valid `role` property
- Check role spelling matches exactly (lowercase)
- Confirm user is authenticated (not null)

### Wrong Role Access
- Check user.role value in localStorage or AuthContext
- Verify role in database matches frontend
- Clear localStorage and re-authenticate

### Menu Not Closing
- Check click-outside event listener
- Verify ref is attached to menu container
- Check for event propagation issues

## Future Enhancements

- [ ] Keyboard navigation (arrow keys, tab)
- [ ] Search/filter menu items
- [ ] Collapsible sections
- [ ] Recent pages history
- [ ] Favorites/bookmarks
- [ ] Mobile hamburger icon (three lines)
- [ ] Breadcrumb integration
- [ ] Notification badges on menu items
- [ ] Quick actions in menu (create case, etc.)
