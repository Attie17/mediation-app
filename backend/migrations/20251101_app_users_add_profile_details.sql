-- Add profile_details column to app_users (idempotent)
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'app_users'
      AND column_name = 'profile_details'
  ) THEN
    ALTER TABLE public.app_users
      ADD COLUMN profile_details jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

COMMIT;
