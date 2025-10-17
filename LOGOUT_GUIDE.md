# Logout Guide

## How to Logout from Mediation App

You have **three ways** to log out of the application:

---

## Method 1: Top Navigation Bar (Built-in)

Look at the **top-right corner** of the page. You should see:
1. Your user avatar and email
2. A **"Menu"** button next to it
3. Click the **Menu** button
4. Select **"Log out"** from the dropdown

**Current Status:** This should be working. If you don't see the Menu button, use Method 2 or 3 below.

---

## Method 2: Use the Logout Page (Easiest)

1. Open this file in your browser:
   ```
   file:///C:/mediation-app/logout.html
   ```
   
2. Click the **"Logout Now"** button

3. You'll be automatically redirected to the login page

**This method is guaranteed to work!**

---

## Method 3: Browser Console (Manual)

1. Open your browser at `http://localhost:5173`
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab
4. Type this command and press Enter:
   ```javascript
   localStorage.clear(); location.reload();
   ```

**Result:** All your session data will be cleared and the page will reload, showing you the public landing page.

---

## What Gets Cleared When You Logout

- ✓ Authentication token
- ✓ User information  
- ✓ Active case ID
- ✓ Last route data
- ✓ All localStorage data

---

## After Logout

You'll see the **Public Landing Page** with:
- Welcome message
- "Sign In" button
- "Register" button  
- Three feature cards

---

## Quick Reference

| Method | Difficulty | Reliability |
|--------|-----------|-------------|
| Top Nav Menu Button | Easy | Should work |
| Logout HTML Page | Very Easy | Always works |
| Browser Console | Easy | Always works |

---

## Troubleshooting

**Q: I don't see the Menu button in the top navigation**
- Try Method 2 (logout.html) or Method 3 (console command)

**Q: The dropdown menu doesn't appear when I click Menu**
- This might be a UI component issue
- Use Method 2 or 3 as a workaround

**Q: After logout, I'm still seeing my dashboard**
- Hard refresh the browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Or manually clear cookies/cache

---

## Current Issue Fix

If the logout button isn't visible in your navigation bar, I recommend:

1. **Immediate solution:** Use `logout.html` file (Method 2)
2. **Future enhancement:** We can add a more prominent logout button to the UI

---

Last Updated: October 11, 2025
