# Isolated SQL and HTTP acceptance

Audit date: 10 October 2026. Initial tested application commit:
834b8252c2456e3bd0a7b1ed32b8b34871fafc41 on codex/pilot-checks-2026-10-10,
Attie17/mediation-app. This increment adds tests, not a runtime permission repair.

Install: npm ci --ignore-scripts --no-audit --no-fund in this directory.
Run: npm test, or npm run test:acceptance from the repository root.
Local restricted environments may need permission for loopback HTTP traffic.

PGlite runs actual PostgreSQL in memory. Fictional UUIDs and example.invalid
addresses are created and discarded; no production connection string is used.
A module loader replaces db.js with this database, Supabase with a local SQL-backed
fixture, and notifications with an in-memory recorder. It permits the case,
participant, profile, intake, safety-summary and overview routers, JWT middleware, permission helpers and transaction
utility. No index.js, environment loader, provider SDK or old test script is loaded.
Authentication uses fictional signing keys, production mode, and no
pre-populated req.user. The temporary HTTP server binds only 127.0.0.1 on a random
port, then closes. This is an integration fixture, not the full application.

Fifty-one tests cover SQL identifier resolution, organisation separation, inactive
membership, assigned mediators, administrator denial, malformed input, JWT
rejection, denied requests before content queries, successful overview/activity,
and missing schema fields, both participant APIs, explicit activation, revocation,
same-practice verified targets, atomic case creation/rollback and reopening.
Eight profile regressions also cover privileged role rejection, safe profile creation,
ordinary intake updates, preserved existing authority and forged role claims.
Ten preparation regressions cover owner-only intake, anonymous denial, disabled
demo writes, invalid answers, missing schema, assigned-mediator summary access,
redaction, revoked membership, practice separation and authoritative mediator role.
The events endpoint remains an empty response stub.

## Confirmed compatibility limits

- create-case-participants.sql and 20251005_case_overview.up.sql do not supply a
  participant status column. 02b_case_participants_fk_fix.sql establishes the UUID
  case relationship. Without explicit active status the current helper denies
  legacy participants, including valid fictional users. This is deliberate denial,
  not proof of a complete lifecycle/consent model.
- 001-create-organizations-schema.sql adds organisation IDs and case_assignments.
  Normal assignment/reassignment already mirrors the active assignment into
  cases.mediator_id transactionally. A table-only fixture represents inconsistent
  or legacy data and remains denied; it does not demonstrate failure of normal assignment. The deployed
  database layout has not been inspected and must not be inferred from migrations.
- With JWT_SECRET configured but SUPABASE_JWT_SECRET absent, an invalid JWT yields
  500 rather than 401. It still denies access and performs no SQL. This existing
  configuration-dependent response is recorded, not silently changed.

The founder approved the membership repair. Both participant APIs now deny missing
status, require current assigned-mediator authority for writes, use verified existing
targets and retain removed membership. Reopening retains revocation. Case creation
records the server-derived practice and invited membership atomically. See
MEMBERSHIP_REPAIR.md. participant-status.sql is a test-only schema candidate, not an
automatic production migration. Deployed schema evidence is still required.

Not covered: full application middleware/routing order, registration HTTP route, browser UI,
storage policies, Supabase verification service, RLS, deployed schema, database
pooling/concurrency, delivery of invitation emails, recovery, private spouse disclosures or wider case endpoints.
The fixture models selected table shapes; it does not execute all historical
migrations or certify production readiness.
