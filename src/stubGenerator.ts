/**
 * Stub Generator
 *
 * don-socratic asks:
 * Before you write a line, answer this: what does "stub" actually MEAN?
 * When a developer sees the generated stub, what must be there?
 * What must NOT be there?
 *
 * Think carefully. Write down your answer in the comment below before proceeding.
 *
 * ANSWER (from dev-guide + code-reviewer collaboration):
 * A stub for vscode-rhizome is:
 *
 * MUST HAVE:
 * ✓ Function signature with available type information
 * ✓ throw new Error('Not implemented') | raise NotImplementedError()
 * ✓ TODO comment that mentions the function name
 * ✓ Optional: ISO 8601 timestamp, user story reference (e.g., "US-123: As a user...")
 * ✓ Language-specific syntax (TS throws Error, Python raises NotImplementedError)
 *
 * MUST NOT HAVE:
 * ✗ Partial implementation or misleading logic
 * ✗ Vague TODO (must include function name for context outside editor)
 * ✗ Assumption about parameter types (infer from signature or mark as unknown)
 *
 * RATIONALE:
 * - Prevents linter errors (undefined function → defined, throws as expected)
 * - Forces explicit intent (TODO + timestamp = "I thought about this")
 * - Supports TODO backlog tracking (searchable by function name)
 * - Integrates with user story workflow (reference in comment)
 * - Language-consistent (developers recognize pattern across TS/JS/Python)
 */

/**
 * Parse a function signature and generate a stub
 *
 * don-socratic asks:
 * What languages are we dealing with? (TS, JS, Python)
 * How do we know where to insert the stub?
 * What's the minimal stub that satisfies your definition above?
 *
 * TODO: Implement stub generation
 * TODO: What's the function signature?
 * TODO: What's the return type?
 * TODO: What error do we throw?
 * TODO: What TODO comment do we add?
 */
export function generateStub(
	functionName: string,
	params: string,           // e.g., "(x: number, y?: string)" — keep as-is from signature
	returnType: string | null, // e.g., "string" or "Promise<void>" or null if untyped
	language: 'typescript' | 'javascript' | 'python',
	options?: {
		timestamp?: string;   // ISO 8601: "2025-10-23T21:00:00Z" (optional)
		userStory?: string;   // e.g., "US-142: As a developer..."  (optional)
	}
): string {
	throw new Error('Not implemented');

	// LANGUAGE-SPECIFIC SYNTAX & API HOOKS:
	//
	// TypeScript/JavaScript:
	//   - throw new Error('message')
	//   - Async functions: same syntax
	//   - Arrow functions: same syntax
	//   - Example: function getName(x: number): string { throw new Error(...) }
	//
	// Python:
	//   - raise NotImplementedError()
	//   - Async functions: async def (same raise syntax)
	//   - Example: def get_name(x: int) -> str:
	//                   raise NotImplementedError()
	//
	// TYPED VS UNTYPED HANDLING:
	//   - If returnType is provided: use it (generateStub is called with extracted types)
	//   - If returnType is null: don't infer. Leave blank or mark as 'unknown' in TS
	//   - If params have types: keep them. If not, keep the bare param names
	//   - Don't guess parameter types at stub-generation time. Type inference is LLM's job (future).
	//
	// TODO COMMENT FORMAT:
	//   - MUST include function name (seen outside code context in TODO backlog)
	//   - SHOULD include timestamp (when was this stubbed?)
	//   - MAY include user story reference (why does this function exist?)
	//   - Example: "TODO: Implement getName (stubbed 2025-10-23T21:00:00Z, US-142)"
	//
	// STUB BODY:
	//   - Single throw/raise statement (not a comment, actual executable code)
	//   - Message includes function name for debugging: throw new Error('Not implemented: getName')
	//   - Python: raise NotImplementedError('get_name')
}



/**
 * Find @rhizome stub comments in code
 *
 * don-socratic observes:
 * You know regex. So why not start there? Split the code into lines,
 * find the ones with @rhizome stub. You've got line numbers. Easy.
 *
 * Then—and here's where it gets interesting—you need to know what comes next.
 * A function signature. But it looks *different* in each language.
 * Have you thought about what MUST be true about that signature?
 * (Is it always on the very next line? Or could there be whitespace?)
 *
 * For the actual parsing: languages have tools. TypeScript has @babel/parser.
 * Python has ast (built-in!). But you might not need them yet.
 * A regex could get you 80% of the way. What's your tolerance for edge cases?
 * (Nested functions? Async? Arrow functions? Methods in classes?)
 *
 * Start small. Get it working for the simple case.
 * Then ask: what broke? And fix that case.
 * That's how you learn what you actually need.
 *
 * don-socratic asks (again):
 * What does a @rhizome stub comment look like? You answered: //@rhizome, #@rhizome, etc.
 * Good. So write the regex. Then test it on your code. Does it find them?
 *
 * TODO: Write regex to find @rhizome stub comments (you know how)
 * TODO: Extract line number and function signature on next line
 * TODO: What breaks first? Fix that. Then the next thing.
 * TODO: Only then: do I need a proper parser, or is regex enough?
 */
export function findStubComments(code: string, language: string): Array<{
	line: number;
	functionName: string;
	signature: string;        // The full function signature from next line(s)
	params: string;           // Just the params: "(x, y)" or "(x: number, y?: string)"
	returnType: string | null; // Return type if present, else null
}> {
	throw new Error('Not implemented');

	// WHAT DOES @RHIZOME STUB LOOK LIKE?
	//
	// Comment format (language-specific):
	//   // @rhizome stub       (TypeScript/JavaScript)
	//   # @rhizome stub       (Python)
	//   /* @rhizome stub */   (Block comment, any language)
	//
	// Regex pattern (language-agnostic):
	//   /(@rhizome\s+stub)/i
	//
	// WHERE IS THE FUNCTION SIGNATURE?
	//   - ASSUMPTION (for v1): signature is on the NEXT line after @rhizome stub
	//   - TOLERANCE: zero or one blank line is OK, but not multiple blank lines
	//   - WHY: Keeps @rhizome stub marker tight to the function it describes
	//
	// IMPLEMENTATION STRATEGY:
	//   1. Split code into lines
	//   2. Find lines matching @rhizome stub pattern (regex is fine, you know how)
	//   3. Get line number + next line(s) until you find a function keyword
	//   4. Extract signature from that line
	//   5. Parse the signature to get params and return type
	//
	// EDGE CASES: START WITH THESE, SKIP THE REST FOR NOW
	//   ✓ Top-level function declarations (function name() {...})
	//   ✓ Arrow functions (const name = (...) => {...})
	//   ✓ Async functions (async function name() {...})
	//   ✗ Nested functions (skip for now—add if it breaks)
	//   ✗ Methods in classes (skip for now—add if it breaks)
	//
	// PARSER CHOICE: REGEX OR AST?
	//   - START WITH REGEX. You can extract function signature with a simple pattern.
	//   - REGEX IS 80% SOLUTION: works for the cases above.
	//   - ONLY USE AST (@babel/parser, Python ast) if regex breaks on real code.
	//   - AST ADDS COMPLEXITY: don't pay that cost until you need it.
	//
	// REGEX PATTERN FOR FUNCTION SIGNATURE:
	//   TypeScript/JavaScript:
	//     /^(export\s+)?(async\s+)?(function\s+)?(\w+)\s*(\([^)]*\))(\s*:\s*\w+)?/
	//     Captures: exportKeyword, asyncKeyword, functionKeyword, name, params, returnType
	//
	//   Python:
	//     /^(async\s+)?def\s+(\w+)\s*(\([^)]*\))(\s*->\s*\w+)?:/
	//     Captures: asyncKeyword, name, params, returnType
}

/**
 * Insert stub into code at specified location
 *
 * don-socratic asks:
 * You've found where to insert. But HOW?
 * Do you replace the entire function signature?
 * Do you keep what was there and add to it?
 * How do you preserve indentation?
 * How do you handle line endings?
 *
 * TODO: Implement stub insertion
 */
export function insertStub(
	code: string,
	line: number,           // 0-indexed line number where @rhizome stub comment is
	stub: string,           // Generated stub code from generateStub()
	language: string,
): string {
	throw new Error('Not implemented');

	// INSERTION STRATEGY:
	//   - Don't replace the function signature if it exists
	//   - Add the stub body INSIDE the function (between { and })
	//   - Or for Python: after the function def line, before any docstring
	//
	// STEP-BY-STEP:
	//   1. Find the opening brace/colon on the signature line
	//   2. Get the indentation from that line
	//   3. Insert stub code with matching indentation
	//   4. Preserve the closing brace/endif
	//
	// EXAMPLE - TypeScript (before):
	//   // @rhizome stub
	//   function getName(x: number): string
	//
	// EXAMPLE - TypeScript (after):
	//   // @rhizome stub
	//   function getName(x: number): string {
	//     throw new Error('Not implemented: getName');
	//   }
	//
	// EXAMPLE - Python (before):
	//   # @rhizome stub
	//   def get_name(x: int) -> str:
	//
	// EXAMPLE - Python (after):
	//   # @rhizome stub
	//   def get_name(x: int) -> str:
	//     raise NotImplementedError('get_name')
	//
	// INDENTATION HANDLING:
	//   - Get the indentation level from the function signature line
	//   - TypeScript: add 1 indent level (usually 1 tab or 2-4 spaces)
	//   - Python: add 1 indent level (usually 4 spaces)
	//   - Preserve the user's original indentation style (tabs vs spaces)
	//
	// LINE ENDING HANDLING:
	//   - Detect the line ending style in the original code: \n or \r\n
	//   - Use the same style when inserting
	//   - Simple: detect() { return code.includes('\r\n') ? '\r\n' : '\n'; }
	//
	// OFF-BY-ONE ERRORS (THE TRAP):
	//   - lines array is 0-indexed, but split('\n') gives you that
	//   - Don't accidentally include/exclude the @rhizome stub line itself
	//   - Don't accidentally insert at wrong line (use the signature line, not the comment)
	//   - Test with known input + expected output before you trust it
	//
	// TESTS TO WRITE FIRST (before implementing):
	//   - Insert stub at line 0 (beginning of file)
	//   - Insert stub in the middle of file with other functions
	//   - Preserve indentation (tabs and spaces separately)
	//   - Preserve line endings (\n and \r\n separately)
	//   - Handle TypeScript and Python separately
}
