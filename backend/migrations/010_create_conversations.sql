-- Migration: Create Conversations System
-- Description: Replaces 1-to-1 messaging with conversation-based system
-- Supports: divorcee-to-divorcee, divorcee-to-mediator, group, admin-support, lawyer-to-mediator
-- Date: 2025-10-25

-- ============================================================================
-- 1. CREATE CONVERSATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL CHECK (
    conversation_type IN (
      'divorcee_to_divorcee',   -- Private: two divorcees
      'divorcee_to_mediator',   -- Private: divorcee + mediator
      'group',                  -- Group: all case participants (2 divorcees + mediator)
      'admin_support',          -- Admin messaging about fees/docs
      'lawyer_to_mediator'      -- Private: lawyer + mediator
    )
  ),
  title TEXT NOT NULL,
  created_by UUID REFERENCES app_users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- For non-case conversations (admin support)
  CONSTRAINT case_required_for_case_conversations CHECK (
    (conversation_type IN ('admin_support') AND case_id IS NULL) OR
    (conversation_type NOT IN ('admin_support') AND case_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_conversations_case_id ON conversations(case_id);
CREATE INDEX idx_conversations_type ON conversations(conversation_type);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_conversations_updated_at();

-- ============================================================================
-- 2. CREATE CONVERSATION_PARTICIPANTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('participant', 'admin', 'observer')),
  joined_at TIMESTAMP DEFAULT NOW(),
  last_read_at TIMESTAMP,
  
  -- Prevent duplicate participants
  UNIQUE(conversation_id, user_id)
);

-- Indexes
CREATE INDEX idx_conv_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conv_participants_unread ON conversation_participants(user_id, last_read_at);

-- ============================================================================
-- 3. UPDATE MESSAGES TABLE
-- ============================================================================

-- Add conversation_id column (nullable for migration)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- Create index on conversation_id
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- ============================================================================
-- 4. MIGRATE EXISTING MESSAGES TO CONVERSATIONS
-- ============================================================================

DO $$
DECLARE
  msg RECORD;
  conv_id UUID;
  existing_conv_id UUID;
BEGIN
  -- Loop through all existing messages
  FOR msg IN 
    SELECT DISTINCT case_id, sender_id, recipient_id 
    FROM messages 
    WHERE conversation_id IS NULL
    ORDER BY case_id
  LOOP
    -- Check if conversation already exists between these two users
    SELECT c.id INTO existing_conv_id
    FROM conversations c
    JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE c.case_id = msg.case_id
      AND c.conversation_type = 'divorcee_to_mediator'
      AND cp1.user_id = msg.sender_id
      AND cp2.user_id = msg.recipient_id
    LIMIT 1;
    
    IF existing_conv_id IS NULL THEN
      -- Create new conversation
      INSERT INTO conversations (case_id, conversation_type, title, created_by)
      VALUES (
        msg.case_id,
        'divorcee_to_mediator',
        'Private Conversation',
        msg.sender_id
      )
      RETURNING id INTO conv_id;
      
      -- Add participants
      INSERT INTO conversation_participants (conversation_id, user_id, role)
      VALUES 
        (conv_id, msg.sender_id, 'participant'),
        (conv_id, msg.recipient_id, 'participant')
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
      
      -- Update messages
      UPDATE messages 
      SET conversation_id = conv_id 
      WHERE case_id = msg.case_id 
        AND sender_id = msg.sender_id 
        AND recipient_id = msg.recipient_id
        AND conversation_id IS NULL;
    ELSE
      -- Use existing conversation
      UPDATE messages 
      SET conversation_id = existing_conv_id
      WHERE case_id = msg.case_id 
        AND sender_id = msg.sender_id 
        AND recipient_id = msg.recipient_id
        AND conversation_id IS NULL;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration completed: existing messages migrated to conversations';
END $$;

-- ============================================================================
-- 5. MAKE CONVERSATION_ID REQUIRED
-- ============================================================================

-- Now that all messages are migrated, make conversation_id NOT NULL
ALTER TABLE messages 
ALTER COLUMN conversation_id SET NOT NULL;

-- Drop old RLS policies that depend on recipient_id
DROP POLICY IF EXISTS messages_select_policy ON messages;
DROP POLICY IF EXISTS messages_insert_policy ON messages;
DROP POLICY IF EXISTS messages_update_policy ON messages;

-- Drop old indexes that depend on recipient_id
DROP INDEX IF EXISTS idx_messages_recipient_id;
DROP INDEX IF EXISTS idx_messages_recipient_unread;

-- Drop old recipient_id column (no longer needed)
ALTER TABLE messages 
DROP COLUMN IF EXISTS recipient_id CASCADE;

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function: Get unread message count for a user across all conversations
CREATE OR REPLACE FUNCTION get_user_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM messages m
  JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
  WHERE cp.user_id = p_user_id
    AND m.sender_id != p_user_id
    AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at);
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function: Mark conversation as read for a user
CREATE OR REPLACE FUNCTION mark_conversation_read(p_conversation_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get conversation participants as array
CREATE OR REPLACE FUNCTION get_conversation_participants(p_conversation_id UUID)
RETURNS TABLE(user_id UUID, email TEXT, role TEXT, full_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.user_id,
    u.email,
    COALESCE(u.role, 'user') as role,
    COALESCE(u.first_name || ' ' || u.last_name, u.email) as full_name
  FROM conversation_participants cp
  JOIN app_users u ON cp.user_id = u.user_id
  WHERE cp.conversation_id = p_conversation_id
  ORDER BY u.email;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. CREATE AI RESPONSES AUDIT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES app_users(user_id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN (
    'ai_analysis',      -- AI's own analysis/opinion
    'web_search',       -- Tavily web search result
    'document',         -- From uploaded document
    'redirect',         -- Suggestion to ask someone else
    'dashboard_link'    -- Link to dashboard feature
  )),
  citations JSONB DEFAULT '[]',  -- Array of {source, url, title, snippet}
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  requires_verification BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_responses_message ON ai_responses(message_id);
CREATE INDEX idx_ai_responses_user ON ai_responses(user_id);
CREATE INDEX idx_ai_responses_source ON ai_responses(source_type);
CREATE INDEX idx_ai_responses_created ON ai_responses(created_at DESC);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;

-- Conversations: Can see if you're a participant or admin
CREATE POLICY conversations_select_policy ON conversations
FOR SELECT USING (
  -- User is a participant
  id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
  -- OR user is admin (but only for admin_support conversations)
  OR (
    conversation_type = 'admin_support' 
    AND EXISTS (
      SELECT 1 FROM app_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Conversations: Can create if you have access to the case
CREATE POLICY conversations_insert_policy ON conversations
FOR INSERT WITH CHECK (
  case_id IN (
    SELECT c.id FROM cases c
    LEFT JOIN case_participants cp ON c.id = cp.case_id
    WHERE c.mediator_id = auth.uid() OR cp.user_id = auth.uid()
  )
  OR conversation_type = 'admin_support'
);

-- Conversation Participants: Can see if you're in the conversation
CREATE POLICY conv_participants_select_policy ON conversation_participants
FOR SELECT USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- AI Responses: Can see your own AI responses
CREATE POLICY ai_responses_select_policy ON ai_responses
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY ai_responses_insert_policy ON ai_responses
FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 9. GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversation_participants TO authenticated;
GRANT SELECT, INSERT ON ai_responses TO authenticated;

GRANT EXECUTE ON FUNCTION get_user_unread_count TO authenticated;
GRANT EXECUTE ON FUNCTION mark_conversation_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_participants TO authenticated;

-- ============================================================================
-- 10. COMMENTS
-- ============================================================================

COMMENT ON TABLE conversations IS 'Conversation containers for case-based messaging';
COMMENT ON TABLE conversation_participants IS 'Links users to conversations they can access';
COMMENT ON TABLE ai_responses IS 'Audit trail for all AI-generated responses with citations';

COMMENT ON COLUMN conversations.conversation_type IS 'Type: divorcee_to_divorcee, divorcee_to_mediator, group, admin_support, lawyer_to_mediator';
COMMENT ON COLUMN ai_responses.source_type IS 'Source: ai_analysis, web_search, document, redirect, dashboard_link';
COMMENT ON COLUMN ai_responses.citations IS 'Array of citation objects with source, url, title, snippet';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
