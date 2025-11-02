-- Add session reminder tracking fields
-- Supports sending and tracking reminder notifications for upcoming mediation sessions

ALTER TABLE mediation_sessions
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- Add index for querying sessions that need reminders
CREATE INDEX IF NOT EXISTS idx_mediation_sessions_reminder 
ON mediation_sessions(scheduled_date, reminder_sent) 
WHERE status = 'scheduled';

-- Comment on new columns
COMMENT ON COLUMN mediation_sessions.reminder_sent IS 'Whether a reminder has been sent for this session';
COMMENT ON COLUMN mediation_sessions.reminder_sent_at IS 'Timestamp when the last reminder was sent';
COMMENT ON COLUMN mediation_sessions.reminder_count IS 'Number of reminders sent for this session';
