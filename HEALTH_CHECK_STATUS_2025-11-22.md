# Health Check Status — November 22, 2025

This note captures how to run the existing health checks and the current results from this session.

## 1. Backend Post-Migration Sweep

- **Command**
  ```powershell
  cd c:\mediation-app
  $env:TEST_JWT="<mediator-jwt>"
  node tests/run-post-migration.cjs
  Remove-Item Env:TEST_JWT
  ```
- **What it does**: Sequentially executes `tests/test-case-participants.cjs`, `test-case-dashboard.cjs`, `test-uploads.cjs`, and `test-notifications.cjs` using the shared helper in `tests/run-post-migration.cjs`.
- **Current result (2025-11-22)**: ❌ **Failed** — every suite bailed out while checking API availability because no backend was listening on `http://localhost:4000`. Once the backend is running (or `BASE_URL` is overridden), re-run and capture the pass/fail log summary.

## 2. Communications & AI Sweep

- **Script**: `test-ai-communications.ps1`
- **Command**
  ```powershell
  cd c:\mediation-app
  powershell -ExecutionPolicy Bypass -File .\test-ai-communications.ps1
  ```
- **What it does**: Logs in as `alice@test.com`, then exercises `/api/ai/*`, `/api/conversations/*`, and `/api/ai-chat-history/*` against the Render backend (`https://mediation-app.onrender.com`).
- **Current result (2025-11-22)**: ⚪ **Not run** — requires a valid user/password plus live backend connectivity. Once creds are available, run the script and record which endpoints succeed or fail.

## Next Steps

1. Start the backend locally (or point the tests at the Render URL via env overrides) and re-run `node tests/run-post-migration.cjs` until it reports `✅ All post-migration tests passed`.
2. Obtain working credentials for `alice@test.com` (or update the script) and execute `test-ai-communications.ps1`; keep the summarized output here so we have a historical record of AI + messaging health.
