# 🚀 FASTEST WAY TO TEST DIVORCEE - Browser Console Method

**Why this is needed:** Test users don't have passwords in Supabase Auth  
**Solution:** Use browser console (30 seconds)  
**Works:** ✅ 100% reliable

---

## 🎯 DO THIS NOW

### 1. Open App
Go to: `http://localhost:5173`

### 2. Open Console
Press **F12** → Click **Console** tab

### 3. Copy & Paste This:

```javascript
localStorage.clear();
localStorage.setItem('auth_token','dev-fake-token');
localStorage.setItem('user',JSON.stringify({id:'22222222-2222-2222-2222-222222222222',user_id:'22222222-2222-2222-2222-222222222222',email:'bob@example.com',name:'Bob Divorcee',role:'divorcee'}));
localStorage.setItem('activeCaseId','3bcb2937-0e55-451a-a9fd-659187af84d4');
location.reload();
```

### 4. Press Enter
Page reloads → You're logged in as divorcee! ✅

---

## ✅ Expected Result

- **URL:** `http://localhost:5173/divorcee`
- **Welcome:** "Welcome back, Bob Divorcee!"
- **Dashboard:** Shows documents, progress, chat

---

## 🔄 Switch Users Anytime

**Test with 2 cases:**
```javascript
localStorage.clear();localStorage.setItem('auth_token','dev-fake-token');localStorage.setItem('user',JSON.stringify({id:'33333333-3333-4333-8333-333333333333',user_id:'33333333-3333-4333-8333-333333333333',email:'dashboard.divorcee@example.com',name:'Dashboard Divorcee',role:'divorcee'}));location.reload();
```

**Test with no cases (empty state):**
```javascript
localStorage.clear();localStorage.setItem('auth_token','dev-fake-token');localStorage.setItem('user',JSON.stringify({id:'2055190c-de7e-5134-9a95-04d9b9585d39',user_id:'2055190c-de7e-5134-9a95-04d9b9585d39',email:'test-divorcee@example.com',name:'Test Divorcee',role:'divorcee'}));location.reload();
```

---

**THIS IS THE EASIEST WAY!** No passwords, no sign-in forms, just works! 🎉

