-- Seed a notification for the test user supplied via TEST_USER_ID.
-- Usage (from backend directory):
--   psql "$DATABASE_URL" -v TEST_USER_ID="$TEST_USER_ID" -f scripts/seed-notification.sql

\echo 'Checking notification_type enum availability'
SELECT CASE WHEN to_regtype('notification_type') IS NULL THEN 0 ELSE 1 END AS has_notification_enum;
\gset

\if :has_notification_enum
DO $$
BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'info';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
\endif

SELECT CASE WHEN EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'notifications'
    AND column_name = 'case_id'
) THEN 1 ELSE 0 END AS has_case_id;
\gset

\if :has_case_id
WITH target_case AS (
  SELECT cp.case_id
  FROM case_participants cp
  WHERE cp.user_id = :'TEST_USER_ID'
  ORDER BY cp.updated_at DESC NULLS LAST, cp.created_at DESC
  LIMIT 1
),
fallback_case AS (
  SELECT c.id AS case_id
  FROM cases c
  ORDER BY c.updated_at DESC NULLS LAST, c.created_at DESC
  LIMIT 1
)
INSERT INTO notifications (user_id, case_id, type, message)
SELECT :'TEST_USER_ID',
       COALESCE((SELECT case_id FROM target_case), (SELECT case_id FROM fallback_case)),
       'info',
       'Test notification lifecycle'
WHERE EXISTS (SELECT 1 FROM app_users WHERE id = :'TEST_USER_ID')
  AND COALESCE((SELECT case_id FROM target_case), (SELECT case_id FROM fallback_case)) IS NOT NULL;
\else
INSERT INTO notifications (user_id, type, message)
SELECT :'TEST_USER_ID', 'info', 'Test notification lifecycle'
WHERE EXISTS (SELECT 1 FROM app_users WHERE id = :'TEST_USER_ID');
\endif

\echo 'Current notifications for test user:'
\if :has_case_id
SELECT id, case_id, type, message, read, created_at
FROM notifications
WHERE user_id = :'TEST_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
\else
SELECT id, type, message, read, created_at
FROM notifications
WHERE user_id = :'TEST_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
\endif
