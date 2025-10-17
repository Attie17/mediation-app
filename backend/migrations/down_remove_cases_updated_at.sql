-- Down migration: Remove updated_at feature from cases table (idempotent)

-- Drop trigger if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_cases_updated_at'
      AND tgrelid = 'cases'::regclass
  ) THEN
    DROP TRIGGER IF EXISTS set_cases_updated_at ON cases;
  END IF;
END $$;

-- Drop trigger function if it exists
DROP FUNCTION IF EXISTS update_cases_updated_at() CASCADE;

-- Drop updated_at column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='cases' AND column_name='updated_at'
  ) THEN
    ALTER TABLE cases DROP COLUMN IF EXISTS updated_at;
  END IF;
END $$;
