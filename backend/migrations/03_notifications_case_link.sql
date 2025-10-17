-- Add case_id (uuid) column to notifications table
-- Links notifications to cases for case-specific activity feeds

DO $$
BEGIN
  -- Add case_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'case_id'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN case_id uuid;
    RAISE NOTICE 'Added case_id column to notifications table';
  ELSE
    RAISE NOTICE 'case_id column already exists in notifications table';
  END IF;

  -- Add FK constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND constraint_name = 'notifications_case_fk'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_case_fk
      FOREIGN KEY (case_id) REFERENCES public.cases(id);
    
    RAISE NOTICE 'Added FK constraint notifications_case_fk';
  ELSE
    RAISE NOTICE 'FK constraint notifications_case_fk already exists';
  END IF;

  -- Create index for case-based queries
  CREATE INDEX IF NOT EXISTS notifications_case_idx ON public.notifications(case_id, created_at DESC);
  
  RAISE NOTICE 'Created index notifications_case_idx';
END$$;
