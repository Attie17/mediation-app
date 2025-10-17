-- Add version column to uploads table
-- This should be run in your Supabase SQL editor

-- Add version column with default value 1
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Update existing records to have version 1
UPDATE uploads SET version = 1 WHERE version IS NULL;

-- Add a composite index for efficient querying of latest versions
CREATE INDEX IF NOT EXISTS idx_uploads_user_doctype_version 
ON uploads (user_id, doc_type, version DESC);

-- Optional: Add a constraint to ensure version is positive
ALTER TABLE uploads ADD CONSTRAINT check_version_positive CHECK (version > 0);