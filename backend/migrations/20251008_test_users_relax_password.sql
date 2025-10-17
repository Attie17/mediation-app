-- Allow register to omit plaintext password (we're moving to password_hash)
ALTER TABLE public.test_users
  ALTER COLUMN password DROP NOT NULL;

-- Drop default on password if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='test_users'
      AND column_name='password' AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE public.test_users ALTER COLUMN password DROP DEFAULT;
  END IF;
END$$;

-- Keep password column for legacy upgrade, to be dropped later.
