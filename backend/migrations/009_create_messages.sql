-- Migration: Create Messages System
-- Description: Enables secure messaging between case participants (divorcee, mediator, lawyer)
-- Date: 2025-10-25

-- ============================================================================
-- 1. CREATE MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]', -- Array of {filename, url, size, type}
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT messages_content_not_empty CHECK (length(trim(content)) > 0)
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Most common query: get all messages for a case
CREATE INDEX idx_messages_case_id ON messages(case_id);

-- For filtering by sender
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- For filtering by recipient
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);

-- For ordering by time (newest first)
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Composite index for unread messages query
CREATE INDEX idx_messages_recipient_unread ON messages(recipient_id, read_at) 
WHERE read_at IS NULL;

-- ============================================================================
-- 3. CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_updated_at_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read messages where they are sender OR recipient
CREATE POLICY messages_select_policy ON messages
  FOR SELECT
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id
  );

-- Policy: Users can insert messages where they are the sender
CREATE POLICY messages_insert_policy ON messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Policy: Users can update their own messages (for editing)
CREATE POLICY messages_update_policy ON messages
  FOR UPDATE
  USING (auth.uid() = sender_id);

-- Policy: Users cannot delete messages (keep audit trail)
-- If needed later, add soft delete with deleted_at column

-- ============================================================================
-- 5. HELPER FUNCTION: Mark Message as Read
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_message_read(message_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE messages
  SET read_at = NOW()
  WHERE id = message_uuid
    AND recipient_id = user_uuid
    AND read_at IS NULL;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. HELPER FUNCTION: Get Unread Count for User
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM messages
  WHERE recipient_id = user_uuid
    AND read_at IS NULL;
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. SAMPLE DATA (for development/testing)
-- ============================================================================

-- Skipping sample data for now - will add via API instead

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;

-- Grant execute permission on helper functions
GRANT EXECUTE ON FUNCTION mark_message_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    RAISE NOTICE '✅ Messages table created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create messages table';
  END IF;
END $$;
