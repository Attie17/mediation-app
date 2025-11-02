-- Seed test organizations for development
-- Run this with: psql -U postgres -d mediation_dev -f seed-test-organizations.sql

-- Insert the default organization (already referenced in code)
INSERT INTO organizations (
  id,
  name,
  display_name,
  email,
  phone,
  subscription_tier,
  subscription_status,
  trial_ends_at,
  max_active_cases,
  max_mediators,
  storage_limit_mb,
  storage_used_mb,
  website,
  address,
  created_at,
  updated_at
) VALUES (
  'b325cbce-0a4c-4658-ac15-f6b4e8bbe62e',
  'default-organization',
  'Default Mediation Services',
  'contact@defaultmediation.com',
  '+27 11 123 4567',
  'pro',
  'active',
  NULL, -- No trial end date for pro tier
  50,
  10,
  5000,
  120,
  'https://defaultmediation.com',
  '123 Main Street, Johannesburg, 2000, South Africa',
  NOW() - INTERVAL '90 days',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_status = EXCLUDED.subscription_status,
  max_active_cases = EXCLUDED.max_active_cases,
  max_mediators = EXCLUDED.max_mediators,
  storage_limit_mb = EXCLUDED.storage_limit_mb,
  storage_used_mb = EXCLUDED.storage_used_mb,
  website = EXCLUDED.website,
  address = EXCLUDED.address,
  updated_at = NOW();

-- Insert additional test organizations
INSERT INTO organizations (
  id,
  name,
  display_name,
  email,
  phone,
  subscription_tier,
  subscription_status,
  trial_ends_at,
  max_active_cases,
  max_mediators,
  storage_limit_mb,
  storage_used_mb,
  website,
  address,
  created_at,
  updated_at
) VALUES 
(
  'a1111111-1111-1111-1111-111111111111',
  'family-matters-mediation',
  'Family Matters Mediation',
  'info@familymatters.co.za',
  '+27 21 555 0001',
  'enterprise',
  'active',
  NULL,
  100,
  25,
  10000,
  450,
  'https://familymatters.co.za',
  '456 Long Street, Cape Town, 8001, South Africa',
  NOW() - INTERVAL '180 days',
  NOW()
),
(
  'a2222222-2222-2222-2222-222222222222',
  'quick-resolve',
  'Quick Resolve Mediation Centre',
  'hello@quickresolve.co.za',
  '+27 31 555 0002',
  'basic',
  'active',
  NULL,
  10,
  3,
  1000,
  85,
  'https://quickresolve.co.za',
  '789 Smith Street, Durban, 4001, South Africa',
  NOW() - INTERVAL '45 days',
  NOW()
),
(
  'a3333333-3333-3333-3333-333333333333',
  'harmony-mediation',
  'Harmony Mediation Services',
  'support@harmonymediation.com',
  '+27 12 555 0003',
  'trial',
  'trialing',
  NOW() + INTERVAL '20 days',
  5,
  1,
  500,
  12,
  'https://harmonymediation.com',
  '321 Church Street, Pretoria, 0001, South Africa',
  NOW() - INTERVAL '10 days',
  NOW()
),
(
  'a4444444-4444-4444-4444-444444444444',
  'legal-bridge',
  'Legal Bridge Mediation',
  'admin@legalbridge.co.za',
  '+27 41 555 0004',
  'pro',
  'active',
  NULL,
  50,
  10,
  5000,
  890,
  'https://legalbridge.co.za',
  '654 Main Road, Port Elizabeth, 6001, South Africa',
  NOW() - INTERVAL '120 days',
  NOW()
),
(
  'a5555555-5555-5555-5555-555555555555',
  'peaceful-solutions',
  'Peaceful Solutions Inc.',
  'contact@peacefulsolutions.com',
  '+27 51 555 0005',
  'basic',
  'past_due',
  NULL,
  10,
  3,
  1000,
  650,
  'https://peacefulsolutions.com',
  '987 High Street, Bloemfontein, 9300, South Africa',
  NOW() - INTERVAL '200 days',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_status = EXCLUDED.subscription_status,
  trial_ends_at = EXCLUDED.trial_ends_at,
  max_active_cases = EXCLUDED.max_active_cases,
  max_mediators = EXCLUDED.max_mediators,
  storage_limit_mb = EXCLUDED.storage_limit_mb,
  storage_used_mb = EXCLUDED.storage_used_mb,
  website = EXCLUDED.website,
  address = EXCLUDED.address,
  updated_at = NOW();

-- Display results
SELECT 
  id,
  display_name,
  subscription_tier,
  subscription_status,
  max_active_cases,
  max_mediators,
  ROUND(storage_used_mb::numeric / storage_limit_mb * 100, 1) || '%' as storage_usage
FROM organizations
WHERE deleted_at IS NULL
ORDER BY created_at;

-- Summary statistics
SELECT 
  COUNT(*) as total_organizations,
  COUNT(*) FILTER (WHERE subscription_status = 'active') as active,
  COUNT(*) FILTER (WHERE subscription_status = 'trialing') as trialing,
  COUNT(*) FILTER (WHERE subscription_status = 'past_due') as past_due,
  COUNT(*) FILTER (WHERE subscription_tier = 'enterprise') as enterprise_tier,
  COUNT(*) FILTER (WHERE subscription_tier = 'pro') as pro_tier,
  COUNT(*) FILTER (WHERE subscription_tier = 'basic') as basic_tier,
  COUNT(*) FILTER (WHERE subscription_tier = 'trial') as trial_tier
FROM organizations
WHERE deleted_at IS NULL;
