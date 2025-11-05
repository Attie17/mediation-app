#!/bin/sh
# Render pre-build script to clear corrupted cache
echo "🧹 Clearing cached node_modules..."
rm -rf /opt/render/project/src/backend/node_modules
echo "✅ Cache cleared, proceeding with fresh install"
