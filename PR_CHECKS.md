# ACCORD pilot PR checks

This draft introduces a workflow triggered by pull requests or manual runs. Hosted results must be observed before these checks are treated as verified on GitHub. Required-check settings remain unchanged.

## Checks

- Security and structure: fictional-data security tests; import/dependency and backend syntax checks.
- Frontend build: lockfile installation with lifecycle scripts disabled and compilation.
- Isolated acceptance: 51 tests executing SQL in memory and the real case/participant/profile/intake/safety-summary routers and JWT middleware on loopback with fictional data. See checks/acceptance/README.md.

All jobs use Windows and Node 20.20.0 to match the environment already checked locally. GitHub actions have their own runtime, separate from this application Node version. Node runtime lifecycle/upgrade review remains a separate task. Linux portability is not verified.

The verified base repository tracks environment files. This draft removes five runtime files and replaces the production backend example with placeholders. All jobs also remove direct backend/frontend .env* files from their ephemeral checkout before checks or compilation; no file contents are printed. This does not remove credentials from repository history or resolve credential exposure. See SECURITY_REVIEW.md for owner follow-up and deployment safeguards. There are no deployment, production database, migration, email or AI commands and no application secrets supplied. Acceptance tests start only the temporary loopback fixture described in checks/acceptance/README.md. Dependency downloads still access the public package registry. The offline security tests import only the dependency-free permission module. Structural checks do not execute application modules. The workflow is not a general network sandbox for arbitrary future tests.

## Local commands

From the candidate repository root, run `npm run test:security` and `npm run check:offline`. After the isolated frontend dependencies are installed, run `npm run build:frontend`.

The existing frontend component tests and database scripts are not enabled automatically. They require review and, where relevant, an isolated test environment. A passing build does not verify browser behaviour or access controls.

## Adding future repairs

Add tests for the affected permissions and failure behaviour as part of each repair. Update the test command when a new test file is added. HTTP, storage and database acceptance checks must be added after their fictional-data isolation is established. Retain expected/observed results and limitations.

## Activation and release

1. Establish the authoritative repository and reconcile this candidate with its branch history.
2. Review the changes, workflow and dependency lockfiles before pushing; omit local provenance reports, credentials and runtime data.
3. Create a PR and observe both GitHub jobs. Local success does not prove hosted success.
4. After the first hosted run, select the actual reported check names as required checks under the approved branch rules.

Required-check settings remain unchanged. Installation warnings and unresolved identity/permission issues remain open. These checks are not a production release gate on their own.
