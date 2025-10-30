#!/bin/bash
# Store OpenAI API key securely in macOS Keychain
# Usage: ./scripts/store-openai-key.sh
# Reads key from clipboard and stores it in Keychain + VSCode settings

set -e

echo "📋 OpenAI API Key Secure Storage"
echo "================================"
echo ""

# Get from clipboard
CLIPBOARD_KEY=$(pbpaste)

if [[ -z "$CLIPBOARD_KEY" ]]; then
    echo "❌ Clipboard is empty. Copy your OpenAI API key first."
    exit 1
fi

# Validate it looks like an OpenAI key
if [[ ! "$CLIPBOARD_KEY" =~ ^sk-proj- ]] && [[ ! "$CLIPBOARD_KEY" =~ ^sk- ]]; then
    echo "❌ Doesn't look like an OpenAI key (should start with 'sk-' or 'sk-proj-')"
    echo "   Clipboard: ${CLIPBOARD_KEY:0:20}..."
    read -p "Store anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Found key: ${CLIPBOARD_KEY:0:20}..."
echo ""

# Store in macOS Keychain
echo "🔐 Storing in macOS Keychain..."
security add-generic-password \
    -a "vscode-rhizome" \
    -s "openai-api-key" \
    -w "$CLIPBOARD_KEY" \
    -U 2>/dev/null || \
security update-generic-password \
    -a "vscode-rhizome" \
    -s "openai-api-key" \
    -w "$CLIPBOARD_KEY" \
    -U

echo "✅ Stored in Keychain"
echo ""

# Also store in VSCode settings for convenience
VSCODE_SETTINGS="${HOME}/Library/Application Support/Code/User/settings.json"

if [ -f "$VSCODE_SETTINGS" ]; then
    echo "📝 Updating VSCode settings..."

    # Use jq to safely update JSON
    if command -v jq &> /dev/null; then
        jq --arg key "$CLIPBOARD_KEY" '.["vscode-rhizome.openai.key"] = $key' "$VSCODE_SETTINGS" > "${VSCODE_SETTINGS}.tmp" && mv "${VSCODE_SETTINGS}.tmp" "$VSCODE_SETTINGS"
        echo "✅ VSCode settings updated"
    else
        echo "⚠️  jq not found, manually add to settings.json:"
        echo '  "vscode-rhizome.openai.key": "'$CLIPBOARD_KEY'"'
    fi
else
    echo "⚠️  VSCode settings.json not found at $VSCODE_SETTINGS"
    echo "   Create it or manually add:"
    echo '  "vscode-rhizome.openai.key": "'$CLIPBOARD_KEY'"'
fi

echo ""
echo "✅ Done! Key stored securely in Keychain + VSCode"
echo "   (You can clear your clipboard now: ⌘V → ⌘X)"
