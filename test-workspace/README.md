# vscode-rhizome Test Workspace

This directory is automatically opened when you run the extension in debug mode (F5 or "Run Extension" from launch config).

## Files

- **test.ts** - TypeScript examples for testing don-socratic and stub generation
- **test.py** - Python examples (same functions, Python syntax)

## How to Test

### Option 1: From VSCode (inside extension development)

1. Press **F5** or go to Run → Run Extension
   - This builds the extension and opens a new VSCode window with this workspace
   - The extension is loaded and ready

2. In the new window:
   - Select code in test.ts or test.py
   - Right-click → "Ask don-socratic" or "Ask don-socratic (inline)"
   - View → Output → vscode-rhizome (see the response)

3. Or test stub generation:
   - In test.ts, find the `parseJSON` function marked with `@rhizome stub`
   - Right-click → "Stub this function"
   - The function body should be replaced with a stub

### Option 2: From Terminal

```bash
npm run esbuild
code --extensionDevelopmentPath=. test-workspace
```

## Expected Behavior

**If Ollama/OpenAI is running:**
- Output shows don's response to your code

**If Ollama/OpenAI is NOT running:**
- Output shows error: "HTTP Error 404: Not Found" from Ollama
- This means the extension is working, just needs the service

## Questions don-socratic Might Ask

- "What should this function do?"
- "Where does the data come from?"
- "What are the edge cases?"
- "How would you test this?"
- "What would you name this pattern?"
