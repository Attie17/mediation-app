-- Add short_id (bigint SERIAL) to cases table
-- This allows legacy tables using bigint to reference cases via short_id
-- while new tables can use the UUID primary key (id)

DO $$
BEGIN
  -- Add short_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cases'
      AND column_name = 'short_id'
  ) THEN
    -- Add column as SERIAL (auto-incrementing bigint)
    ALTER TABLE public.cases ADD COLUMN short_id SERIAL UNIQUE;
    
    -- Create index for lookups
    CREATE INDEX IF NOT EXISTS cases_short_id_idx ON public.cases(short_id);
    
    RAISE NOTICE 'Added short_id column to cases table';
  ELSE
    RAISE NOTICE 'short_id column already exists in cases table';
  END IF;
END$$;
