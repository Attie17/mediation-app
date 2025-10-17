-- Migration: Create case_participants table
-- This table links users to cases with specific roles (mediator or divorcee)

CREATE TABLE case_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('mediator', 'divorcee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user cannot be linked twice to the same case
    UNIQUE(case_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_case_participants_case_id ON case_participants(case_id);
CREATE INDEX idx_case_participants_user_id ON case_participants(user_id);
CREATE INDEX idx_case_participants_role ON case_participants(role);

-- Insert some test data for case 4
-- First, let's add the existing test user as a participant
INSERT INTO case_participants (case_id, user_id, role) 
VALUES (4, '7f66f2e3-719e-430d-ac8b-77497ce89aec', 'divorcee')
ON CONFLICT (case_id, user_id) DO NOTHING;

-- Add a comment for documentation
COMMENT ON TABLE case_participants IS 'Links users to cases with specific roles (mediator or divorcee)';
COMMENT ON COLUMN case_participants.role IS 'Role of user in the case: mediator or divorcee';