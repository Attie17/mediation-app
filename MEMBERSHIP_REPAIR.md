# Approved membership repair — review candidate

Audit: 10 October 2026, Attie17/mediation-app, codex/pilot-checks-2026-10-10.
Previous head: 19c5ae76a4e55b329c16a830e8f9296e27a1fb2a. Founder explicitly
approved implementation in the draft PR with fictional tests and no production changes.

Both participant route families now use the shared case/organisation scope.
Missing or null membership status is denied; read responses represent it as null.
Membership writes require the server-side mediator role and current case assignment,
checked again while case/profile rows are locked in the write transaction.
Active mediator membership alone and claimed JWT roles do not grant this authority.

Invitations require an existing profile in the same practice, matching role and a
confirmed matching email in auth.users. They neither create identity records nor
overwrite global profile roles. Both spouse and mediator invitations start invited.
Existing memberships return conflict; old removed rows are not reactivated by invite.
Acceptance is limited to the verified spouse's own current invited/active record;
removed/unknown membership cannot self-activate. Explicit mediator activation checks
the target identity and practice before persisting active status.

Updates validate roles/statuses. Removal is scoped to case and user, preserves the
row as removed, and the legacy hard-delete path is disabled. Revoking the currently
assigned mediator must use the assignment workflow so its case pointer is handled.
Reopening checks a server-side administrator in the same practice within a transaction
and does not modify membership. New cases derive practice from verified identity and
atomically insert their initial invited membership; insert failure rolls both back.

The existing participant component now calls the mounted /api/cases API and accepts
both existing list response shapes. Unknown membership displays pending review rather
than active. Existing page layout is retained. Membership is separate from informed
mediation consent, suitability and permission to disclose private preparation.

Local validation: nine original regression tests plus 33 in-memory SQL/HTTP tests
pass (42 total); 1,088 import references and 63 backend syntax checks pass; frontend
compilation passes (1,891 modules). Existing dependency/bundle warnings remain.
Tests use real selected routers with provider/notification fixtures; they do not
start the full application or contact a live database, identity provider or AI service.

The SQL candidate in checks/acceptance/participant-status.sql is tested in memory,
not installed in the runtime migration folder. It adds nullable status with no active
default/backfill and constrains new values. Missing runtime schema fails closed.
Confirm deployed schema, updated_at columns, constraints, auth metadata and privileges
before finalising a migration. No real schema or memberships have been inspected or
changed. Keep historical unknown statuses denied until explicitly reviewed.

Rollback: revert the application increment on the review branch if acceptance fails.
No production rollback is needed because this increment has not been deployed.
Any later production plan must preserve explicit membership evidence rather than
dropping the status column or automatically restoring removed rows.

Limits: full routing/middleware order, browser interaction, native PostgreSQL pooling/
concurrency, storage/RLS, real identity verification, invitation delivery/recovery and
wider endpoints are not certified. Legacy registration remains disabled; events are
a stub. Historical credential exposure remains a separate release blocker. Downstream
case requirements, children, upload links and conversations are outside the atomic
case/membership transaction; their broader workflow remains a separate acceptance task.
