# 🔧 Make ds.attie.nel@gmail.com the Primary Admin

## Option 1: Via Supabase Dashboard (Easiest - 30 seconds)

1. Go to: https://supabase.com/dashboard/project/kjmwaoainmyzbmvalizu/editor
2. Click **SQL Editor** in left sidebar
3. Click **"New Query"**
4. Paste this SQL:

```sql
UPDATE app_users 
SET role = 'admin' 
WHERE email = 'ds.attie.nel@gmail.com';
```

5. Click **Run** or press `Ctrl+Enter`
6. You should see: "Success. 1 rows affected."

---

## Option 2: Via PostgreSQL Command Line

```bash
psql "postgresql://postgres.kjmwaoainmyzbmvalizu:d8ScTSlTB6e5jmvS@aws-1-eu-west-2.pooler.supabase.com:6543/postgres" -c "UPDATE app_users SET role = 'admin' WHERE email = 'ds.attie.nel@gmail.com';"
```

---

## After Promotion

**Login Credentials:**
- Email: `ds.attie.nel@gmail.com`
- Password: `Admin123!`
- Role: `admin`

**Login at**: https://www.divorcesmediator.com

---

## ✅ What Was Changed

1. **Validation Updated**: Admin registration now blocked with message directing users to contact you
2. **Your Account Created**: ds.attie.nel@gmail.com exists in database
3. **Ready to Promote**: Just needs SQL update to change role from 'divorcee' to 'admin'

---

## 🔐 Admin Privileges

Once promoted, you'll have access to:
- User management (view all users, change roles)
- Case assignments
- Organization management
- System health monitoring
- Invite new users
- Approve/reject documents for all cases

---

## 👥 Adding More Admins Later

To add more admins (after you're promoted):
1. They register normally (as divorcee/mediator/lawyer)
2. You login as admin
3. Go to User Management
4. Find their account
5. Click "Change Role" → Select "Admin"

Or run SQL:
```sql
UPDATE app_users SET role = 'admin' WHERE email = 'their-email@example.com';
```
