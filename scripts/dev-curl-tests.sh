#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://localhost:4000}"
AUTH_BASE="$BASE/auth"
API_BASE="$BASE/api"

json() { jq . <<<"$1" 2>/dev/null || echo "$1"; }

echo "== healthz"
curl -fsS "$BASE/healthz" | json

echo "== register (direct backend /auth/register)"
REG_PAYLOAD='{"email":"alice@example.com","password":"Test12345!"}'
curl -fsS -i "$AUTH_BASE/register" -H 'Content-Type: application/json' -d "$REG_PAYLOAD" || true

echo "== profile GET (may 401 if dev headers required)"
curl -fsS -i "$API_BASE/users/me" || true

echo "== profile PUT (dev headers example)"
PUT_PAYLOAD='{"name":"Alice One","preferredName":"Alice","phone":"+27 82 000 0000"}'
# Example dev headers (uncomment and adjust UUID if needed):
# -H 'x-dev-user-id: 00000000-0000-4000-8000-000000000111' \
# -H 'x-dev-email: tester@example.com' \
# -H 'x-dev-role: divorcee' \
# -H 'Authorization: Bearer dev-fake-token'

curl -fsS -i -X PUT "$API_BASE/users/me" \
  -H 'Content-Type: application/json' \
  -H 'x-dev-user-id: 00000000-0000-4000-8000-000000000111' \
  -H 'x-dev-email: tester@example.com' \
  -H 'x-dev-role: divorcee' \
  -H 'Authorization: Bearer dev-fake-token' \
  -d "$PUT_PAYLOAD" || true

echo "✅ dev curl tests (bash) done"