-- Rollback status column and type constraint on notifications
BEGIN;

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  DROP COLUMN IF EXISTS status;

COMMIT;
