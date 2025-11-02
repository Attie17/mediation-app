-- User Invitations System
-- Purpose: Allow admins to invite mediators to join organizations
-- Date: 2025-10-27

-- ============================================================================
-- USER INVITATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Organization relationship
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Invitee information
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'mediator' CHECK (role IN ('mediator', 'lawyer', 'divorcee')),
  invited_by UUID REFERENCES app_users(user_id),
  
  -- Invitation token (for secure signup link)
  token TEXT NOT NULL UNIQUE,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMP,
  
  -- Metadata
  invitation_message TEXT,
  accepted_by_user_id UUID REFERENCES app_users(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_organization ON user_invitations(organization_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_invitations_email ON user_invitations(email) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON user_invitations(status);

-- Prevent duplicate pending invitations for same email to same org
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_unique_pending 
ON user_invitations(organization_id, LOWER(email)) 
WHERE status = 'pending';

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE user_invitations IS 'Tracks user invitations sent by admins to join organizations';
COMMENT ON COLUMN user_invitations.token IS 'Unique secure token for invitation signup URL';
COMMENT ON COLUMN user_invitations.expires_at IS 'Invitation expiry date (default 7 days from creation)';
COMMENT ON COLUMN user_invitations.status IS 'pending: awaiting acceptance, accepted: user created, expired: past expiry date, cancelled: manually cancelled';

-- ============================================================================
-- AUTO-EXPIRE FUNCTION
-- Automatically mark invitations as expired when expires_at is reached
-- ============================================================================
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE user_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- You could set up a cron job or trigger to run this periodically
-- For now, it can be called manually or before checking invitation status
