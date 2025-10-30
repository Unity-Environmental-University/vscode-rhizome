#!/bin/bash

# Dev workflow: Build, uninstall, reinstall extension
# Usage: ./scripts/dev.sh

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "🔨 Building extension..."
npm run vscode:prepublish

echo "📦 Uninstalling old extension..."
code --uninstall-extension rhizome.vscode-rhizome 2>/dev/null || echo "  (not installed yet, skipping)"

echo "📥 Installing new extension..."
code --install-extension "$REPO_ROOT/vscode-rhizome-0.0.1.vsix"

echo ""
echo "✅ Done. Extension installed."
echo ""
echo "Next steps:"
echo "  1. Restart VSCode (Cmd+R or Cmd+Shift+P → Developer: Reload Window)"
echo "  2. Test: Select code → Right-click → Red Pen Review"
