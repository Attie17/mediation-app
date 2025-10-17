-- Revert 20251005_app_users_user_id changes cautiously
BEGIN;
-- We only remove objects we created if they are safe to drop.
-- 1. Drop trigger & function
DROP TRIGGER IF EXISTS trg_touch_app_users_updated_at ON app_users;
DROP FUNCTION IF EXISTS touch_app_users_updated_at();
-- 2. We DO NOT drop the table or user_id column to avoid data loss.
COMMIT;
