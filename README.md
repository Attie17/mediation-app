# Mediation App

## Post-Migration Sweep

After applying the notifications migration, run the automated sweep to verify the system is healthy:

```bash
node tests/run-post-migration.cjs
```

The runner loads `DATABASE_URL` and `AUTH_TOKEN` from your `.env` file and executes the smoke suites sequentially. The notifications lifecycle test automatically reuses an existing mediator or seeds the fixed test mediator (`11111111-2222-3333-4444-555555555555`), so there’s no manual database setup required. Inspect the prefixed logs for each suite if any failures are reported.

## Environment secrets

- **Rotating secrets after exposure**
	1. In Supabase, generate a new database password (Project Settings → Database → Reset password) and update the full `DATABASE_URL` in `backend/.env`.
### Dev Auth & Stable UUID Identities

In local dev we use a fake token (`dev-fake-token`) and custom headers to simulate users:

Headers automatically sent by the frontend when using the dev token:
- `x-dev-user-id`: Stable UUID per email
- `x-dev-email`: User email
- `x-dev-role`: Role (default `divorcee`)

The frontend stores a map of email -> UUID in `localStorage: devUserUuidMap` so profile rows in `app_users` persist properly (`user_id uuid PK`). The backend middleware validates that header or deterministically derives a UUIDv5 from the email when a non-UUID is provided.

### Edge / Browser Console Noise

You may see a log similar to:
`Encountered likely duplicate host version: 1.0.226 vs 1.0.226`

This typically originates from injected browser extension scripts (e.g. Edge Copilot) or double-loaded host SDK code. If it disappears in a private window, it is benign and can be ignored. We added singleton guards (see `src/utils/singleton.ts`) to prevent double initialization inside our own code.

### Supabase Client Singleton (Frontend)

The frontend now guarantees a single Supabase client instance across Hot Module Reloads using `singleton()` in `src/utils/singleton.ts`.

Pattern:
```
export const supabase = singleton('supabase', () => {
	console.debug('[supabase] initializing client'); // dev only
	return createClient(url, anonKey, { auth: { persistSession: false } });
});
```

If you see the duplicate host version warning, ensure no other `createClient()` calls exist. Use `listSingletonKeys()` in the console to verify active instances.

### API Base & Fetch Wrapper

Frontend API calls now go through `src/lib/apiClient.js` which:
- Reads optional `VITE_API_BASE` (e.g. `http://localhost:4000`) else uses relative paths.
- Adds JSON headers, timeout & abort handling.
- Throws rich errors with `status` & `body` attached.

To use:
```
import { apiFetch } from '../lib/apiClient';
const data = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
```

Configure via `.env` / `.env.local` (see `.env.example`).

### Dev UUID Smoke Test

A PowerShell script is available at `tests/dev-uuid-smoke.ps1`:

```
powershell -ExecutionPolicy Bypass -File tests/dev-uuid-smoke.ps1 -BaseUrl http://localhost:4000
```

It performs profile create/update cycles for Alice and Bob to verify persistence.
	2. Issue a fresh JWT for the mediator test user. Either create a one-off token via the Supabase Dashboard (Auth → Users → Generate JWT) or run a local script that signs a token using `SUPABASE_JWT_SECRET`, then paste it into `AUTH_TOKEN`.
	3. Redeploy or restart any services/processes that depend on these values so they read the new secrets.
	4. Invalidate or delete the old credentials/tokens in Supabase to ensure they can no longer be used.

## Admin role management (local testing)

- Backend exposes admin-only endpoints:
	- GET /api/users (list users)
	- GET /api/users/self (current user profile)
	- PATCH /api/users/:id/role { role: 'admin' | 'mediator' | 'lawyer' | 'divorcee' }
- All endpoints require a valid Authorization header using a Supabase JWT signed with your SUPABASE_JWT_SECRET. Only tokens with role 'admin' may change roles.
- For quick local tests, obtain a token with the included `get-jwt.ps1` script or from the Supabase dashboard, then paste it into `localStorage` under key `token` in your browser.
- Frontend page `/#/admin/roles` (or navigate to /admin/roles within the app) provides a simple UI to view users and change roles when authorized.
