# Installing vscode-rhizome

## Quick Start

1. **Download** `vscode-rhizome-0.0.1.vsix`
2. **Install** in VSCode
3. **Configure** OpenAI key
4. **Start using** red pen reviews

---

## Prerequisites

Before installing the extension, make sure you have:

### 1. VSCode 1.85 or newer
```bash
code --version
```

### 2. Rhizome CLI installed
```bash
which rhizome
```

If not installed, follow the rhizome installation guide.

### 3. OpenAI API Key
You'll need an OpenAI API key. Get one at: https://platform.openai.com/api/keys

---

## Installation Methods

### Method 1: Command Line (Recommended)

Download the `.vsix` file, then:

```bash
code --install-extension ~/Downloads/vscode-rhizome-0.0.1.vsix
```

(Replace path with wherever you saved the file)

### Method 2: VSCode UI

1. Open VSCode
2. Go to **Extensions** (Ctrl+Shift+X / Cmd+Shift+X)
3. Click the **⋯ menu** (top right of Extensions panel)
4. Select **"Install from VSIX..."**
5. Choose the `vscode-rhizome-0.0.1.vsix` file
6. Click "Install"

### Method 3: Drag & Drop

Some versions of VSCode support dragging the `.vsix` file directly into the Extensions panel.

---

## Configuration

Once installed, you need to set your OpenAI API key.

### In VSCode Settings:

1. Open Settings (Cmd+, / Ctrl+,)
2. Search for `vscode-rhizome`
3. Find the **OpenAI Key** setting
4. Paste your API key

Or edit `settings.json` directly:

```json
{
  "vscode-rhizome.openai.key": "sk-..."
}
```

---

## Verify Installation

1. Open any code file in VSCode
2. **Select some code**
3. **Right-click** and look for these options:
   - "Ask a persona"
   - "Red Pen Review (don-socratic)"
4. **Or** right-click a file in Explorer → "Red Pen Review (entire file)"

If you see these commands, you're good to go!

---

## Using Red Pen Review

### Review Selected Code

1. Select code in editor
2. Right-click → **"Red Pen Review (don-socratic)"**
3. Wait for the don-socratic persona to respond in the output panel
4. Read feedback and questions

### Review Entire File

1. Right-click a file in the Explorer panel
2. Select **"Red Pen Review (entire file)"**
3. Get review of the whole file from don-socratic

---

## Troubleshooting

### "Rhizome CLI not found"
Make sure rhizome is installed and in your PATH:
```bash
which rhizome
echo $PATH
```

### "OpenAI key not configured"
1. Check Settings → vscode-rhizome
2. Verify the key is set
3. Make sure it's a valid key (starts with `sk-`)

### "Command not found: Ask a persona"
Try:
1. Reload VSCode (Cmd+R / Ctrl+Shift+F5)
2. Select some code and right-click
3. If still not there, reinstall the extension

### "Timeout waiting for response"
Check:
1. Your internet connection
2. Your OpenAI API key is valid
3. Your API account has credits remaining

---

## Updating the Extension

When a new version is available:

1. Download the new `.vsix` file
2. Run: `code --install-extension vscode-rhizome-X.X.X.vsix`
3. VSCode will replace the old version

Or uninstall first:
```bash
code --uninstall-extension rhizome.vscode-rhizome
code --install-extension vscode-rhizome-0.0.1.vsix
```

---

## Getting Help

If something doesn't work:

1. Check the Output panel in VSCode (View → Output, select "vscode-rhizome")
2. Look for error messages
3. Verify prerequisites above
4. Contact your team lead with the output

---

## What This Extension Does

**Red Pen Review** — Get critical feedback on your code from the don-socratic persona:
- Select code → right-click → red pen review
- Get questions about assumptions, edge cases, error handling
- Receive guidance on clarity and design

**Ask a Persona** — Ask any rhizome persona a question about your code

---

## Technical Details

- **Version:** 0.0.1
- **Publisher:** rhizome
- **Size:** 72 KB
- **License:** See LICENSE in repo
- **Requires:** VSCode 1.85+, rhizome CLI, OpenAI API key

---

**Ready?** Download the `.vsix` file and follow the installation steps above. 🚀
