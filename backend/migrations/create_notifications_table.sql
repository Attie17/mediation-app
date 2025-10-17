-- notifications table migration
-- up
BEGIN;

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'upload', 'participant', 'note')),
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at
  ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_status
  ON notifications (user_id, status);

COMMIT;

-- down
BEGIN;

DROP TABLE IF EXISTS notifications;

COMMIT;