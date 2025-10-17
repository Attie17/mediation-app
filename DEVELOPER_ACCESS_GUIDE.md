# Developer Access Guide

## Quick Start (3 Options)

### Option 1: Automated Login Page (Recommended)
```powershell
# From c:\mediation-app directory
.\dev-login.ps1
```
This opens a nice UI where you can select your role and login automatically.

### Option 2: Direct Browser Console
1. Open http://localhost:5173
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Paste and press Enter:

```javascript
// Login as Admin (full access)
localStorage.setItem('token', 'dev-fake-token');
localStorage.setItem('user', JSON.stringify({
  id: '862b3a3e-8390-57f8-a307-12004a341a2e',
  email: 'admin@dev.local',
  name: 'Dev Admin',
  role: 'admin'
}));
localStorage.setItem('activeCaseId', '4');
localStorage.setItem('devMode', 'true');
location.reload();
```

### Option 3: Open dev-login.html directly
```powershell
# Just open the file in your browser
start .\dev-login.html
```

## Available Developer Roles

### 👨‍💼 Admin (Recommended for Development)
- **Full access** to all pages and features
- Can access all dashboards
- Can manage users and roles
- User ID: `862b3a3e-8390-57f8-a307-12004a341a2e`

### ⚖️ Mediator
- Access to mediator dashboard
- Can manage cases
- Can review documents
- User ID: `1a472c78-438c-4b3e-a14d-05ce39d5bfc2`

### 👤 Divorcee
- Access to divorcee dashboard
- Can upload documents
- Can chat with mediator
- User ID: `dev-divorcee-uuid`

### 👔 Lawyer
- Access to lawyer dashboard
- Can view client cases
- Can upload documents
- User ID: `dev-lawyer-uuid`

## What Gets Set in localStorage

When you use developer login, these values are stored:

| Key | Value | Purpose |
|-----|-------|---------|
| `token` | `'dev-fake-token'` | Bypasses authentication |
| `user` | JSON object with id, email, name, role | User identity |
| `activeCaseId` | `'4'` | Default case for testing |
| `devMode` | `'true'` | Indicates developer mode |
| `lastRoute` | `'/'` | Last visited route |

## Staying Signed In

Your developer credentials persist in localStorage until you:
- Clear browser cache/localStorage
- Use incognito/private browsing
- Explicitly log out

**To stay permanently signed in:** Just don't clear your browser data!

## Testing Different Roles

To switch roles without reopening the login page:

```javascript
// Switch to Mediator
localStorage.setItem('user', JSON.stringify({
  id: '1a472c78-438c-4b3e-a14d-05ce39d5bfc2',
  email: 'mediator@dev.local',
  name: 'Dev Mediator',
  role: 'mediator'
}));
location.reload();
```

## Checking Your Current Login

```javascript
// In browser console
console.log('Current User:', JSON.parse(localStorage.getItem('user')));
console.log('Token:', localStorage.getItem('token'));
console.log('Dev Mode:', localStorage.getItem('devMode'));
```

## Logout (Clear Developer Access)

```javascript
localStorage.clear();
location.reload();
```

Or just run:
```powershell
.\dev-login.ps1
# Then select a different role
```

## Navigation with Full Access

As an **Admin**, you can access:

### Dashboards
- `/` - Landing page with navigation
- `/admin` - Admin dashboard
- `/mediator` - Mediator dashboard
- `/divorcee` - Divorcee dashboard
- `/lawyer` - Lawyer dashboard

### Cases
- `/case/4` - Case overview with AI insights
- `/cases/4` - Case details
- `/cases/4/uploads` - Case uploads

### Admin
- `/admin/users` - User management
- `/admin/roles` - Role management

### Account
- `/profile` - Profile setup

## Backend Connectivity

The developer token works with your backend API because:
- Backend recognizes `dev-fake-token` as a valid development token
- Associated with real user IDs in the database
- Allows testing all API endpoints

## Troubleshooting

### Not Seeing Full Access?
1. Check localStorage has `role: 'admin'`
2. Verify `devMode` is set to `'true'`
3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Pages Show as Locked?
- Make sure you selected **Admin** role
- Clear localStorage and login again
- Check browser console for errors

### Lost Your Login?
- Just run `.\dev-login.ps1` again
- Or paste the browser console code again

## Production Note

⚠️ **Important:** The dev login system is for **local development only**. The `dev-fake-token` will not work in production environments.

---

**Quick Access:**
```powershell
# From project root
.\dev-login.ps1
```

Then select your role and you're good to go! 🚀
