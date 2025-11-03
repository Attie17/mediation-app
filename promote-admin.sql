-- Promote ds.attie.nel@gmail.com to Primary Admin
-- Run this in Supabase SQL Editor

-- Calculate the user_id (using the same UUID v5 generation as the app)
-- The namespace is: 6f8c2b65-9e3f-4f7a-9d3d-2a3d2b1c4d10
-- For ds.attie.nel@gmail.com, the user_id should be: 9cb8c3a1-5e7f-5f4a-9d3d-2a3d2b1c4d10

-- Update the user role to admin
UPDATE app_users
SET role = 'admin',
    updated_at = NOW()
WHERE email = 'ds.attie.nel@gmail.com';

-- Verify the update
SELECT user_id, email, role, created_at, updated_at
FROM app_users
WHERE email = 'ds.attie.nel@gmail.com';
