ALTER TABLE public.test_users
  ADD COLUMN IF NOT EXISTS password_hash text;
-- Optional future: once password_hash populated for all rows, you can drop the legacy plaintext column:
-- ALTER TABLE public.test_users DROP COLUMN password;
NOTIFY pgrst, 'reload schema';
