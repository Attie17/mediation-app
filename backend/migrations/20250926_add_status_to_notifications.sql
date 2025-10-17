-- Add status column and enforce type values on notifications
BEGIN;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'unread'
    CHECK (status IN ('unread', 'read'));

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('info', 'upload', 'participant', 'note'));

COMMIT;
