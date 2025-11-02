-- Multi-Tenant Organizations Schema Migration
-- Purpose: Add organization/tenant isolation for multiple mediator practices
-- Date: 2025-10-26

-- ============================================================================
-- ENABLE EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ORGANIZATIONS TABLE
-- Each mediator practice is an organization (tenant)
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  
  -- Subscription & Billing
  subscription_tier TEXT DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'basic', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'suspended')),
  trial_ends_at TIMESTAMP,
  
  -- Resource Limits (based on tier)
  max_active_cases INTEGER DEFAULT 5,
  max_mediators INTEGER DEFAULT 1,
  storage_limit_mb INTEGER DEFAULT 1000, -- 1GB default
  storage_used_mb INTEGER DEFAULT 0,
  
  -- Contact & Branding
  logo_url TEXT,
  website TEXT,
  address TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- Soft delete
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(subscription_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_tier ON organizations(subscription_tier) WHERE deleted_at IS NULL;

-- ============================================================================
-- SUBSCRIPTION PLANS TABLE
-- Define available pricing tiers
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  price_monthly_cents INTEGER NOT NULL,
  price_annual_cents INTEGER,
  currency TEXT DEFAULT 'ZAR',
  
  -- Limits
  max_active_cases INTEGER,
  max_mediators INTEGER,
  storage_limit_mb INTEGER,
  
  -- Features
  features JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, display_name, description, price_monthly_cents, price_annual_cents, max_active_cases, max_mediators, storage_limit_mb, features)
VALUES 
  ('trial', 'Free Trial', '14-day trial with full features', 0, 0, 5, 1, 1000, '["All features", "14-day trial", "No credit card required"]'::jsonb),
  ('basic', 'Basic', 'Perfect for solo mediators', 49900, 499000, 20, 1, 5000, '["20 active cases", "5GB storage", "Email support", "Standard templates"]'::jsonb),
  ('pro', 'Professional', 'For growing practices', 99900, 999000, 100, 5, 20000, '["100 active cases", "5 mediators", "20GB storage", "Priority support", "Custom branding", "Advanced analytics"]'::jsonb),
  ('enterprise', 'Enterprise', 'Unlimited scale', 249900, 2499000, NULL, NULL, NULL, '["Unlimited cases", "Unlimited mediators", "Unlimited storage", "24/7 support", "White label", "API access", "Custom integrations"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- Track active subscriptions for each organization
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  -- Billing cycle
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid')),
  
  -- Dates
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  canceled_at TIMESTAMP,
  trial_end TIMESTAMP,
  
  -- Payment provider
  payment_provider TEXT, -- 'payfast', 'stripe', 'manual'
  external_subscription_id TEXT, -- Provider's subscription ID
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- INVOICES TABLE
-- Track billing history
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Invoice details
  invoice_number TEXT UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  description TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'canceled', 'refunded')),
  
  -- Dates
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP,
  
  -- Payment
  payment_method TEXT,
  payment_reference TEXT,
  
  -- PDF
  pdf_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE status = 'pending';

-- ============================================================================
-- UPDATE EXISTING TABLES - Add organization_id
-- ============================================================================

-- Add organization_id to app_users
ALTER TABLE app_users 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_app_users_org ON app_users(organization_id);

-- Add organization_id to cases
ALTER TABLE cases 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_cases_org ON cases(organization_id);

-- Add organization_id to uploads
ALTER TABLE uploads 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_uploads_org ON uploads(organization_id);

-- Add organization_id to admin_activity_log
ALTER TABLE admin_activity_log 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- ============================================================================
-- CASE ASSIGNMENT TABLE
-- Track which mediator is assigned to which case
-- ============================================================================
CREATE TABLE IF NOT EXISTS case_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  mediator_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Assignment details
  assigned_by UUID REFERENCES app_users(id), -- Admin who made the assignment
  assigned_at TIMESTAMP DEFAULT NOW(),
  unassigned_at TIMESTAMP,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'reassigned', 'unassigned')),
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_assignments_case ON case_assignments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_mediator ON case_assignments(mediator_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_status ON case_assignments(status);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check storage quota
CREATE OR REPLACE FUNCTION check_storage_quota()
RETURNS TRIGGER AS $$
DECLARE
  org_limit INTEGER;
  org_used INTEGER;
BEGIN
  -- Get organization's storage limit and usage
  SELECT storage_limit_mb, storage_used_mb 
  INTO org_limit, org_used
  FROM organizations 
  WHERE id = NEW.organization_id;
  
  -- If limit exists and would be exceeded, reject upload
  IF org_limit IS NOT NULL AND org_used >= org_limit THEN
    RAISE EXCEPTION 'Storage quota exceeded for organization';
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply storage quota check to uploads
DROP TRIGGER IF EXISTS check_upload_quota ON uploads;
CREATE TRIGGER check_upload_quota 
  BEFORE INSERT ON uploads 
  FOR EACH ROW 
  EXECUTE FUNCTION check_storage_quota();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE organizations IS 'Multi-tenant organizations - each mediator practice is a separate tenant';
COMMENT ON TABLE subscriptions IS 'Active subscriptions for organizations with billing cycle tracking';
COMMENT ON TABLE invoices IS 'Billing history and invoice records';
COMMENT ON TABLE case_assignments IS 'Track which mediator is assigned to which case for proper workload distribution';
COMMENT ON COLUMN organizations.subscription_tier IS 'Pricing tier: trial, basic, pro, enterprise';
COMMENT ON COLUMN organizations.subscription_status IS 'Subscription status: active, trialing, past_due, canceled, suspended';
COMMENT ON COLUMN organizations.storage_used_mb IS 'Current storage usage in megabytes, updated on upload/delete';
