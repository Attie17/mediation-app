# Logout and Test Registration

## Quick Logout Script

Open the browser console (F12) and run this:

```javascript
// Clear all auth data
localStorage.clear();
sessionStorage.clear();

// Reload the page
window.location.href = '/register';
```

Or use this one-liner:
```javascript
localStorage.clear(); window.location.href = '/register';
```

## Step-by-Step Test Instructions

### 1. Logout First
- Press **F12** to open Developer Tools
- Go to **Console** tab
- Paste: `localStorage.clear(); window.location.href = '/register';`
- Press **Enter**

This will:
- Clear your authentication token
- Clear all stored user data
- Redirect you to the registration page

### 2. Register New Account

**Test User 1: Divorcee**
- Full Name: `Test Divorcee`
- Email: `test.divorcee@example.com`
- Role: `Divorcee`
- Password: `testpass123`
- Confirm Password: `testpass123`

Click **Register** → Should redirect to `/setup?role=divorcee`

### 3. Complete Role Setup

The form should show these fields for Divorcee:
- Date of Birth
- Residential Address
- Spouse's Name (optional)
- Case Reference (optional)
- Preferred Language
- Children Involved (optional)

Fill them out and click **Save & Continue**

### 4. Verify Dashboard

Should redirect to `/dashboard` and show:
- Your name
- Divorcee-specific dashboard content

---

## Alternative: Direct URL Testing

If you want to test the role setup form directly:

1. **Logout:** Run `localStorage.clear()` in console
2. **Navigate to:** http://localhost:5174/setup?role=divorcee

But this will fail with "Unauthorized" because the route requires authentication.

So the proper flow is:
1. Logout
2. Register
3. Auto-redirect to setup
4. Complete profile
5. Auto-redirect to dashboard

---

## Check Current Login Status

Run this in the console to see if you're logged in:

```javascript
console.log('Token:', localStorage.getItem('auth_token'));
console.log('User:', localStorage.getItem('user'));
```

If you see a token, you're logged in.

---

## Quick Navigation Links

Once logged out, you can navigate to:
- Registration: http://localhost:5174/register
- Sign In: http://localhost:5174/signin
- Home: http://localhost:5174/

---

## Expected Flow Diagram

```
[Logout] 
   ↓
[Register Page] ← http://localhost:5174/register
   ↓ (fill form + submit)
[Role Setup] ← http://localhost:5174/setup?role=divorcee
   ↓ (fill form + submit)
[Dashboard] ← http://localhost:5174/dashboard
```

---

## Testing Checklist

- [ ] Logout clears token
- [ ] Registration page shows with blue background
- [ ] Registration form submits successfully
- [ ] Redirects to /setup with correct role parameter
- [ ] Role setup form shows role-specific fields
- [ ] Profile save shows loading state
- [ ] Profile save succeeds without errors
- [ ] Redirects to dashboard
- [ ] Dashboard shows user data
- [ ] No console errors throughout flow

---

## Troubleshooting

### Issue: Still seeing "Good morning, Attie"
**Solution:** You're still logged in. Run `localStorage.clear()` in console.

### Issue: White screen on /setup
**Solution:** The route exists now (fixed). Make sure you're coming from registration with a valid token.

### Issue: "Unauthorized" error on /setup
**Solution:** The /setup route requires authentication. You must register first to get a token.

### Issue: Registration redirects to dashboard instead of setup
**Solution:** Check that RegisterForm.jsx is redirecting to `/setup` (just fixed this).

---

## Backend Logs to Watch

Keep the backend terminal visible and watch for:

```
[auth:register] enter
[auth:register] upserted test_users
[auth:register] ok
[users:profile:post] ENTER
[users:profile:post] executing SQL
[users:profile:post] OK
[users:me:get] ENTER
[users:me:get] OK
```

If you see these logs, everything is working! 🎉
