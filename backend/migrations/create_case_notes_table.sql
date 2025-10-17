-- Migration: Create case_notes table

CREATE TABLE IF NOT EXISTS case_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id BIGINT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES app_users(id),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_notes_case_id_created_at ON case_notes(case_id, created_at DESC);
