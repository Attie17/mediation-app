-- Create mediation_sessions table for scheduling mediation sessions
-- This is different from settlement_sessions which is for the settlement workflow

CREATE TABLE IF NOT EXISTS mediation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location VARCHAR(500),
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  mediator_id UUID NOT NULL,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  participants JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mediation_sessions_mediator ON mediation_sessions(mediator_id);
CREATE INDEX IF NOT EXISTS idx_mediation_sessions_case ON mediation_sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_mediation_sessions_date ON mediation_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_mediation_sessions_status ON mediation_sessions(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_mediation_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mediation_sessions_updated_at
BEFORE UPDATE ON mediation_sessions
FOR EACH ROW
EXECUTE FUNCTION update_mediation_sessions_updated_at();

-- Add comment
COMMENT ON TABLE mediation_sessions IS 'Stores scheduled mediation sessions/appointments';
