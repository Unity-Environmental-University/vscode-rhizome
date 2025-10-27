# Test Scenarios for vscode-rhizome

## Scenario 1: Stub Generation

**What we're testing:** The stub generation pipeline end-to-end

**Setup:**
- Create a test TypeScript file with a function marked `@rhizome stub`
- File is in a workspace with `.rhizome` initialized
- Rhizome CLI is installed and in PATH

**Happy Path:**
1. User invokes `vscode-rhizome.stub` command
2. Extension finds `@rhizome stub` comment above function
3. Extension parses function signature (name, params, return type)
4. Extension generates stub (TODO comment + throw statement)
5. Extension inserts stub into file at correct location
6. File is modified with stub code visible

**Error Cases:**
1. No `@rhizome stub` comment found → show warning "No stub markers found"
2. Multiple `@rhizome stub` comments → user picks which one via quick pick
3. Unsupported language → show error with supported languages
4. Parse failure (complex signature) → graceful fallback with error message

**Assertions:**
- Stub contains TODO comment
- Stub contains language-appropriate error (throw in TS/JS, raise in Python)
- Indentation matches original code
- File modified correctly (no extra braces or missing content)

---

## Scenario 2: Don-Socratic Querying

**What we're testing:** The don-socratic persona query pipeline with dependencies

**Setup:**
- Create a test TypeScript file with code to question
- Test both success and failure paths

**Path A: Happy Path (everything configured)**
1. User has OpenAI API key configured
2. User has rhizome installed
3. User has `.rhizome` initialized in workspace
4. User selects code and invokes `vscode-rhizome.donSocratic`
5. Extension calls `rhizome query --persona don-socratic` with selected code as stdin
6. rhizome contacts OpenAI successfully
7. Response appears in output channel
8. User can read the don's questions

**Path B: Missing OpenAI Key**
1. User hasn't set up OpenAI key yet
2. User invokes `vscode-rhizome.donSocratic`
3. Extension detects missing key, prompts for it
4. User enters key via password input dialog
5. Key is stored in `.rhizome/config.json`
6. `.rhizome/config.json` is added to `.gitignore`
7. Query proceeds with newly configured key

**Path C: Rhizome Not Installed**
1. User doesn't have rhizome CLI installed
2. User invokes `vscode-rhizome.donSocratic`
3. Extension detects rhizome is missing
4. Shows error dialog with "View Installation Guide" button
5. User can click to open installation docs

**Path D: .rhizome Not Initialized**
1. User opens vscode-rhizome in a new workspace
2. `.rhizome` directory doesn't exist yet
3. User invokes `vscode-rhizome.donSocratic`
4. Extension automatically runs `rhizome init`
5. Creates `.rhizome` with proper structure
6. Then proceeds with query

**Assertions:**
- Error messages are clear and actionable
- Success flows show response in output channel
- Configuration persists across sessions
- No hardcoded secrets in code/tests
- All error paths have graceful fallbacks

---

## Patterns to Extract into a Library

Looking at both scenarios, what patterns emerge?

1. **Setup/Teardown Patterns**
   - Create test workspace with known structure
   - Initialize `.rhizome` context
   - Configure OpenAI key (mock vs real)
   - Clean up after test

2. **Mock/Stub Patterns**
   - Mock rhizome CLI (return predefined responses)
   - Mock OpenAI API (return test responses)
   - Mock file system operations

3. **Assertion Patterns**
   - Assert file content matches expected
   - Assert output channel contains text
   - Assert error messages are user-friendly
   - Assert configuration was persisted

4. **Error Path Patterns**
   - Test each error condition independently
   - Verify error messages are clear
   - Verify user is directed to fix (not left hanging)

5. **Configuration Patterns**
   - Test config fallbacks (env var → config file → default)
   - Test config persistence across sessions
   - Test .gitignore protection

6. **Integration Patterns**
   - Test full workflows end-to-end
   - Test interactions between helpers
   - Test with real file system (not just mocks)
