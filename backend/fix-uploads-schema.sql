-- CRITICAL DATABASE SCHEMA FIX
-- Problem: uploads.user_id is bigint, but should be UUID to match app_users.user_id

-- Step 1: Check current data type
SELECT 
  column_name, 
  data_type, 
  udt_name 
FROM information_schema.columns 
WHERE table_name = 'uploads' 
  AND column_name = 'user_id';

-- Step 2: Check if there's any data in uploads table
SELECT COUNT(*) as upload_count FROM uploads;

-- Step 3: If uploads table is empty (likely), we can safely change the type
-- If NOT empty, we need to migrate data carefully

-- OPTION A: If table is EMPTY (recommended)
ALTER TABLE uploads ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;

-- OPTION B: If table has data
-- First, create a backup column
ALTER TABLE uploads ADD COLUMN user_id_new UUID;

-- Migrate data (this will fail if user_id contains invalid UUIDs)
UPDATE uploads SET user_id_new = user_id::text::uuid WHERE user_id IS NOT NULL;

-- Drop old column
ALTER TABLE uploads DROP COLUMN user_id;

-- Rename new column
ALTER TABLE uploads RENAME COLUMN user_id_new TO user_id;

-- Step 4: Add foreign key constraint (optional but recommended)
ALTER TABLE uploads 
  ADD CONSTRAINT fk_uploads_user 
  FOREIGN KEY (user_id) 
  REFERENCES app_users(user_id)
  ON DELETE CASCADE;

-- Step 5: Verify the change
SELECT 
  column_name, 
  data_type, 
  udt_name 
FROM information_schema.columns 
WHERE table_name = 'uploads' 
  AND column_name = 'user_id';
