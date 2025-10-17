-- Migration: Add status enum constraint to cases table
-- Enforce allowed status values and default
ALTER TABLE cases 
  ALTER COLUMN status SET DEFAULT 'open';

ALTER TABLE cases 
  ADD CONSTRAINT cases_status_check 
  CHECK (status IN ('open', 'in_progress', 'closed', 'archived'));
