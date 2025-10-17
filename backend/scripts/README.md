# Database Utility Scripts

These scripts help you seed and clean up test data in the Supabase Postgres database used by the backend. Both scripts read the `DATABASE_URL` value from `backend/.env`, so make sure that file is populated before running them.

## Apply Migrations

Use the Node runner to execute a SQL migration against the database defined in `backend/.env`:

```bash
node scripts/apply-migration.js migrations/20250926_add_status_to_notifications.sql
```

To roll back the change, run the corresponding down file with the same script:

```bash
node scripts/apply-migration.js migrations/20250926_add_status_to_notifications_down.sql
```

The script loads `DATABASE_URL`, invokes `psql`, and prints a ✅ on success or ❌ on failure.

## Seeding health check and test data

```bash
node db-health-and-seed.cjs
```

This script:
- Verifies the database connection and prints server metadata.
- Checks that the `cases`, `app_users`, and `case_participants` tables exist, logging their row counts.
- Ensures test records exist for case **4**, Alice (mediator), and Bob (divorcee) using idempotent inserts.
- Lists all participants for case 4 after seeding.

## Cleaning up case 4 test data

```bash
node db-cleanup-case4.cjs
```

This script:
- Connects to the database using the same `DATABASE_URL`.
- Deletes the case 4 participants, Alice, Bob, and the case itself.
- Verifies that the records are gone, logging any leftovers with a warning.

Both scripts are safe to rerun—seed uses `ON CONFLICT DO NOTHING`, and cleanup simply reports if nothing matched.

## Notifications Smoke Tests

These utilities let you seed a predictable notification, run the automated lifecycle test, and clean up afterwards. They assume the backend API is reachable at `http://localhost:4000` unless overridden via `API_BASE_URL` (or `MEDIATION_API_URL`).

### Prerequisites

- `backend/.env` must define `DATABASE_URL`, `TEST_USER_ID`, `AUTH_TOKEN`, and optionally `BASE_URL` (defaults to `http://localhost:4000`).
- The `TEST_USER_ID` user should belong to at least one case so the seed script can associate the notification. Otherwise it falls back to the most recently updated case in the database.

### 1. Seed the test notification

```bash
psql "$DATABASE_URL" \
	-v TEST_USER_ID="$TEST_USER_ID" \
	-f scripts/seed-notification.sql
```

```powershell
psql $env:DATABASE_URL `
	-v TEST_USER_ID=$env:TEST_USER_ID `
	-f scripts/seed-notification.sql
```

The script ensures the enum contains the `info` type, then inserts a notification with the message **"Test notification lifecycle"** for the supplied user.

### 2. Run the Node smoke test

```bash
node tests/smoke-notifications.cjs
```

The runner will:
- GET `/api/notifications` and confirm at least one message matches `"Test notification lifecycle"`.
- PATCH `/api/notifications/:id/read` for that record.
- DELETE the same notification.
- GET notifications again and verify no matching messages remain.

Each step prints `✅` or `❌` and exits non-zero on failure.

### 3. Clean up notifications

```bash
psql "$DATABASE_URL" \
	-v TEST_USER_ID="$TEST_USER_ID" \
	-f scripts/cleanup-notifications.sql
```

```powershell
psql $env:DATABASE_URL `
	-v TEST_USER_ID=$env:TEST_USER_ID `
	-f scripts/cleanup-notifications.sql
```

This removes all notifications for the test user and prints the deleted rows.

### Curl helpers

If you need one-off checks, substitute your JWT token and notification id in the examples below.

#### Bash

```bash
curl -H "Authorization: Bearer $AUTH_TOKEN" \
	"${API_BASE_URL:-http://localhost:4000}/api/notifications"

curl -X PATCH \
	-H "Authorization: Bearer $AUTH_TOKEN" \
	-H "Content-Type: application/json" \
	"${API_BASE_URL:-http://localhost:4000}/api/notifications/$NOTIFICATION_ID/read" \
	-d '{}'

curl -X DELETE \
	-H "Authorization: Bearer $AUTH_TOKEN" \
	"${API_BASE_URL:-http://localhost:4000}/api/notifications/$NOTIFICATION_ID"
```

#### PowerShell

```powershell
$baseUrl = if ($env:API_BASE_URL) { $env:API_BASE_URL } else { 'http://localhost:4000' }

curl.exe -H "Authorization: Bearer $env:AUTH_TOKEN" `
	"$baseUrl/api/notifications"

curl.exe -X PATCH `
	-H "Authorization: Bearer $env:AUTH_TOKEN" `
	-H "Content-Type: application/json" `
	"$baseUrl/api/notifications/$env:NOTIFICATION_ID/read" `
	-d '{}'

curl.exe -X DELETE `
	-H "Authorization: Bearer $env:AUTH_TOKEN" `
	"$baseUrl/api/notifications/$env:NOTIFICATION_ID"
```

> Both curl sets require the authenticated user to own the notification id you operate on.

### Bash + PowerShell smoke helpers

Prefer a scripted experience? Run the platform-specific wrappers which internally call the same endpoints:

```bash
MEDIATION_JWT=$AUTH_TOKEN ./notifications-smoke.sh
```

```powershell
MEDIATION_JWT=$env:AUTH_TOKEN .\notifications-smoke.ps1
```

They fetch, mark-as-read, and delete the newest notification while echoing each JSON response.
