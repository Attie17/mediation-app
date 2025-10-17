-- Case Overview Slice Down Migration (2025-10-05)
-- Drops objects created by the up migration ONLY if they exist.

BEGIN;

-- Drop view
DROP VIEW IF EXISTS case_activity_v;

-- Drop tables (status history before events? order doesn't matter due to FKs referencing cases only)
DROP TABLE IF EXISTS case_status_history;
DROP TABLE IF EXISTS case_events;

-- NOTE: We do NOT remove added columns or constraints from cases / case_participants to avoid data loss.
-- If rollback needs to be harsher, handle manually.

COMMIT;
