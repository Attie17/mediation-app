# Self-service profile authority repair

Audit: 10 October 2026, Attie17/mediation-app, branch
codex/pilot-checks-2026-10-10, reviewed parent
a462329cc0164b313547e389146a2d78dfb6d84e.

POST /api/users/profile previously accepted admin, mediator and lawyer as editable
profile values and persisted them to app_users.role. GET /api/users/me could create
a missing profile using a token's privileged role. This undermined consumers that
correctly read authority from the database.

Self-service updates now reject a requested role different from the current role,
before saving any profile fields. Existing clients may echo their current role.
The update never writes role. Missing profiles are always created as divorcee,
without an organisation assignment, regardless of token role. Existing authorised
roles survive edits. No role administration endpoint or production data is changed.

Acceptance criteria: no self-service elevation or demotion; no privileged creation;
ordinary intake still saves; existing roles and organisations remain unchanged.
Eight real-router SQL/HTTP regressions pass against fictional in-memory data.
The acceptance suite totals 41 passing tests; nine security tests also pass (50
total), and 1,088 import references/63 syntax checks pass. No frontend code changed.

Limits: this repair does not audit or certify the dedicated administration routes,
live identity configuration, deployed constraints, historical role assignments,
full browser journey, booking or private safety-data access. Existing historical
roles are preserved, not assumed legitimate. Review before release is required.

Rollback: revert this isolated commit in the draft branch. No schema migration or
data conversion is involved. Reverting would restore the vulnerable self-service
behaviour and should not be released without an alternative repair.
