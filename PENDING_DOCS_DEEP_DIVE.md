# DEEP DIVE ANALYSIS: "Unable to load documents" Error
## Comprehensive Investigation Report

---

## 🎯 PROBLEM STATEMENT

**Symptom:** Frontend "Pending Documents Across All Cases" section shows red error icon with "Unable to load documents"

**Expected:** Should show "All Clear! No pending documents across your cases" (green checkmark)

**User:** Donald Trump (attie@ngwaverley.co.za)
**User ID:** `44d32632-d369-5263-9111-334e03253f94`
**Role:** mediator

---

## 🔍 INVESTIGATION TIMELINE

### Discovery 1: Backend Error in Logs
```
Error fetching mediator pending uploads: error: operator does not exist: bigint = uuid
```

**Root Cause Identified:** Type mismatch in database JOIN
- `uploads.user_id` column type: **bigint**
- `app_users.user_id` column type: **uuid**
- PostgreSQL cannot compare these types directly

---

## 📊 DATABASE ARCHITECTURE ANALYSIS

### Table: `uploads`
```sql
CREATE TABLE uploads (
  id SERIAL PRIMARY KEY,           -- Auto-increment integer
  user_id BIGINT,                  -- ❌ PROBLEM: Should be UUID
  case_id UUID,
  doc_type VARCHAR,
  original_filename VARCHAR,
  storage_path VARCHAR,
  status VARCHAR DEFAULT 'pending',
  uploaded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `app_users`
```sql
CREATE TABLE app_users (
  user_id UUID PRIMARY KEY,        -- ✅ Correct type
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  role VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `cases`
```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY,
  mediator_id UUID,                -- References app_users.user_id
  status VARCHAR,
  description VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 API ENDPOINT ANALYSIS

### Endpoint: `GET /api/uploads/mediator/:userId/pending`

**Location:** `backend/src/routes/uploads.js` lines 250-295

**Request Flow:**
1. Frontend calls: `/api/uploads/mediator/44d32632-d369-5263-9111-334e03253f94/pending`
2. Backend authenticates with JWT token
3. Verifies `req.user.id === userId`
4. Queries cases table for mediator's cases
5. Queries uploads table for pending uploads in those cases
6. FAILS at JOIN with app_users

**Current Code (PROBLEMATIC):**
```javascript
router.get('/mediator/:userId/pending', async (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.user?.id;

  // Verify requesting user is the mediator
  if (requestingUserId !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // Get all cases where this user is a mediator
    const casesResult = await pool.query(
      `SELECT id as case_id
       FROM cases
       WHERE mediator_id = $1`,
      [userId]
    );

    if (casesResult.rows.length === 0) {
      return res.json({ uploads: [] });
    }

    const caseIds = casesResult.rows.map(row => row.case_id);

    // ❌ THIS QUERY FAILS
    const uploadsResult = await pool.query(
      `SELECT u.id, u.case_id, u.user_id, u.doc_type, u.original_filename, 
              u.storage_path, u.status, u.uploaded_at, u.created_at,
              au.email as uploader_email, au.name as uploader_name
       FROM uploads u
       LEFT JOIN app_users au ON u.user_id::text = au.user_id::text
       WHERE u.case_id = ANY($1::uuid[])
         AND u.status = 'pending'
       ORDER BY u.uploaded_at DESC
       LIMIT 50`,
      [caseIds]
    );

    return res.json({ uploads: uploadsResult.rows });
  } catch (error) {
    console.error('Error fetching mediator pending uploads:', error);
    return res.status(500).json({ error: 'Failed to fetch pending uploads' });
  }
});
```

---

## 🐛 ATTEMPTED FIX #1: Type Casting

**Change Made:**
```javascript
// OLD (line 282):
LEFT JOIN app_users au ON u.user_id = au.user_id

// NEW (line 282):
LEFT JOIN app_users au ON u.user_id::text = au.user_id::text
```

**Result:** ❌ STILL FAILING

**Why it should work:**
- Casting both sides to `text` makes them comparable
- PostgreSQL accepts `::text` cast syntax

**Why it might still fail:**
- Cast may not be applied correctly in some PostgreSQL versions
- There might be NULL values causing issues
- The error might be coming from a different part of the query

---

## 🔬 ADDITIONAL INVESTIGATION NEEDED

### Hypothesis 1: The error is from position 307
```
Error: operator does not exist: bigint = uuid
  position: '307'
```

Position 307 suggests the error is NOT in the LEFT JOIN (which would be earlier in the query). Let me count characters:

```sql
SELECT u.id, u.case_id, u.user_id, u.doc_type, u.original_filename, 
       u.storage_path, u.status, u.uploaded_at, u.created_at,
       au.email as uploader_email, au.name as uploader_name
FROM uploads u
LEFT JOIN app_users au ON u.user_id::text = au.user_id::text
WHERE u.case_id = ANY($1::uuid[])
  AND u.status = 'pending'
ORDER BY u.uploaded_at DESC
LIMIT 50
```

Character position 307 would be around the `WHERE` clause or `ORDER BY` clause.

### Hypothesis 2: The error might be in a different endpoint

Let me check if there's another uploads endpoint being called...

Looking at terminal logs, I see:
```
[0] 📂 APP DEBUG: GET /api/uploads/list?status=pending
```

This is a DIFFERENT endpoint! The dashboard might be calling `/api/uploads/list` instead of `/api/uploads/mediator/:userId/pending`

---

## 🔍 CHECKING OTHER ENDPOINTS

### Let me search for `/api/uploads/list` endpoint...

If this endpoint ALSO has a JOIN with app_users, it would have the same type mismatch issue.

---

## 💡 COMPREHENSIVE SOLUTION PLAN

### Option A: Fix ALL upload endpoints with proper casts
Find every query in `uploads.js` that joins with `app_users` and add `::text` casts

### Option B: Fix the database schema (RECOMMENDED)
Change `uploads.user_id` from `bigint` to `uuid` to match `app_users.user_id`

**Migration SQL:**
```sql
-- 1. Add new column with correct type
ALTER TABLE uploads ADD COLUMN user_id_uuid UUID;

-- 2. Copy data (if any exists - likely none since this is new)
UPDATE uploads SET user_id_uuid = user_id::text::uuid WHERE user_id IS NOT NULL;

-- 3. Drop old column
ALTER TABLE uploads DROP COLUMN user_id;

-- 4. Rename new column
ALTER TABLE uploads RENAME COLUMN user_id_uuid TO user_id;

-- 5. Add foreign key constraint
ALTER TABLE uploads 
  ADD CONSTRAINT fk_uploads_user 
  FOREIGN KEY (user_id) 
  REFERENCES app_users(user_id);
```

### Option C: Identify the ACTUAL failing endpoint
Use backend logs to see which exact endpoint is throwing the error, then fix that specific query.

---

## 📝 NEXT STEPS

1. **Check which endpoint is actually being called** by the Pending Documents component
2. **Search for ALL queries** that join uploads with app_users
3. **Apply type casts** to all of them, OR
4. **Fix the schema** permanently with a migration

---

## 🎯 IMMEDIATE ACTION REQUIRED

Let me search for ALL occurrences of JOIN with app_users in the uploads.js file...
