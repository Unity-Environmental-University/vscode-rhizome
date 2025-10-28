# Persona-LLM CLI Design

**Status:** Design hold — needs work within rhizome repo before extension.ts can proceed

**Blocker:** vscode-rhizome extension is ornamental without this. Currently using Claude Code CLI to ask personas questions (e.g., "don-socratic kick my ass"). Extension needs to be able to invoke persona responses via LLM.

## The Need

Right now: Developer uses Claude Code CLI to ask don-socratic for feedback, guidance, code review.

Wanted: vscode-rhizome extension can invoke persona responses with LLM backing.

This requires rhizome CLI to support: `rhizome ask --persona <name> "question"`

## Design Questions (TBD)

1. **Command interface:**
   - Name: `rhizome ask`? `rhizome persona ask`? `rhizome speak`?
   - Signature: `rhizome ask --persona don-socratic "question"`?

2. **Persona specification:**
   - How do you specify which persona? By name? Or context-aware default?
   - Multiple personas in one call? Or single persona per invocation?

3. **Context handling:**
   - Minimal: just the prompt + persona identity
   - Medium: file content passed as context
   - Full: codebase context, decision history, user story references

4. **Output format:**
   - Plain text to stdout?
   - JSON structure (for extension to parse)?
   - Markdown with embedded decisions/references?

5. **Conversation vs single-turn:**
   - One-shot Q&A (stateless)?
   - Chat history tracking (stateful)?
   - For MVP: single-turn is safer

6. **Error handling:**
   - LLM timeout/failure — what does extension see?
   - Rate limiting? Token exhaustion?

## Notes

- This is the foundation for extension.ts. Without it, extension can't do anything useful.
- Decision made 2025-10-23: Don't design in vscode-rhizome; design and implement in rhizome repo first.
- Once CLI side works, wire it up to extension via cliBackend.ts.

## Next: Design in rhizome repo

See `.rhizome/actions.ndjson` for tracking.
