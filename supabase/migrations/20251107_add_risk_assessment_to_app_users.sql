-- Migration: Add risk_assessment column to app_users table
-- Purpose: Support IPV screening feature with risk scoring and process recommendations
-- Feature Branch: feature/ipv-financial-tools
-- Date: 2025-11-07

-- Add risk_assessment column to app_users table
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS risk_assessment JSONB;

-- Add GIN index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_app_users_risk_assessment 
ON app_users USING GIN (risk_assessment);

-- Add column comment for documentation
COMMENT ON COLUMN app_users.risk_assessment IS 
'JSONB object containing IPV screening results and risk scores. 
Structure: {
  safetyData: object (raw screening answers - privacy protected),
  ipvFlags: integer (0-10+ risk indicator count),
  powerImbalance: integer (0-10 power imbalance score),
  suitability: string (high_risk|moderate_risk|standard),
  recommendation: string (shuttle_mediation|adapted_mediation|standard_mediation),
  processAdaptations: array of strings (recommended process modifications),
  supportResources: array of strings (SA support organization contact info),
  assessedAt: timestamp (ISO 8601 format),
  version: string (algorithm version, currently 1.0)
}';
