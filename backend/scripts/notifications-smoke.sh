#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-${MEDIATION_API_URL:-http://localhost:4000}}"
JWT_TOKEN="${MEDIATION_JWT:-${JWT:-}}"

usage() {
  cat <<'EOF'
Usage: MEDIATION_JWT=<token> ./notifications-smoke.sh

Environment variables:
  MEDIATION_JWT    Bearer token used to authenticate API calls. (Required)
  API_BASE_URL     Base URL for the backend API. Defaults to http://localhost:4000.

This script will:
  1. Fetch the authenticated user's notifications.
  2. Mark the newest notification as read (if one exists).
  3. Delete that same notification.

Requires: curl, jq
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ -z "${JWT_TOKEN}" ]]; then
  echo "Error: MEDIATION_JWT environment variable is not set." >&2
  echo >&2
  usage >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required but was not found in PATH." >&2
  exit 1
fi

AUTH_HEADER=("-H" "Authorization: Bearer ${JWT_TOKEN}")

echo "Using API base URL: ${API_BASE_URL}"

echo "Fetching notifications..."
RESPONSE=$(curl -sSL "${API_BASE_URL}/api/notifications" "${AUTH_HEADER[@]}")

echo "\nRaw response:"
echo "${RESPONSE}" | jq '.'

FIRST_ID=$(echo "${RESPONSE}" | jq -r 'select(.success == true) | .data[0].id // empty')

if [[ -z "${FIRST_ID}" ]]; then
  echo "\nNo notifications were returned; nothing to mark as read or delete." >&2
  exit 0
fi

echo "\nMarking notification ${FIRST_ID} as read..."
MARK_RESPONSE=$(curl -sSL -X PATCH "${API_BASE_URL}/api/notifications/${FIRST_ID}/read" "${AUTH_HEADER[@]}" -H "Content-Type: application/json" -d '{}')

echo "Response:"
echo "${MARK_RESPONSE}" | jq '.'

echo "\nDeleting notification ${FIRST_ID}..."
DELETE_RESPONSE=$(curl -sSL -X DELETE "${API_BASE_URL}/api/notifications/${FIRST_ID}" "${AUTH_HEADER[@]}")

echo "Response:"
echo "${DELETE_RESPONSE}" | jq '.'

echo "\nDone."