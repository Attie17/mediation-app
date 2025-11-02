-- AI Chat History Table
-- Stores all AI assistant conversations so mediators can review what divorcees asked

CREATE TABLE IF NOT EXISTS ai_chat_history (
  id SERIAL PRIMARY KEY,
  case_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  -- Additional metadata from AI responses
  confidence VARCHAR(20),
  disclaimer TEXT,
  web_search_suggested BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_ai_chat_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  CONSTRAINT fk_ai_chat_user FOREIGN KEY (user_id) REFERENCES app_users(user_id) ON DELETE CASCADE
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_chat_case_id ON ai_chat_history(case_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_user_id ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_created_at ON ai_chat_history(created_at);

-- Composite index for case + timestamp (common query pattern)
CREATE INDEX IF NOT EXISTS idx_ai_chat_case_created ON ai_chat_history(case_id, created_at DESC);

COMMENT ON TABLE ai_chat_history IS 'Stores AI assistant chat conversations for mediator review';
COMMENT ON COLUMN ai_chat_history.role IS 'Either "user" (divorcee question) or "assistant" (AI response)';
COMMENT ON COLUMN ai_chat_history.web_search_suggested IS 'Whether AI suggested user do web search (indicates uncertainty)';
