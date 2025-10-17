-- Drop app_users profile objects (2025-10-05)
BEGIN;
DROP TRIGGER IF EXISTS trg_touch_app_users_updated_at ON app_users;
DROP FUNCTION IF EXISTS touch_app_users_updated_at();
DROP TABLE IF EXISTS app_users;
COMMIT;
