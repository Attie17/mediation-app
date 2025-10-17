-- Fix AI Insights Foreign Key Constraints
-- Update foreign keys to reference app_users instead of users

-- Drop existing foreign key constraints
ALTER TABLE ai_insights DROP CONSTRAINT IF EXISTS ai_insights_created_by_fkey;
ALTER TABLE ai_insights DROP CONSTRAINT IF EXISTS ai_insights_reviewed_by_fkey;

-- Add new foreign key constraints pointing to app_users
ALTER TABLE ai_insights 
ADD CONSTRAINT ai_insights_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES app_users(user_id) ON DELETE SET NULL;

ALTER TABLE ai_insights 
ADD CONSTRAINT ai_insights_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES app_users(user_id) ON DELETE SET NULL;

-- Update comments
COMMENT ON CONSTRAINT ai_insights_created_by_fkey ON ai_insights 
IS 'Foreign key to app_users.user_id for creator tracking';

COMMENT ON CONSTRAINT ai_insights_reviewed_by_fkey ON ai_insights 
IS 'Foreign key to app_users.user_id for reviewer tracking';