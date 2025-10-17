-- Case Overview Slice Up Migration (2025-10-05)
-- Creates/adjusts tables: case_events, case_status_history
-- Creates view: case_activity_v (union uploads/messages/notifications/status changes)
-- Idempotent patterns used where possible.

BEGIN;

-- 1. Ensure cases table has desired columns (short_id, title, status enum constraint) -----------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='short_id'
  ) THEN
    ALTER TABLE cases ADD COLUMN short_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='title'
  ) THEN
    ALTER TABLE cases ADD COLUMN title text;
  END IF;
  -- Add status if missing; prefer existing if already there
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='status'
  ) THEN
    ALTER TABLE cases ADD COLUMN status text;
  END IF;
END $$;

-- Constrain status to allowed values (collecting_docs, ready_for_review, scheduled, closed)
-- Add constraint only if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.table_name='cases' AND tc.constraint_name='cases_status_check'
  ) THEN
    ALTER TABLE cases
      ADD CONSTRAINT cases_status_check CHECK (status IN ('collecting_docs','ready_for_review','scheduled','closed'));
  END IF;
END $$;

-- 2. case_participants: ensure extended columns (display_name, last_activity_at) & role set -------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='case_participants' AND column_name='display_name'
  ) THEN
    ALTER TABLE case_participants ADD COLUMN display_name text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='case_participants' AND column_name='last_activity_at'
  ) THEN
    ALTER TABLE case_participants ADD COLUMN last_activity_at timestamptz;
  END IF;
END $$;

-- Extend role constraint to include lawyer, admin if not already restricted (drop & recreate check)
DO $$
DECLARE v_exists int;
BEGIN
  SELECT COUNT(*) INTO v_exists FROM information_schema.table_constraints WHERE table_name='case_participants' AND constraint_name='case_participants_role_check';
  IF v_exists > 0 THEN
    ALTER TABLE case_participants DROP CONSTRAINT case_participants_role_check;
  END IF;
  ALTER TABLE case_participants ADD CONSTRAINT case_participants_role_check CHECK (role IN ('mediator','divorcee','lawyer','admin'));
END $$;

-- 3. case_events table -------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id integer NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location text,
  type text NOT NULL CHECK (type IN ('mediation','deadline','review')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_case_events_case_id_starts_at ON case_events(case_id, starts_at);

-- 4. case_status_history table -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id integer NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_case_status_history_case_id_created_at ON case_status_history(case_id, created_at);

-- 5. Activity View -----------------------------------------------------------------------------------
-- Drop then recreate to ensure latest definition
DROP VIEW IF EXISTS case_activity_v;
CREATE VIEW case_activity_v AS
  SELECT u.case_id,
         'upload'::text AS event_type,
         u.id AS ref_id,
         coalesce(cp.display_name, 'User') AS actor_name,
         concat('Uploaded ', u.doc_type) AS summary,
         u.created_at
    FROM uploads u
    LEFT JOIN case_participants cp ON cp.case_id = u.case_id AND cp.user_id = u.user_id
   WHERE u.case_id IS NOT NULL
  UNION ALL
  SELECT m.case_id,
         'message'::text AS event_type,
         m.id AS ref_id,
         coalesce(cp.display_name, 'User') AS actor_name,
         left(m.content,120) AS summary,
         m.created_at
    FROM chat_messages m
    LEFT JOIN case_participants cp ON cp.case_id = m.case_id AND cp.user_id = m.user_id
   WHERE m.case_id IS NOT NULL
  UNION ALL
  SELECT n.case_id,
         'notification'::text AS event_type,
         n.id AS ref_id,
         coalesce(cp.display_name, 'System') AS actor_name,
         left(n.message,120) AS summary,
         n.created_at
    FROM notifications n
    LEFT JOIN case_participants cp ON cp.case_id = n.case_id AND cp.user_id = n.user_id
   WHERE n.case_id IS NOT NULL
  UNION ALL
  SELECT csh.case_id,
         'status_change'::text AS event_type,
         csh.id AS ref_id,
         coalesce(cp.display_name,'System') AS actor_name,
         concat('Status changed to ', csh.new_status) AS summary,
         csh.created_at
    FROM case_status_history csh
    LEFT JOIN case_participants cp ON cp.case_id = csh.case_id AND cp.user_id = csh.changed_by;

-- 6. Sample seed event (safe if none exist) ----------------------------------------------------------
INSERT INTO case_events(case_id,title,starts_at,ends_at,location,type)
SELECT id, 'Initial Mediation Session', now() + interval '7 days', now() + interval '7 days' + interval '1 hour', 'Virtual', 'mediation'
  FROM cases c
 WHERE NOT EXISTS (SELECT 1 FROM case_events e WHERE e.case_id = c.id)
 LIMIT 1;

COMMIT;
