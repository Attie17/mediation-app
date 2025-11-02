-- Add White-Label Branding Fields to Organizations
-- Purpose: Allow each organization to have custom branding for their portal
-- Date: 2025-10-27

-- ============================================================================
-- ADD BRANDING COLUMNS
-- ============================================================================

-- Primary brand color (hex code)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#3b82f6';

-- Secondary/accent color (hex code)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#10b981';

-- Custom logo URL (uploaded by admin or set via URL)
-- Note: logo_url already exists in schema, but ensuring it's there
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Organization tagline/slogan
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS tagline TEXT;

-- Custom domain for white-label (e.g., mediation.clientcompany.com)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS custom_domain TEXT;

-- Branding settings JSON for additional customization
-- Can include: fonts, button styles, header/footer text, etc.
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_organizations_custom_domain 
ON organizations(custom_domain) 
WHERE custom_domain IS NOT NULL AND deleted_at IS NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON COLUMN organizations.primary_color IS 'Primary brand color (hex code) for organization UI';
COMMENT ON COLUMN organizations.secondary_color IS 'Secondary/accent brand color (hex code)';
COMMENT ON COLUMN organizations.tagline IS 'Organization tagline/slogan displayed on portal';
COMMENT ON COLUMN organizations.custom_domain IS 'Custom domain for white-label portal access';
COMMENT ON COLUMN organizations.branding_config IS 'Additional branding configuration as JSON';

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================
-- Update existing organizations with sample branding
UPDATE organizations 
SET 
  primary_color = '#1e40af',
  secondary_color = '#059669',
  tagline = 'Professional Divorce Mediation Services'
WHERE tagline IS NULL;
