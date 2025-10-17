-- Migration: Create AI Insights Table and Enum
-- Purpose: Store AI-generated insights for cases (summaries, tone analysis, risk assessments)
-- Date: 2025-10-10

-- Create enum for insight types
CREATE TYPE ai_insight_type AS ENUM (
  'summary',
  'tone_analysis',
  'key_points',
  'risk_assessment',
  'rephrase_suggestion',
  'document_analysis'
);

-- Create ai_insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  insight_type ai_insight_type NOT NULL,
  
  -- Main content stored as JSONB for flexibility
  content JSONB NOT NULL,
  
  -- Metadata: source info, model used, token count, etc.
  metadata JSONB DEFAULT '{}',
  
  -- Audit trail
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Optional: track if insight was reviewed/acted upon
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_ai_insights_case_id ON ai_insights(case_id);
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX idx_ai_insights_created_at ON ai_insights(created_at DESC);
CREATE INDEX idx_ai_insights_case_type ON ai_insights(case_id, insight_type);

-- Enable Row Level Security
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view insights for their cases
CREATE POLICY "Users can view AI insights for their cases"
ON ai_insights
FOR SELECT
USING (
  case_id IN (
    SELECT case_id FROM case_participants WHERE user_id = auth.uid()
  )
);

-- Policy: Mediators and admins can create insights
CREATE POLICY "Mediators and admins can create AI insights"
ON ai_insights
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('mediator', 'admin')
  )
);

-- Policy: Creators can update their insights
CREATE POLICY "Users can update their own AI insights"
ON ai_insights
FOR UPDATE
USING (created_by = auth.uid());

-- Policy: Admins and creators can delete insights
CREATE POLICY "Users can delete their own AI insights"
ON ai_insights
FOR DELETE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Add comment
COMMENT ON TABLE ai_insights IS 'Stores AI-generated insights and analysis for mediation cases';
COMMENT ON COLUMN ai_insights.content IS 'JSONB content varies by insight_type: summary, tone analysis, key points, risk assessment, etc.';
COMMENT ON COLUMN ai_insights.metadata IS 'Stores model version, token count, processing time, source references';
