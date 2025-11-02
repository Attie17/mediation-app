-- Fix incorrect participant roles in case_participants table
-- Issue: "Uploads Test Mediator" is showing as divorcee instead of mediator

-- First, let's see the current state
SELECT 
  cp.user_id,
  cp.role as current_role,
  au.name,
  au.email,
  cp.case_id
FROM case_participants cp
JOIN app_users au ON au.user_id = cp.user_id
WHERE cp.case_id = '3bcb2937-0e55-451a-a9fd-659187af84d4'
ORDER BY au.name;

-- Fix: Update "Uploads Test Mediator" to have role 'mediator'
UPDATE case_participants
SET role = 'mediator'
WHERE user_id = (
  SELECT user_id 
  FROM app_users 
  WHERE email = 'uploads.mediator@example.com'
)
AND case_id = '3bcb2937-0e55-451a-a9fd-659187af84d4';

-- Verify the fix
SELECT 
  cp.user_id,
  cp.role as updated_role,
  au.name,
  au.email
FROM case_participants cp
JOIN app_users au ON au.user_id = cp.user_id
WHERE cp.case_id = '3bcb2937-0e55-451a-a9fd-659187af84d4'
ORDER BY au.name;
