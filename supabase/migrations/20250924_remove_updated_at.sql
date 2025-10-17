-- Drop trigger if it exists
DROP TRIGGER IF EXISTS set_cases_updated_at ON cases;

-- Drop trigger function if it exists
DROP FUNCTION IF EXISTS update_cases_updated_at();

-- Drop updated_at column if it exists
ALTER TABLE cases DROP COLUMN IF EXISTS updated_at;
