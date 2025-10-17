-- Remove notifications seeded for the test user supplied via TEST_USER_ID.
-- Usage (from backend directory):
--   psql "$DATABASE_URL" -v TEST_USER_ID="$TEST_USER_ID" -f scripts/cleanup-notifications.sql

DELETE FROM notifications
WHERE user_id = :'TEST_USER_ID'
RETURNING id, case_id, type, created_at;
