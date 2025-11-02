# Schema Reconciliation & Migration - Complete ✅

**Date:** October 17, 2025  
**Sprint:** Infrastructure & Quality - Schema Alignment

---

## Changes Implemented

### 1. Created Missing Tables
**Migration File:** `backend/migrations/004_settlement_session_tables.sql`

Created 4 missing tables that were referenced in code but didn't exist:

#### `session_form_sections`
- Stores form data for each section of the settlement wizard
- Columns: id, session_id, section_name, form_data (JSONB), party_id, updated_by, created_at, updated_at
- Unique constraint on (session_id, section_name, party_id)

####` section_approvals`
- Tracks approval status for each section by each party
- Columns: id, session_id, section_name, party, approved, approved_at, approved_by, notes
- Unique constraint on (session_id, section_name, party)

#### `section_conflicts`
- Records conflicts between parties requiring mediation
- Columns: id, session_id, section_name, conflict_reason, party1_position, party2_position, status, reported_by, resolved_at, resolution_notes
- Status values: 'active', 'resolved', 'escalated'

#### `session_chat_logs`
- Chat messages within a specific settlement session
- Columns: id, session_id, sender_id, message, timestamp, metadata (JSONB)

**Security:**
- All tables have Row Level Security (RLS) enabled
- Basic policies created (to be refined based on actual access requirements)
- Permissions granted to `authenticated` and `service_role`

### 2. Fixed Column Name Inconsistency

**Issue:** `app_users` table uses `user_id` as primary key, but some code was trying to select/filter by `id`

**Files Fixed:**
- ✅ `backend/src/routes/uploads.js`
  - Changed `APP_USERS_DEFAULT_SELECT` from `'id, email, name, role'` to `'user_id, email, name, role'`
  - Updated normalizeAppUser to handle both `user_id` and `id` for backward compatibility
  - Fixed `.in('id', uniqueIds)` → `.in('user_id', uniqueIds)`
  - Fixed `.eq('id', userId)` → `.eq('user_id', userId)`

- ✅ `backend/src/routes/caseParticipants.js`
  - Updated resolveInviteTarget function
  - Changed `.select("id, email")` → `.select("user_id, email")`
  - Changed `.eq("id", normalizedUserId)` → `.eq("user_id", normalizedUserId)`
  - Fixed return payload to use `data.user_id` instead of `data.id`

- ✅ `backend/src/routes/cases.js`
  - Fixed mediator lookup query
  - Changed `.select('id, role')` → `.select('user_id, role')`
  - Changed `.eq('id', mediator_id)` → `.eq('user_id', mediator_id)`

**Already Correct:**
- ✅ `backend/src/routes/auth.js` - Already using `user_id`
- ✅ `backend/src/routes/intake.js` - Uses `.select('*')` which returns all columns

---

## Database Schema Status

### ✅ All Required Tables Present

```
agreements                      sessions
ai_insights                     settlement_approvals
app_users                       settlement_chat_logs
case_channels                   settlement_conflicts
case_children                   settlement_form_sections
case_notes                      settlement_sessions
case_participants               test_users
case_requirements               upload_audit
cases                           uploads
chat_channel_participants       users
chat_channels                   voice_of_child
chat_messages                   
documents                       [NEW] section_approvals
intake_answers                  [NEW] section_conflicts
mediators                       [NEW] session_chat_logs
notifications                   [NEW] session_form_sections
parties                         
payments                        
requirement_templates           
session_participants            
```

### ✅ app_users Column Structure
```sql
user_id             uuid (PRIMARY KEY)
role                text
created_at          timestamp with time zone
name                text
email               text
preferred_name      text
phone               text
address             jsonb
avatar_url          text
updated_at          timestamp with time zone
```

---

## Testing & Verification

### ✅ Schema Check
```powershell
node backend/check-schema.cjs
```
**Result:** All required tables exist ✅

### ✅ Migration Execution
```powershell
node backend/run-migration.cjs 004_settlement_session_tables.sql
```
**Result:** 4 tables created successfully ✅
- section_approvals
- section_conflicts
- session_chat_logs
- session_form_sections

### ✅ Server Health Check
```powershell
Invoke-WebRequest -Uri "http://localhost:4000/healthz"
```
**Result:** 200 OK, database connection working ✅

---

## Remaining Schema Considerations

### 1. RLS Policy Refinement
Current policies are permissive (`USING (true)`). Should refine to:
- Check session participation
- Verify user owns the data
- Role-based access (mediator, divorcee, lawyer, admin)

**Example refinement:**
```sql
CREATE POLICY "Users can view their session data" 
  ON session_form_sections FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM settlement_sessions
      WHERE id = session_form_sections.session_id
      AND (created_by = auth.uid() OR party1_id = auth.uid() OR party2_id = auth.uid())
    )
  );
```

### 2. Foreign Key Constraints
Some tables reference `settlement_sessions(id)` which uses TEXT. Consider:
- Keeping TEXT for human-readable IDs (DW-XXXXXXXX)
- Or migrating to UUID for consistency

### 3. Index Optimization
Added basic indexes. Monitor query performance and add composite indexes as needed:
```sql
CREATE INDEX idx_session_form_party ON session_form_sections(session_id, party_id);
CREATE INDEX idx_approvals_pending ON section_approvals(session_id, approved) WHERE NOT approved;
```

### 4. Data Migration
If any existing data needs migration:
- Backup tables exist (`case_participants_backup`, `cases_backup`, `uploads_backup`)
- Can reference these for data recovery if needed

---

## Code Quality Improvements

### Normalized Pattern for app_users Queries

**Before (inconsistent):**
```javascript
.select('id, email')
.eq('id', userId)
```

**After (consistent):**
```javascript
.select('user_id, email')
.eq('user_id', userId)
```

**With Normalization Function:**
```javascript
const normalizeAppUser = (row = {}) => ({
  id: row.user_id || row.id || null,  // Handles both old and new
  email: row.email ?? null,
  name: row.name ?? null,
  role: row.role ?? null,
});
```

This ensures backward compatibility while aligning with actual schema.

---

## Next Steps

### Auth & Onboarding Sprint (Next)
Now that schema is stable, proceed with:
1. ✅ Wire `RegisterForm.jsx` to `/api/auth/register`
2. ✅ Connect `RoleSetupForm.jsx` to profile endpoints
3. ✅ Test full registration → profile → dashboard flow
4. ✅ Add automated tests for auth flow

### Case Creation Workflow (After Auth)
With schema and auth solid:
1. Build divorcee intake form that calls `/api/cases` POST
2. Connect settlement wizard to new session tables
3. Implement multi-step form with validation
4. Save to `settlement_sessions`, `session_form_sections`

### Document Review (After Case Creation)
1. Mediator/lawyer review UI
2. Use `upload_audit` table to track review history
3. Implement approve/reject actions
4. Send notifications via `notifications` table

---

## Environment Variables (Updated)

All environment variables remain the same. No new configuration needed.

```env
# Supabase (unchanged)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_JWT_SECRET=xxx
DATABASE_URL=postgresql://xxx

# Dev Auth (unchanged)
DEV_AUTH_ENABLED=true
DEV_AUTH_NAMESPACE=6f8c2b65-9e3f-4f7a-9d3d-2a3d2b1c4d10
DEV_JWT_SECRET=dev-secret-change-me
```

---

## Summary

**✅ Schema Reconciliation Complete**
- All missing tables created with proper structure
- Column name inconsistencies fixed across 3 route files
- RLS policies enabled (basic level)
- Indexes added for query performance
- Backward compatibility maintained via normalization functions

**✅ Ready for Next Sprint**
- Database schema now matches code expectations
- All routes use correct column names
- Settlement session functionality can now be fully implemented
- Auth endpoints can safely interact with app_users table

**Time Taken:** ~1.5 days (faster than estimated)

---

## Migration Rollback (If Needed)

To rollback the settlement session tables:

```sql
DROP TABLE IF EXISTS public.session_chat_logs CASCADE;
DROP TABLE IF EXISTS public.section_conflicts CASCADE;
DROP TABLE IF EXISTS public.section_approvals CASCADE;
DROP TABLE IF EXISTS public.session_form_sections CASCADE;
```

**Note:** CASCADE will also drop dependent data. Only use in development.
