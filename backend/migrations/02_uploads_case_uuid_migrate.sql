-- Add case_uuid column to uploads and migrate references
-- Step 1: Add case_uuid column
-- Step 2: Backfill case_uuid from case_id -> cases.short_id -> cases.id
-- Step 3: Add FK constraint and index
-- Note: Keeps case_id (bigint) for now - can drop later once migration is verified

DO $$
BEGIN
  -- Step 1: Add case_uuid column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'uploads'
      AND column_name = 'case_uuid'
  ) THEN
    ALTER TABLE public.uploads ADD COLUMN case_uuid uuid;
    RAISE NOTICE 'Added case_uuid column to uploads table';
  ELSE
    RAISE NOTICE 'case_uuid column already exists in uploads table';
  END IF;

  -- Step 2: Backfill case_uuid from case_id using cases.short_id mapping
  -- Only update rows where case_uuid is NULL and case_id is NOT NULL
  UPDATE public.uploads u
  SET case_uuid = c.id
  FROM public.cases c
  WHERE u.case_uuid IS NULL
    AND u.case_id IS NOT NULL
    AND c.short_id = u.case_id;

  RAISE NOTICE 'Backfilled case_uuid from case_id via cases.short_id';

  -- Step 3: Add FK constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'uploads'
      AND constraint_name = 'uploads_case_uuid_fk'
  ) THEN
    ALTER TABLE public.uploads
      ADD CONSTRAINT uploads_case_uuid_fk
      FOREIGN KEY (case_uuid) REFERENCES public.cases(id);
    
    RAISE NOTICE 'Added FK constraint uploads_case_uuid_fk';
  ELSE
    RAISE NOTICE 'FK constraint uploads_case_uuid_fk already exists';
  END IF;

  -- Step 4: Create index for performance
  CREATE INDEX IF NOT EXISTS uploads_case_uuid_idx ON public.uploads(case_uuid);
  
  RAISE NOTICE 'Created index uploads_case_uuid_idx';
END$$;
