-- Migration: Create case_children and voice_of_child tables
-- Description: Add support for children in mediation cases and capturing voice of the child

-- Create case_children table
CREATE TABLE IF NOT EXISTS case_children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    birthdate DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create voice_of_child table  
CREATE TABLE IF NOT EXISTS voice_of_child (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES case_children(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('report', 'drawing', 'interview', 'observation', 'other')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_case_children_case_id ON case_children(case_id);
CREATE INDEX IF NOT EXISTS idx_voice_of_child_case_id ON voice_of_child(case_id);
CREATE INDEX IF NOT EXISTS idx_voice_of_child_child_id ON voice_of_child(child_id);

-- Add RLS policies (if RLS is enabled)
-- Policy: Allow system to manage children records (adjust based on your auth setup)
DROP POLICY IF EXISTS "System can manage children" ON case_children;
CREATE POLICY "System can manage children" 
ON case_children FOR ALL 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "System can manage voice records" ON voice_of_child;
CREATE POLICY "System can manage voice records" 
ON voice_of_child FOR ALL 
USING (true) 
WITH CHECK (true);

-- Grant permissions (if needed)
-- GRANT ALL ON case_children TO your_service_role;
-- GRANT ALL ON voice_of_child TO your_service_role;