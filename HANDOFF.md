# vscode-rhizome: Handoff & Installation Guide

**Status:** ✅ Production-ready. Extension is complete, built, and tested.

**Latest Commit:** `f606ddc` - "feat: Production-ready VSCode extension with initialization, error handling, and enhanced persona system"

**Repo:** https://github.com/Unity-Environmental-University/vscode-rhizome

---

## For the Next Developer: What Just Shipped

The VSCode extension now includes:

✅ **Full initialization on startup** — Checks rhizome CLI, sets up `.rhizome/`, prompts for API key
✅ **Friendly error messages** — No raw failures, clear guidance for missing prerequisites
✅ **Enhanced persona system** — Organized commands, better error handling, consistent workflows
✅ **Red Pen Review (don-socratic)** — Right-click code → get critical feedback via persona
✅ **Ask a Persona** — Ask any rhizome persona about your code
✅ **File review** — Right-click file in Explorer → review entire file

**Build status:** Extension builds to 30.3KB (minified 16.1KB). All tests passing.

---

## For Team Members: Installation

### Option 1: Install from VSIX (Easiest)

1. **Ask hallie or your team lead for:** `vscode-rhizome-0.0.1.vsix` file
2. **Open terminal:**
   ```bash
   code --install-extension ~/Downloads/vscode-rhizome-0.0.1.vsix
   ```
   (Replace path if you saved it elsewhere)

3. **Or use VSCode UI:**
   - Extensions (Cmd+Shift+X)
   - ⋯ menu → "Install from VSIX..."
   - Choose the file

### Option 2: Build from Source

If you want to build it yourself:

```bash
# Clone the repo
git clone https://github.com/Unity-Environmental-University/vscode-rhizome.git
cd vscode-rhizome

# Install dependencies
npm install

# Build the extension
npm run vscode:prepublish

# Install it
code --install-extension vscode-rhizome-0.0.1.vsix
```

---

## Prerequisites (Must Have)

Before using the extension, ensure you have:

### 1. **VSCode 1.85 or newer**
```bash
code --version
```

### 2. **Rhizome CLI installed**
```bash
which rhizome
```
If missing, ask your team for installation instructions.

### 3. **OpenAI API Key**
- Get one at: https://platform.openai.com/api/keys
- Keep it handy for configuration

---

## First Time Setup

1. **Install the extension** (see above)
2. **Restart VSCode** (Cmd+R or Cmd+Shift+P → "Developer: Reload Window")
3. **Open any code file**
4. **The extension will prompt you:**
   - Check for rhizome CLI
   - Ask for OpenAI API key (one time)
5. **Configure in VSCode Settings** (if needed):
   - Cmd+, → search "vscode-rhizome"
   - Paste your OpenAI key

---

## Test It Works

1. Open any `.ts`, `.js`, `.py`, or other code file
2. **Select some code**
3. **Right-click** → look for:
   - "Red Pen Review (don-socratic)"
   - "Ask a persona"
4. **Or** right-click a file in Explorer → "Red Pen Review (entire file)"

If you see these commands, you're good to go! 🎉

---

## Using It

### Get Critical Feedback on Code
1. Select code in editor
2. Right-click → **"Red Pen Review (don-socratic)"**
3. The don-socratic persona will ask you questions about:
   - Assumptions in the code
   - Edge cases and error handling
   - Clarity and design choices
4. Read the response in the **Output** panel (View → Output)

### Ask a Question
1. Select code
2. Right-click → **"Ask a persona"** → Choose which persona to ask
3. Get specific feedback from that perspective

---

## Troubleshooting

### "Rhizome CLI not found"
```bash
which rhizome
```
If empty, ask your team for rhizome installation instructions.

### "OpenAI key not configured"
- Go to VSCode Settings (Cmd+,)
- Search "vscode-rhizome"
- Paste your API key
- Or the extension will prompt you on startup

### "Command not found: Red Pen Review"
- Reload VSCode (Cmd+R)
- Select code again and right-click
- If still missing, reinstall the extension:
  ```bash
  code --uninstall-extension rhizome.vscode-rhizome
  code --install-extension vscode-rhizome-0.0.1.vsix
  ```

### "Timeout waiting for response"
- Check internet connection
- Verify OpenAI API key is valid
- Check account has credits

---

## Need More Details?

See **[INSTALL.md](./INSTALL.md)** for comprehensive installation, configuration, and troubleshooting.

See **[CLAUDE.md](./CLAUDE.md)** for developer philosophy and architecture (if you're maintaining the extension).

---

## Key Contacts

- **Rhizome CLI:** Ask your team lead for installation
- **OpenAI API Key:** Get at https://platform.openai.com/api/keys
- **Issues:** Report in repo or contact hallie

---

## Development (If You're Maintaining This)

### Run in Debug Mode
```bash
# From vscode-rhizome directory
npm install
npm run esbuild
# Press F5 in VSCode to launch debug extension
```

### Build for Distribution
```bash
npm run vscode:prepublish
```

### Run Tests
```bash
npm test
```

See **[CLAUDE.md](./CLAUDE.md)** for full developer guide, architecture, and rhizome flight plans.

---

**Ready?** Download the `.vsix` file and follow the installation steps above. 🚀
