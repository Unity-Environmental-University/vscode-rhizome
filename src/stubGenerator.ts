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
	/**
	 * BUILD THE TODO COMMENT
	 * ─────────────────────
	 * This is what appears above the function.
	 * Must include: function name (for TODO backlog search)
	 * Optional: timestamp (when was this stubbed?), user story (why?)
	 */
	let todoComment = `TODO: Implement ${functionName}`;

	if (options?.timestamp) {
		todoComment += ` (stubbed ${options.timestamp}`;
		if (options?.userStory) {
			todoComment += `, ${options.userStory}`;
		}
		todoComment += ')';
	} else if (options?.userStory) {
		todoComment += ` (${options.userStory})`;
	}

	/**
	 * LANGUAGE-SPECIFIC STUB BODY
	 * ───────────────────────────
	 * Two paths: TypeScript/JavaScript vs Python
	 * Each throws/raises with function name for debugging
	 */
	let stubBody: string;

	if (language === 'python') {
		// Python uses indentation-relative code; caller will add indentation
		// Format: raise NotImplementedError('function_name')
		stubBody = `raise NotImplementedError('${functionName}')`;
	} else {
		// TypeScript/JavaScript: throw new Error(...)
		// Format: throw new Error('Not implemented: functionName')
		stubBody = `throw new Error('Not implemented: ${functionName}');`;
	}

	/**
	 * ASSEMBLE THE STUB
	 * ─────────────────
	 * Return just the body (not the function signature).
	 * Caller (insertStub) handles placing this inside the function.
	 * Include the TODO comment so it appears above.
	 */
	return `${todoComment}\n${stubBody}`;
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
	const results: Array<{
		line: number;
		functionName: string;
		signature: string;
		params: string;
		returnType: string | null;
	}> = [];

	/**
	 * SPLIT CODE INTO LINES
	 * ──────────────────────
	 * Preserve line endings for later use (in insertStub).
	 */
	const lines = code.split('\n');

	/**
	 * REGEX TO FIND @RHIZOME STUB MARKERS
	 * ────────────────────────────────────
	 * Language-agnostic: works in comments (//, #, /*, etc.)
	 * Case-insensitive match for robustness
	 */
	const markerRegex = /@rhizome\s+stub/i;

	/**
	 * REGEX PATTERNS FOR FUNCTION SIGNATURES
	 * ───────────────────────────────────────
	 * TypeScript/JavaScript:
	 *   - Handles: export, async, function keyword
	 *   - Captures: name, params, return type
	 *   - Example: "export async function getName(x: number): string"
	 *
	 * Python:
	 *   - Handles: async keyword, def
	 *   - Captures: name, params, return type
	 *   - Example: "async def get_name(x: int) -> str:"
	 */
	const tsJsFunctionRegex =
		/^(?:export\s+)?(?:const\s+)?(?:async\s+)?(?:function\s+)?(\w+)\s*(\([^)]*\))(?:\s*:\s*([\w<>\[\]|\s]+))?/;
	const pythonFunctionRegex = /^(?:async\s+)?def\s+(\w+)\s*(\([^)]*\))(?:\s*->\s*([\w\[\]]+))?:/;

	/**
	 * SCAN FOR MARKERS
	 * ────────────────
	 * For each line with @rhizome stub:
	 * 1. Record the line number
	 * 2. Look at next 1-2 lines for function signature
	 * 3. Extract name, params, return type
	 * 4. Add to results
	 */
	for (let i = 0; i < lines.length; i++) {
		if (markerRegex.test(lines[i])) {
			// Found a @rhizome stub marker
			const markerLine = i;

			// Look at next line(s) for function signature
			// Allow up to 1 blank line between marker and signature
			let signatureLine = i + 1;
			while (
				signatureLine < lines.length &&
				lines[signatureLine].trim() === ''
			) {
				signatureLine++;
			}

			if (signatureLine >= lines.length) {
				// No function signature found after marker
				continue;
			}

			const sig = lines[signatureLine].trim();

			// Try to parse the signature
			let match;
			let name, params, returnType;

			if (
				language === 'python'
			) {
				match = sig.match(pythonFunctionRegex);
				if (match) {
					name = match[1];
					params = match[2];
					returnType = match[3] || null;
				}
			} else {
				// TypeScript / JavaScript
				match = sig.match(tsJsFunctionRegex);
				if (match) {
					name = match[1];
					params = match[2];
					returnType = match[3]?.trim() || null;
				}
			}

			if (name && params) {
				results.push({
					line: markerLine,
					functionName: name,
					signature: sig,
					params: params,
					returnType: returnType ?? null,
				});
			}
		}
	}

	return results;
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
	/**
	 * STEP 1: SPLIT CODE AND DETECT LINE ENDINGS
	 * ───────────────────────────────────────────
	 * We need to:
	 * - Track whether the original code uses \n or \r\n
	 * - Split into lines while preserving structure
	 * - Insert the stub at the right place
	 */
	const lineEnding = code.includes('\r\n') ? '\r\n' : '\n';
	const lines = code.split('\n');

	if (line < 0 || line >= lines.length) {
		throw new Error(`Invalid line number: ${line}`);
	}

	/**
	 * STEP 2: FIND THE SIGNATURE LINE (next non-blank after marker)
	 * ─────────────────────────────────────────────────────────────
	 * The marker is on `line`. The signature is on the next non-blank line.
	 * (Same logic as in findStubComments)
	 */
	let signatureLine = line + 1;
	while (signatureLine < lines.length && lines[signatureLine].trim() === '') {
		signatureLine++;
	}

	if (signatureLine >= lines.length) {
		throw new Error('No function signature found after @rhizome stub marker');
	}

	const signatureText = lines[signatureLine];
	const indentation = signatureText.match(/^\s*/)?.[0] || '';

	/**
	 * STEP 3: DETECT LANGUAGE AND FIND OPENING BRACE/COLON
	 * ──────────────────────────────────────────────────────
	 * TypeScript/JavaScript: look for { (opening brace)
	 * Python: look for : (colon) at end of def line
	 *
	 * If not found on the signature line, assume it's on the next line.
	 */
	let openingBraceLine = signatureLine;
	let openingBraceIndex = signatureText.indexOf('{');
	let openingColonIndex = signatureText.lastIndexOf(':');

	// Handle single-line vs multi-line function declarations
	if (language === 'python') {
		// Python: check if this line ends with ':'
		if (!signatureText.trimEnd().endsWith(':')) {
			// Multi-line signature, look for next line with ':'
			openingBraceLine = signatureLine + 1;
			while (
				openingBraceLine < lines.length &&
				!lines[openingBraceLine].trimEnd().endsWith(':')
			) {
				openingBraceLine++;
			}
		}
	} else {
		// TypeScript/JavaScript: find the {
		if (openingBraceIndex === -1) {
			// { is on a later line
			openingBraceLine = signatureLine + 1;
			while (
				openingBraceLine < lines.length &&
				lines[openingBraceLine].indexOf('{') === -1
			) {
				openingBraceLine++;
			}
		}
	}

	/**
	 * STEP 4: PREPARE INDENTED STUB
	 * ──────────────────────────────
	 * generateStub() returns:
	 *   "TODO: Implement foo\nthrow new Error(...)"
	 * OR
	 *   "TODO: Implement foo\nraise NotImplementedError(...)"
	 *
	 * We need to:
	 * 1. Split the stub into lines
	 * 2. Add indentation to each line
	 * 3. Add one extra level of indentation for the body
	 */
	const stubLines = stub.split('\n');
	const bodyIndentation = indentation + '\t'; // Add one tab for body

	const indentedStub = stubLines.map((l) => {
		if (l === '') return '';
		return bodyIndentation + l;
	});

	/**
	 * STEP 5: INSERT STUB INTO DOCUMENT
	 * ──────────────────────────────────
	 * Insert after the opening brace/colon
	 *
	 * Example before (TypeScript):
	 *   function getName(x: number): string
	 *
	 * Example after:
	 *   function getName(x: number): string {
	 *     TODO: Implement getName
	 *     throw new Error('Not implemented: getName');
	 *   }
	 */
	if (language === 'python') {
		// Python: insert after the : line
		lines.splice(openingBraceLine + 1, 0, ...indentedStub);
	} else {
		// TypeScript/JavaScript: insert after the { line
		// First, check if { exists on the opening line
		const hasBrace = lines[openingBraceLine].indexOf('{') !== -1;
		if (!hasBrace) {
			lines[openingBraceLine] = lines[openingBraceLine].trimEnd() + ' {';
		}
		lines.splice(openingBraceLine + 1, 0, ...indentedStub);

		// Add closing brace ONLY if the function body was empty
		// If there's already code after the signature, don't add one
		// (This is a rough edge - ideally we'd parse the whole function)
		// For now: only add closing brace if next line is empty or EOF
		const nextLineAfterStub = openingBraceLine + indentedStub.length + 1;
		if (
			nextLineAfterStub >= lines.length ||
			lines[nextLineAfterStub].trim() === '' ||
			lines[nextLineAfterStub].trim().startsWith('}')
		) {
			// Only add the brace if we're adding to an empty function
			if (!hasBrace || (nextLineAfterStub < lines.length && !lines[nextLineAfterStub].trim().startsWith('}'))) {
				lines.splice(nextLineAfterStub, 0, indentation + '}');
			}
		}
	}

	/**
	 * STEP 6: REASSEMBLE AND RETURN
	 * ──────────────────────────────
	 * Join lines with original line ending style
	 */
	return lines.join(lineEnding);
}
