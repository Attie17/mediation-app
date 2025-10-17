-- Idempotent safety patch for app_users user_id canonicalization (2025-10-06)
BEGIN;

DO $$
BEGIN
  -- Create table if entirely missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='app_users'
  ) THEN
    CREATE TABLE public.app_users (
      user_id uuid PRIMARY KEY,
      email text UNIQUE,
      name text,
      preferred_name text,
      phone text,
      address jsonb DEFAULT '{}'::jsonb,
      avatar_url text,
      role text CHECK (role IN ('admin','mediator','divorcee','lawyer')) DEFAULT 'divorcee',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  ELSE
    -- If legacy id exists and user_id missing, rename
    IF EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name='app_users' AND column_name='id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name='app_users' AND column_name='user_id'
    ) THEN
      ALTER TABLE public.app_users RENAME COLUMN id TO user_id;
    END IF;
    -- Ensure user_id column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name='app_users' AND column_name='user_id'
    ) THEN
      ALTER TABLE public.app_users ADD COLUMN user_id uuid;
      UPDATE public.app_users SET user_id = gen_random_uuid() WHERE user_id IS NULL;
    END IF;
    -- Ensure not null
    ALTER TABLE public.app_users ALTER COLUMN user_id SET NOT NULL;
    -- Ensure primary key exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints WHERE table_name='app_users' AND constraint_type='PRIMARY KEY'
    ) THEN
      ALTER TABLE public.app_users ADD PRIMARY KEY (user_id);
    END IF;
  END IF;
END$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname='app_users_set_updated_at'
  ) THEN
    CREATE TRIGGER app_users_set_updated_at
    BEFORE UPDATE ON public.app_users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

COMMIT;