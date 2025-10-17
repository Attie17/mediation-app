-- 20250928_fix_caseid_bigint.sql
-- Ensure case_id in case_participants is bigint, not uuid.

BEGIN;

-- 1. Drop dependent foreign key if it exists (adjust name if different).
ALTER TABLE case_participants DROP CONSTRAINT IF EXISTS case_participants_case_id_fkey;

-- 2. Alter the column type to bigint (using USING to cast existing values).
ALTER TABLE case_participants
  ALTER COLUMN case_id TYPE bigint
  USING case_id::bigint;

-- 3. Recreate the foreign key constraint to cases(id) if cases.id is bigint.
ALTER TABLE case_participants
  ADD CONSTRAINT case_participants_case_id_fkey
  FOREIGN KEY (case_id) REFERENCES cases(id)
  ON DELETE CASCADE;

COMMIT;
