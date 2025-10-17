-- Migration: Ensure canonical app_users table with user_id UUID PK and supporting trigger
BEGIN;

-- 1. Create table if missing
CREATE TABLE IF NOT EXISTS app_users (
  user_id uuid PRIMARY KEY,
  email text UNIQUE,
  name text,
  preferred_name text,
  phone text,
  address jsonb DEFAULT '{}'::jsonb,
  avatar_url text,
  role text NOT NULL DEFAULT 'divorcee' CHECK (role IN ('admin','mediator','divorcee','lawyer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. If legacy column id exists and user_id missing, attempt to migrate
DO $$
DECLARE col_exists int; id_col int; pk_exists int;
BEGIN
  SELECT COUNT(*) INTO col_exists FROM information_schema.columns WHERE table_name='app_users' AND column_name='user_id';
  SELECT COUNT(*) INTO id_col FROM information_schema.columns WHERE table_name='app_users' AND column_name='id';
  IF col_exists = 0 AND id_col = 1 THEN
    -- Add user_id and copy values
    ALTER TABLE app_users ADD COLUMN user_id uuid;
    UPDATE app_users SET user_id = id;
    ALTER TABLE app_users ALTER COLUMN user_id SET NOT NULL;
  ELSIF col_exists = 0 THEN
    -- Fresh install, just add user_id
    ALTER TABLE app_users ADD COLUMN user_id uuid NOT NULL DEFAULT gen_random_uuid();
  END IF;

  -- Ensure primary key on user_id
  SELECT COUNT(*) INTO pk_exists FROM pg_constraint WHERE conrelid='app_users'::regclass AND contype='p';
  IF pk_exists = 0 THEN
    ALTER TABLE app_users ADD CONSTRAINT app_users_pkey PRIMARY KEY (user_id);
  END IF;
END $$;

-- 3. Drop any computed id column if present and redundant (optional keep if depended on)
-- We keep id if it exists to avoid breaking code that still references it; do not drop automatically.

-- 4. Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION touch_app_users_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_app_users_updated_at ON app_users;
CREATE TRIGGER trg_touch_app_users_updated_at BEFORE UPDATE ON app_users FOR EACH ROW EXECUTE FUNCTION touch_app_users_updated_at();

COMMIT;
