# Quick Reference Card - Testing Tomorrow (17:00 SAST)

## 🚀 Quick Start

1. **Check servers are running:**
   ```bash
   # Backend should show: "Server running on port 4000"
   # Frontend should show: "Local: http://localhost:5173/"
   ```

2. **Open browser to:** http://localhost:5173/admin/organizations

3. **Login credentials:**
   - Email: `ceo@stabilistc.co.za`
   - Password: `Pass@2024`

---

## 📝 Test Checklist (30 minutes)

### ✅ Organization CRUD
- [ ] Create new organization (click "New Organization" button)
- [ ] View organization details (click "View Details")
- [ ] Edit organization (click "Edit" button in detail page)
- [ ] Verify changes saved

### ✅ Detail Page Tabs
- [ ] Users tab loads and displays table
- [ ] Cases tab loads and displays table  
- [ ] Billing tab shows subscription info

### ✅ Case Assignments
- [ ] Navigate to /admin/case-assignments
- [ ] View unassigned cases
- [ ] Assign a case to a mediator
- [ ] View mediator workload
- [ ] Unassign a case

---

## 🐛 Troubleshooting

### If modal doesn't open:
- Check browser console (F12)
- Verify no JavaScript errors

### If data doesn't load:
- Check Network tab in DevTools
- Look for failed API calls (red)
- Check backend terminal for errors

### If authentication fails:
```javascript
// Run in browser console:
localStorage.getItem('auth_token')
// Should return a JWT token, not null
```

### Emergency reset:
```javascript
// Clear everything and refresh
localStorage.clear();
location.reload();
```

---

## 📊 Test Data Template

**For creating test organization:**
```
Name: Cape Town Mediation
Display Name: Cape Town Family Mediation Services  
Email: info@ctmediation.co.za
Phone: +27 21 555 1234
Address: 123 Long Street, Cape Town, 8001
Website: https://www.ctmediation.co.za
Tier: Pro
```

---

## 🔍 Where to Look

### Files I Created:
- `frontend/src/components/admin/NewOrganizationModal.jsx`
- `frontend/src/components/admin/EditOrganizationModal.jsx`
- `OVERNIGHT_WORK_SUMMARY.md` (full testing guide)
- `test-org-apis.js` (automated API tests)

### Files I Modified:
- `frontend/src/routes/admin/OrganizationManagementPage.jsx`
- `frontend/src/routes/admin/OrganizationDetailPage.jsx`
- `backend/src/middleware/devAuth.js` (critical bug fix!)

---

## 📞 If You Need Help

1. Read OVERNIGHT_WORK_SUMMARY.md (comprehensive guide)
2. Check browser console for errors
3. Check backend terminal logs
4. Note the exact error message
5. Tell me what you see when you return

---

## ✨ What You Should See

**Organizations Page:**
- Clean list of organization cards
- Teal "New Organization" button top-right
- Each card shows: name, tier, status, stats

**Detail Page:**
- Header with org name and badges
- Edit and Delete buttons
- 4 tabs: Overview, Users, Cases, Billing
- Nice data tables with color-coded badges

**Modals:**
- Professional dark theme
- Smooth open/close animations
- Success messages in green
- Error messages in red

---

## 🎯 Success Criteria

By end of testing, you should be able to:
- ✅ Create a new organization
- ✅ Edit organization details
- ✅ View users in organization
- ✅ View cases in organization
- ✅ See subscription/billing info
- ✅ Assign cases to mediators

---

**Ready to test at 17:00!** 🚀

*Last updated: October 26, 2025*
