#!/usr/bin/env bash
set -euo pipefail
BASE="http://localhost:4000"
TOKEN="${TEST_JWT:-REPLACE_ME}"
curl -fsS -H "Authorization: Bearer $TOKEN" "$BASE/api/users/me" | jq . || { echo 'GET /me failed'; exit 1; }
curl -fsS -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test User","preferredName":"TU","phone":"+27 82 000 0000","address":{"line1":"1 Test St","city":"CT","postalCode":"8001"}}' \
  "$BASE/api/users/me" | jq . || { echo 'PUT /me failed'; exit 1; }
echo "✅ profile endpoints ok"