-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'cases'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE cases
    ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
END
$$;

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_cases_updated_at ON cases;

-- Create trigger
CREATE TRIGGER set_cases_updated_at
BEFORE UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION update_cases_updated_at();
