-- Settlement Sessions Migration
-- Creates tables for divorce settlement wizard functionality

-- Main settlement sessions table
CREATE TABLE settlement_sessions (
    id TEXT PRIMARY KEY, -- Format: DW-XXXXXXXX
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('individual', 'collaborative')),
    party1_name TEXT NOT NULL,
    party2_name TEXT,
    mediator_name TEXT,
    case_reference TEXT,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    current_party VARCHAR(10) NOT NULL CHECK (current_party IN ('party1', 'party2')) DEFAULT 'party1',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Form sections data storage
CREATE TABLE settlement_form_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT REFERENCES settlement_sessions(id) ON DELETE CASCADE,
    section_name VARCHAR(50) NOT NULL, -- 'annexure-a', 'annexure-b', 'annexure-c'
    form_data JSONB NOT NULL DEFAULT '{}',
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, section_name)
);

-- Approval tracking for each section and party
CREATE TABLE settlement_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT REFERENCES settlement_sessions(id) ON DELETE CASCADE,
    section_name VARCHAR(50) NOT NULL,
    party VARCHAR(10) NOT NULL CHECK (party IN ('party1', 'party2')),
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, section_name, party)
);

-- Conflict/disagreement tracking
CREATE TABLE settlement_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT REFERENCES settlement_sessions(id) ON DELETE CASCADE,
    section_name VARCHAR(50) NOT NULL,
    conflict_reason TEXT NOT NULL,
    party1_position TEXT,
    party2_position TEXT,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolution_notes TEXT,
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI chat logs for settlement sessions
CREATE TABLE settlement_chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT REFERENCES settlement_sessions(id) ON DELETE CASCADE,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('party1', 'party2', 'mediator', 'system')),
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'assistant', 'system')) DEFAULT 'user',
    message TEXT NOT NULL,
    context_data JSONB,
    sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_settlement_sessions_created_by ON settlement_sessions(created_by);
CREATE INDEX idx_settlement_sessions_case_id ON settlement_sessions(case_id);
CREATE INDEX idx_settlement_sessions_status ON settlement_sessions(status);

CREATE INDEX idx_settlement_form_sections_session_id ON settlement_form_sections(session_id);
CREATE INDEX idx_settlement_form_sections_section_name ON settlement_form_sections(session_id, section_name);

CREATE INDEX idx_settlement_approvals_session_id ON settlement_approvals(session_id);
CREATE INDEX idx_settlement_approvals_section ON settlement_approvals(session_id, section_name);

CREATE INDEX idx_settlement_conflicts_session_id ON settlement_conflicts(session_id);
CREATE INDEX idx_settlement_conflicts_resolved ON settlement_conflicts(resolved);

CREATE INDEX idx_settlement_chat_logs_session_id ON settlement_chat_logs(session_id);
CREATE INDEX idx_settlement_chat_logs_created_at ON settlement_chat_logs(created_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_settlement_sessions_updated_at 
    BEFORE UPDATE ON settlement_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlement_form_sections_updated_at 
    BEFORE UPDATE ON settlement_form_sections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlement_approvals_updated_at 
    BEFORE UPDATE ON settlement_approvals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlement_conflicts_updated_at 
    BEFORE UPDATE ON settlement_conflicts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO settlement_sessions (id, mode, party1_name, party2_name, mediator_name, case_reference, created_by) 
VALUES 
    ('DW-SAMPLE01', 'collaborative', 'John Doe', 'Jane Doe', 'Mediator Smith', 'TEST-2025-001', 
     (SELECT id FROM users WHERE role = 'divorcee' LIMIT 1)),
    ('DW-SAMPLE02', 'individual', 'Bob Johnson', 'Alice Johnson', NULL, 'TEST-2025-002', 
     (SELECT id FROM users WHERE role = 'divorcee' LIMIT 1));

-- Insert sample form data
INSERT INTO settlement_form_sections (session_id, section_name, form_data)
VALUES 
    ('DW-SAMPLE01', 'annexure-a', '{"children": [{"name": "Emma Doe", "age": 8}], "primaryResidence": "mother"}'),
    ('DW-SAMPLE01', 'annexure-b', '{"childMaintenance": {"amount": 5000, "dueDay": 1}}');

-- Insert sample approvals
INSERT INTO settlement_approvals (session_id, section_name, party, approved)
VALUES 
    ('DW-SAMPLE01', 'annexure-a', 'party1', true),
    ('DW-SAMPLE01', 'annexure-a', 'party2', false);

COMMENT ON TABLE settlement_sessions IS 'Divorce settlement wizard sessions for collaborative form completion';
COMMENT ON TABLE settlement_form_sections IS 'Form data for each section (annexures) of the settlement';
COMMENT ON TABLE settlement_approvals IS 'Party approval status for each form section';
COMMENT ON TABLE settlement_conflicts IS 'Disagreements and conflicts between parties';
COMMENT ON TABLE settlement_chat_logs IS 'AI chat assistance logs for settlement sessions';