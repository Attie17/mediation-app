-- Migration: Add updated_at column and auto-update trigger for cases table
-- Idempotent: checks for column and trigger existence

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='cases' AND column_name='updated_at'
  ) THEN
    ALTER TABLE cases ADD COLUMN updated_at timestamp WITHOUT TIME ZONE NOT NULL DEFAULT now();
  END IF;
END $$;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_cases_updated_at ON cases;

-- Create the trigger (idempotent)
CREATE TRIGGER set_cases_updated_at
BEFORE UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION update_cases_updated_at();
