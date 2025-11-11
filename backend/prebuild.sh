#!/usr/bin/env bash
set -e

# Prebuild script for Render
# Currently a placeholder; add migrations or asset prep here if needed.

echo "[prebuild] Starting prebuild tasks..."

# Example: validate minimal required envs (non-fatal in build phase)
REQUIRED_VARS=(DATABASE_URL SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY JWT_SECRET)
for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "[prebuild] WARNING: $VAR not set during build (may be provided at runtime)"
  fi
done

echo "[prebuild] No migrations run at build-time."
echo "[prebuild] Prebuild complete."
#!/bin/sh
# Render pre-build script to clear corrupted cache
echo "🧹 Clearing cached node_modules..."
rm -rf /opt/render/project/src/backend/node_modules
echo "✅ Cache cleared, proceeding with fresh install"
