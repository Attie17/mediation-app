# Pilot review security and publication controls

Audit: 10 October 2026; Attie17/mediation-app; base branch render-deployment;
base commit b19847373b5c80ffb6f2d4452e4a8f30b00d9d74.

This draft removes five tracked runtime environment files and replaces the
production backend example with placeholders. The public base revision includes
password-bearing database connection strings. A frontend token's claimed role
cannot be classified confidently. No credential has been tested against a
service, displayed in the review record, or copied into new code.

Deleting current files does not erase Git history or revoke credentials. Before
release, the owner must identify whether any exposed credentials are live and
rotate/revoke affected values through the appropriate provider. That may affect
production and requires separate authorisation. History rewriting is also a
separate operation. This draft does neither.

Vercel automatic deployment is disabled for codex/pilot-checks-2026-10-10 in
both root and frontend configuration. Other branch defaults are preserved.
Render Blueprint preview generation is explicitly off. The draft PR title must
retain [skip render], which suppresses individual Render PR previews. Its commit
also retains [skip render] to suppress Render auto-deployment. Do not remove these
markers without separately approving a deployment and isolated runtime settings.

CI uses no application secrets and connects to no production database or
AI provider. It removes inherited environment files from each ephemeral runner
before checking or compiling. The isolated acceptance job starts a temporary
loopback-only router with an in-memory PostgreSQL fixture and fictional keys.
The first security/build hosted jobs passed; hosted acceptance remains pending.

These changes are a review candidate, not a production security certification.
Legacy login, full-app/deployed-database integration, storage permissions, invitations,
account recovery, and wider case authorisation remain to be verified. Public
legacy registration intentionally returns 503 while a verified identity flow is
pending. Missing organisation/membership metadata denies case access.
