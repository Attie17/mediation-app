-- Create app_users table for role management
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('divorcee', 'mediator', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trigger function to auto-insert into app_users
CREATE OR REPLACE FUNCTION insert_app_user_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO app_users (id, role) VALUES (NEW.id, 'divorcee');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_insert_app_user ON auth.users;

-- Create trigger
CREATE TRIGGER trg_insert_app_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION insert_app_user_on_signup();
