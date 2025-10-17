-- Migration: Add indexes for case overview queries
-- Date: 2025-10-09
-- Purpose: Optimize GET /api/cases/:id/activity and document summary queries

-- Index for uploads by case_id and created_at (activity feed)
CREATE INDEX IF NOT EXISTS uploads_case_created_idx 
ON public.uploads(case_id, created_at DESC);

-- Index for case_participants by case_id (participant list)
CREATE INDEX IF NOT EXISTS case_participants_case_idx 
ON public.case_participants(case_id);

COMMENT ON INDEX uploads_case_created_idx IS 'Optimizes activity feed queries for uploads';
COMMENT ON INDEX case_participants_case_idx IS 'Optimizes participant list queries';
