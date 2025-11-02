# 🎯 QUICK FIX GUIDE - Quick Action Cards

## THE PROBLEM
The 4 colored Quick Action buttons show this alert:
```
No active case selected.
```

## THE CAUSE
Your browser's localStorage is missing an `activeCaseId`.

## THE SOLUTION (Pick One)

### ⚡ FASTEST (30 seconds)
1. Open this in your browser:
   ```
   file:///c:/mediation-app/set-active-case.html
   ```
2. It auto-sets your first case
3. Click OK to go to homepage
4. ✅ Buttons now work!

### 🖥️ BROWSER CONSOLE (1 minute)
1. Go to: http://localhost:5173
2. Press `F12` (open console)
3. Paste this:
```javascript
fetch('http://localhost:4000/api/cases/user/44d32632-d369-5263-9111-334e03253f94', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
})
.then(r => r.json())
.then(cases => {
  localStorage.setItem('activeCaseId', cases[0].case_id);
  console.log('✅ Active case set:', cases[0].description);
  location.reload();
});
```
4. Press Enter
5. ✅ Buttons now work!

### 💻 POWERSHELL (Interactive)
```powershell
.\fix-quick-actions.ps1
```
Follow the prompts.

## VERIFY IT WORKS
After setting active case, test the buttons:
- 📋 **My Cases** → Case detail page
- 📄 **Documents** → Uploads page  
- 💬 **Messages** → Case messages
- 👥 **Contacts** → Your profile

## WHY THIS HAPPENED
The app doesn't auto-select a case when you login. This is a UX gap we can fix later by:
- Auto-setting the first case on login
- Adding a case selector dropdown
- Remembering last selected case

## FILES CREATED TO HELP YOU
1. `set-active-case.html` - Visual case selector (easiest!)
2. `diagnose-quick-actions.js` - Diagnostic tool
3. `fix-quick-actions.ps1` - PowerShell helper
4. `QUICK_ACTION_CARDS_INVESTIGATION.md` - Full technical report

---

**Bottom line:** Use `set-active-case.html` → Problem solved in 30 seconds! ✅
