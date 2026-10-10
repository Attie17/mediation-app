# Isolated SQL and HTTP acceptance

Audit date: 10 October 2026. Initial tested application commit:
834b8252c2456e3bd0a7b1ed32b8b34871fafc41 on codex/pilot-checks-2026-10-10,
Attie17/mediation-app. This increment adds tests, not a runtime permission repair.

Install: npm ci --ignore-scripts --no-audit --no-fund in this directory.
Run: npm test, or npm run test:acceptance from the repository root.
Local restricted environments may need permission for loopback HTTP traffic.

PGlite runs actual PostgreSQL in memory. Fictional UUIDs and example.invalid
addresses are created and discarded; no production connection string is used.
A module loader replaces the case router's db.js import with this database.
It permits only the case router, JWT middleware and permission helper from the
application. No index.js, environment loader, provider client or old test script
is loaded. Authentication uses fictional signing keys, production mode, and no
pre-populated req.user. The temporary HTTP server binds only 127.0.0.1 on a random
port, then closes. This is an integration fixture, not the full application.

Ten tests cover SQL identifier resolution, organisation separation, inactive
membership, assigned mediators, administrator denial, malformed input, JWT
rejection, denied requests before content queries, successful overview/activity,
and missing schema fields. The events endpoint remains an empty response stub.

## Confirmed compatibility limits

- create-case-participants.sql and 20251005_case_overview.up.sql do not supply a
  participant status column. 02b_case_participants_fk_fix.sql establishes the UUID
  case relationship. Without explicit active status the current helper denies
  legacy participants, including valid fictional users. This is deliberate denial,
  not proof of a complete lifecycle/consent model.
- 001-create-organizations-schema.sql adds organisation IDs and case_assignments.
  A mediator assignment in that table alone is not recognised by the current
  cases.mediator_id predicate. The fixture demonstrates the denial. The deployed
  database layout has not been inspected and must not be inferred from migrations.
- With JWT_SECRET configured but SUPABASE_JWT_SECRET absent, an invalid JWT yields
  500 rather than 401. It still denies access and performs no SQL. This existing
  configuration-dependent response is recorded, not silently changed.

Recommended next decision: verify authoritative schema metadata and approve the
participant lifecycle and mediator-assignment source before adapting runtime
queries. Do not infer active membership from a row's existence or auto-backfill
consent. No production migration or schema change is included here.

Not covered: full middleware/routing order, registration HTTP route, browser UI,
storage policies, Supabase verification service, RLS, deployed schema, database
pooling, invitations, recovery, private spouse disclosures or wider case endpoints.
The fixture models selected table shapes; it does not execute all historical
migrations or certify production readiness.
