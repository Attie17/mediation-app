-- Fix FK for case_participants → cases(id) (UUID)
-- Safe/idempotent: drops the wrong FK if present, removes orphans, adds correct FK + index.

-- Drop the mistaken FK (to short_id) if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'case_participants'
      AND constraint_name = 'case_participants_case_short_fk'
  ) THEN
    ALTER TABLE public.case_participants
      DROP CONSTRAINT case_participants_case_short_fk;
  END IF;
END$$;

-- Dev safety: remove orphans so the FK can be created
DELETE FROM public.case_participants cp
WHERE NOT EXISTS (
  SELECT 1 FROM public.cases c WHERE c.id = cp.case_id
);

-- Add the correct UUID FK (guarded)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'case_participants'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'case_participants_case_uuid_fk'
  ) THEN
    ALTER TABLE public.case_participants
      ADD CONSTRAINT case_participants_case_uuid_fk
      FOREIGN KEY (case_id) REFERENCES public.cases(id);
  END IF;
END$$;

-- Helpful index on the FK
CREATE INDEX IF NOT EXISTS case_participants_case_idx
  ON public.case_participants(case_id);
