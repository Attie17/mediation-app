-- Add missing columns to app_users (idempotent)
BEGIN;

DO $$
BEGIN
  -- Add preferred_name if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='app_users' AND column_name='preferred_name'
  ) THEN
    ALTER TABLE public.app_users ADD COLUMN preferred_name text;
  END IF;

  -- Add phone if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='app_users' AND column_name='phone'
  ) THEN
    ALTER TABLE public.app_users ADD COLUMN phone text;
  END IF;

  -- Add address if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='app_users' AND column_name='address'
  ) THEN
    ALTER TABLE public.app_users ADD COLUMN address jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Add avatar_url if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='app_users' AND column_name='avatar_url'
  ) THEN
    ALTER TABLE public.app_users ADD COLUMN avatar_url text;
  END IF;

  -- Add email if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='app_users' AND column_name='email'
  ) THEN
    ALTER TABLE public.app_users ADD COLUMN email text UNIQUE;
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='app_users' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public.app_users ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

COMMIT;
