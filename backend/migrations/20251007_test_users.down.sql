-- Rollback objects created by 20251007_test_users.up.sql
DROP TRIGGER IF EXISTS test_users_set_updated_at ON public.test_users;
DROP FUNCTION IF EXISTS public.set_updated_at();
-- Optional: drop the table (commented to preserve dev data)
-- DROP TABLE IF EXISTS public.test_users;
