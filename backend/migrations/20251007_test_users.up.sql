CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- for gen_random_uuid()

CREATE TABLE IF NOT EXISTS public.test_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,               -- dev only; will replace with hash later
  role text CHECK (role IN ('admin','mediator','divorcee','lawyer')) DEFAULT 'divorcee',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='test_users_set_updated_at') THEN
    CREATE TRIGGER test_users_set_updated_at
    BEFORE UPDATE ON public.test_users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- If table exists but lacks 'password', add it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='test_users' AND column_name='password'
  ) THEN
    ALTER TABLE public.test_users ADD COLUMN password text NOT NULL DEFAULT '';
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS test_users_email_idx ON public.test_users(email);
