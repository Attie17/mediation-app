-- DRAFT ONLY. Tested in a fictional in-memory database; not approved for deployment.
-- No membership is made active; no real participant data is read or changed here.
BEGIN;
ALTER TABLE public.case_participants ADD COLUMN IF NOT EXISTS status text;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.case_participants'::regclass
      AND conname = 'accord_participant_status_values'
  ) THEN
    ALTER TABLE public.case_participants
      ADD CONSTRAINT accord_participant_status_values
      CHECK (status IS NULL OR status IN ('invited', 'active', 'removed')) NOT VALID;
  END IF;
END $$;
COMMIT;
-- Existing NULL/unrecognised values must remain denied by application checks.
-- NOT VALID avoids silently rewriting or certifying historical rows.
-- A separate reviewed procedure is required before validating historical data.
-- Roll back application code if necessary; do not drop recorded membership status.
