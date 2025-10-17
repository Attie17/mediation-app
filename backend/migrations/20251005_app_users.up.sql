-- app_users canonical profile table (2025-10-05)
BEGIN;

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

-- compatibility view/alias if legacy code expects id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_users' AND column_name='id') THEN
    ALTER TABLE app_users ADD COLUMN id uuid GENERATED ALWAYS AS (user_id) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);

-- updated_at trigger
CREATE OR REPLACE FUNCTION touch_app_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_app_users_updated_at ON app_users;
CREATE TRIGGER trg_touch_app_users_updated_at
BEFORE UPDATE ON app_users
FOR EACH ROW EXECUTE FUNCTION touch_app_users_updated_at();

COMMIT;
