-- Migration: create notifications table with typed categories
-- Up
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'notification_type'
  ) THEN
    CREATE TYPE notification_type AS ENUM (
      'participant_invite',
      'participant_update',
      'participant_delete',
      'note_added',
      'requirement_update'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  case_id BIGINT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at
  ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_case_id_created_at
  ON notifications (case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (user_id, read)
  WHERE read = false;

-- Down
DROP TABLE IF EXISTS notifications;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'notification_type'
  ) THEN
    DROP TYPE notification_type;
  END IF;
END
$$;
