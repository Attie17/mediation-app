# Quick Testing Guide - Dashboard Backend Connection

## ✅ What Was Implemented

All role-based dashboards now fetch and display **real data** from the backend:
- **Mediator Dashboard**: Shows assigned cases, pending uploads, today's sessions
- **Lawyer Dashboard**: Shows client cases, pending documents
- **Admin Dashboard**: Shows system-wide KPIs (users, cases, resolved count)
- **Divorcee Dashboard**: Shows case status, uploaded documents

---

## 🧪 Quick Test Steps

### Prerequisites
1. **Backend running**: `cd backend && node src/index.js` (Port 4000)
2. **Frontend running**: `cd frontend && npm run dev` (Port 5173)

### Test Mediator Dashboard

1. **Login as Mediator**:
   ```
   Email: ds.attie.nel@gmail.com
   (or your mediator test account)
   ```

2. **Navigate to**: `http://localhost:5173/#/mediator`

3. **Verify**:
   - ✅ Stats cards show numbers (not "0" or "...")
   - ✅ "Action Required" panel shows pending uploads (if any)
   - ✅ "Your Cases" section shows real case titles
   - ✅ No console errors
   - ✅ Loading states work

4. **Expected Data**:
   - Active Cases: Should show count from database
   - Pending Reviews: Should show actual pending upload count
   - If no data: Empty states should display

---

### Test Lawyer Dashboard

1. **Login as Lawyer**:
   ```
   Email: (your lawyer test account)
   ```

2. **Navigate to**: `http://localhost:5173/#/lawyer`

3. **Verify**:
   - ✅ Stats cards display (Client Cases, Pending Docs, etc.)
   - ✅ Dashboard loads without errors
   - ✅ Numbers match database records

---

### Test Admin Dashboard

1. **Login as Admin**:
   ```
   Email: (your admin test account)
   ```

2. **Navigate to**: `http://localhost:5173/#/admin`

3. **Verify**:
   - ✅ Total Users count
   - ✅ Active Cases count
   - ✅ Resolved Cases count
   - ✅ System stats display correctly

---

### Test Divorcee Dashboard

1. **Login as Divorcee**:
   ```
   Email: (your divorcee test account)
   ```

2. **Navigate to**: `http://localhost:5173/#/dashboard` (or `/divorcee`)

3. **Verify**:
   - ✅ Stats display (case status, docs uploaded, etc.)
   - ✅ Cases list shows real cases with titles
   - ✅ "Create New Case" button works
   - ✅ Can click on cases to view details

---

## 🔍 What to Look For

### Success Indicators ✅
- Numbers in stat cards (not "0" or "...")
- Case titles display (not just "Case #123")
- Upload lists populated (if uploads exist)
- No "Failed to load stats" errors
- Browser console shows successful API calls

### Common Issues to Check ⚠️
1. **"Missing or invalid token"**:
   - Make sure you're logged in
   - Token should be in localStorage
   - Check browser console for auth errors

2. **All stats show "0"**:
   - Database might be empty
   - Create test case first (use "Create New Case" button)
   - Upload some documents

3. **"Unable to connect to server"**:
   - Verify backend is running on port 4000
   - Check `http://localhost:4000/api/health` works

4. **Endless "Loading..."**:
   - Check browser console for errors
   - Verify API endpoints respond
   - Check network tab for failed requests

---

## 🛠️ Troubleshooting

### Check Backend is Running
```powershell
# Should see "Server running on port 4000"
Invoke-WebRequest -Uri "http://localhost:4000/api/health" -UseBasicParsing
```

### Check Token Exists
1. Open browser DevTools (F12)
2. Console tab
3. Type: `localStorage.getItem('token')`
4. Should return a JWT token string

### Check API Response
```powershell
# Replace TOKEN with your actual token from localStorage
$token = "your-token-here"
$headers = @{ "Authorization" = "Bearer $token" }

Invoke-WebRequest -Uri "http://localhost:4000/dashboard/stats/mediator/YOUR-USER-ID" -Headers $headers -UseBasicParsing
```

### View Network Requests
1. Open DevTools (F12)
2. Network tab
3. Refresh dashboard
4. Look for requests to `/dashboard/stats/...`
5. Check status codes (should be 200)
6. Click request to see response data

---

## 📊 Expected API Responses

### Mediator Stats
```json
{
  "ok": true,
  "stats": {
    "activeCases": 3,
    "pendingReviews": 5,
    "todaySessions": 2,
    "resolvedThisMonth": 8
  }
}
```

### Lawyer Stats
```json
{
  "ok": true,
  "stats": {
    "clientCases": 4,
    "pendingDocuments": 12,
    "upcomingSessions": 3,
    "completedThisMonth": 2
  }
}
```

### Admin Stats
```json
{
  "ok": true,
  "stats": {
    "totalUsers": 45,
    "activeCases": 23,
    "resolvedCases": 67,
    "pendingInvites": 5
  }
}
```

---

## ✅ Quick Validation Checklist

- [ ] Backend server running (port 4000)
- [ ] Frontend server running (port 5173)
- [ ] Can login successfully
- [ ] Token exists in localStorage
- [ ] Mediator dashboard shows stats
- [ ] Lawyer dashboard shows stats
- [ ] Admin dashboard shows stats
- [ ] Divorcee dashboard shows cases
- [ ] No console errors
- [ ] API requests return 200 status

---

## 🎉 Success Criteria

If you see:
1. ✅ Stats display actual numbers (not just zeros)
2. ✅ Cases show real titles (not placeholders)
3. ✅ Pending uploads visible in Action Required
4. ✅ No error messages on page
5. ✅ No console errors

**Then the implementation is working correctly!** 🚀

---

## 📝 Notes

- First time testing might show zeros if database is empty
- Create at least one case and upload documents to see data
- Stats update on page refresh (not real-time yet)
- Empty states are intentional when no data exists

---

**Last Updated**: October 19, 2025  
**Status**: Ready for Testing
