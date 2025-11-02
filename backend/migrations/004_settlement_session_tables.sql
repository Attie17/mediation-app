-- Migration: Create missing settlement session related tables
-- Date: 2025-10-17
-- Purpose: Support settlement session wizard functionality

-- ================================================
-- session_form_sections
-- ================================================
CREATE TABLE IF NOT EXISTS public.session_form_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES settlement_sessions(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  form_data JSONB DEFAULT '{}'::jsonb,
  party_id UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, section_name, party_id)
);

CREATE INDEX IF NOT EXISTS idx_session_form_sections_session_id 
  ON public.session_form_sections(session_id);

COMMENT ON TABLE public.session_form_sections IS 
  'Stores form data for each section of the settlement wizard per session';

-- ================================================
-- section_approvals
-- ================================================
CREATE TABLE IF NOT EXISTS public.section_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES settlement_sessions(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  party TEXT NOT NULL, -- 'party1', 'party2', 'mediator'
  approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, section_name, party)
);

CREATE INDEX IF NOT EXISTS idx_section_approvals_session_id 
  ON public.section_approvals(session_id);

COMMENT ON TABLE public.section_approvals IS 
  'Tracks approval status for each section by each party in a settlement session';

-- ================================================
-- section_conflicts
-- ================================================
CREATE TABLE IF NOT EXISTS public.section_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES settlement_sessions(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  conflict_reason TEXT,
  party1_position TEXT,
  party2_position TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'resolved', 'escalated'
  reported_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_section_conflicts_session_id 
  ON public.section_conflicts(session_id);

CREATE INDEX IF NOT EXISTS idx_section_conflicts_status 
  ON public.section_conflicts(status);

COMMENT ON TABLE public.section_conflicts IS 
  'Records conflicts between parties on specific sections requiring mediation';

-- ================================================
-- session_chat_logs
-- ================================================
CREATE TABLE IF NOT EXISTS public.session_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES settlement_sessions(id) ON DELETE CASCADE,
  sender_id UUID,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_session_chat_logs_session_id 
  ON public.session_chat_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_session_chat_logs_timestamp 
  ON public.session_chat_logs(timestamp);

COMMENT ON TABLE public.session_chat_logs IS 
  'Chat messages within a specific settlement session';

-- ================================================
-- Enable Row Level Security (RLS)
-- ================================================
ALTER TABLE public.session_form_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_chat_logs ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS Policies (basic - refine based on requirements)
-- ================================================

-- session_form_sections: Users can read/write their own session data
CREATE POLICY "Users can view session form sections" 
  ON public.session_form_sections FOR SELECT 
  USING (true); -- Refine: check session participation

CREATE POLICY "Users can update session form sections" 
  ON public.session_form_sections FOR ALL 
  USING (true); -- Refine: check session participation

-- section_approvals: Users can view/manage approvals for their sessions
CREATE POLICY "Users can view section approvals" 
  ON public.section_approvals FOR SELECT 
  USING (true);

CREATE POLICY "Users can manage section approvals" 
  ON public.section_approvals FOR ALL 
  USING (true);

-- section_conflicts: Visible to session participants
CREATE POLICY "Users can view section conflicts" 
  ON public.section_conflicts FOR SELECT 
  USING (true);

CREATE POLICY "Users can report section conflicts" 
  ON public.section_conflicts FOR INSERT 
  WITH CHECK (true);

-- session_chat_logs: Participants can read/write
CREATE POLICY "Users can view session chat" 
  ON public.session_chat_logs FOR SELECT 
  USING (true);

CREATE POLICY "Users can send session chat messages" 
  ON public.session_chat_logs FOR INSERT 
  WITH CHECK (true);

-- ================================================
-- Grant permissions to authenticated users
-- ================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_form_sections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.section_approvals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.section_conflicts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_chat_logs TO authenticated;

-- ================================================
-- Grant permissions to service role (backend)
-- ================================================
GRANT ALL ON public.session_form_sections TO service_role;
GRANT ALL ON public.section_approvals TO service_role;
GRANT ALL ON public.section_conflicts TO service_role;
GRANT ALL ON public.session_chat_logs TO service_role;
