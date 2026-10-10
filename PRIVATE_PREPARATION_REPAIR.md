# Private preparation boundary repair

Audit: 10 October 2026, Attie17/mediation-app, branch
codex/pilot-checks-2026-10-10, reviewed parent
722da8672cd81c39055211188541dae9356029c1.

The legacy /intake API accepted caller-provided user IDs without authentication.
Its health endpoint returned a profile and its test endpoint wrote demonstration
answers. The other-user safety-summary endpoint accepted broad token roles without
checking practice or current mediator assignment.

Intake now authenticates every endpoint and derives write ownership from the token.
Read/write access requires the owner's existing divorcee profile with a practice.
Other spouses, mediators and administrators cannot access the raw legacy answers.
Health returns only a success marker (not a database health check); test writes
return 405. Missing schema returns 503 and never fabricates a successful save.
The existing legacy form now uses the established authenticated API wrapper and
omits a client user ID. Answer structure and normal response shape are preserved.

Safety summaries require a database mediator role, current named case assignment,
same-practice mediator/target/case and explicit active divorcee membership. The
single scoped query avoids a separate authorisation/read race. The existing
redacted summary remains; raw safety answers are not returned by this endpoint.
There is no broad administrator exception. Risk scoring is unchanged and is not
validated as a clinical or legal suitability determination by these tests.

Acceptance: ten new real-router SQL/HTTP regressions pass with fictional in-memory
data, including normal saving, denial and summary redaction. Total isolated tests:
51, plus nine security regressions (60 total). Structural checks pass for 1,091
references and 63 syntax checks; frontend compilation passes for 1,891 modules.
No real client, database, provider or AI endpoint is used.

Remaining pilot blockers found in the review: dashboard has permissive missing
membership fallbacks; document/requirement paths need scope and identifier review;
booking creation lacks server-side mediator/case/readiness gates; document progress
is not a mediator suitability/consent decision. Full browser routing, deployed
schema/privileges, profile-contained safety answers and storage/disclosure policy
still require review. This increment does not certify all private preparation.

Rollback: revert this isolated commit; no migration or data transformation occurs.
Reversion restores the vulnerable boundaries and is unsuitable for release without
an alternative repair. Original app, references and production remain untouched.
