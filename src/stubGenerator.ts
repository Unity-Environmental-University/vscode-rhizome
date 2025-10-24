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
 * You're using regex to find function signatures.
 * Regex is powerful for 90% of real code. The other 10%? Silent failure.
 *
 * If a signature doesn't match, you'll get... nothing. No error, no warning.
 * The marker sits there, unfound. The stub command shows "no stubs found."
 * User is confused. Did the extension break? Did they do it wrong?
 *
 * That's the rough edge. It's honest. It's also why you might want a real parser later.
 * But for now: regex works. Just know its limits.
 */
export function findStubComments(code: string, language: string): Array<{
	line: number;
	functionName: string;
	signature: string;
	params: string;
	returnType: string | null;
}> {
	const results: Array<{
		line: number;
		functionName: string;
		signature: string;
		params: string;
		returnType: string | null;
	}> = [];

	const lines = code.split('\n');
	const markerRegex = /@rhizome\s+stub/i;

	/**
	 * DECISION: Use regex to parse function signatures
	 *
	 * These patterns handle the common cases:
	 * - export / async / function keywords
	 * - TypeScript return types (string, Promise<T>, etc.)
	 * - Python type annotations (-> int, -> str, etc.)
	 *
	 * CONSTRAINT: If the signature doesn't match the regex, it silently fails.
	 * No error, no exception. Just... no match.
	 *
	 * CASES WE HANDLE:
	 * ✓ function name(args): type { }
	 * ✓ async function name(args): type { }
	 * ✓ export function name(args): type { }
	 * ✓ const name = (args): type => { }
	 * ✓ def name(args) -> type:  (Python)
	 *
	 * CASES WE DON'T:
	 * ✗ Destructured params: function({a, b}) { }
	 * ✗ Complex generics: function<T extends Base>(x: T) { }
	 * ✗ Method syntax: class Foo { name() { } }
	 * ✗ Decorators: @decorator function name() { }
	 *
	 * If you hit these, the stub won't be found. You'll need to switch to a real parser (@babel/parser, Python ast).
	 */
	const tsJsFunctionRegex =
		/^(?:export\s+)?(?:const\s+)?(?:async\s+)?(?:function\s+)?(\w+)\s*(\([^)]*\))(?:\s*:\s*([\w<>\[\]|\s]+))?/;
	const pythonFunctionRegex = /^(?:async\s+)?def\s+(\w+)\s*(\([^)]*\))(?:\s*->\s*([\w\[\]]+))?:/;

	for (let i = 0; i < lines.length; i++) {
		if (markerRegex.test(lines[i])) {
			const markerLine = i;

			// Find next non-blank line (the signature should be close)
			let signatureLine = i + 1;
			while (
				signatureLine < lines.length &&
				lines[signatureLine].trim() === ''
			) {
				signatureLine++;
			}

			if (signatureLine >= lines.length) {
				// No signature found. Silently skip this marker.
				continue;
			}

			const sig = lines[signatureLine].trim();
			let match;
			let name, params, returnType;

			if (language === 'python') {
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

			// If the regex matched, we add it. If not, silent failure.
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
 * don-socratic observes:
 * You've found the stub marker. You know the function signature.
 * Now: where does the body live? How do you know where one function ends and the next begins?
 *
 * Here's the honest answer: we use heuristics. String manipulation, not AST.
 * This works for 95% of real code. The 5% edge cases? We don't handle them.
 * Why? Because parsing scope is hard. Building an AST is overkill for a v1.
 *
 * But you'll feel the constraint. When it works, you'll wonder why.
 * When it breaks, you'll know exactly what to fix.
 */
export function insertStub(
	code: string,
	line: number,           // 0-indexed line number where @rhizome stub comment is
	stub: string,           // Generated stub code from generateStub()
	language: string,
): string {
	const lineEnding = code.includes('\r\n') ? '\r\n' : '\n';
	const lines = code.split('\n');

	if (line < 0 || line >= lines.length) {
		throw new Error(`Invalid line number: ${line}`);
	}

	// Find the function signature (next non-blank line after marker)
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
	 * DECISION: How do we find where the function body starts?
	 *
	 * We look for opening brace (TS/JS) or colon (Python).
	 * If not on the signature line, we scan forward line-by-line.
	 *
	 * CONSTRAINT: This fails if:
	 * - { or : appears in a string literal on the signature line
	 * - Function signature spans 10+ lines (we'd scan too far)
	 * - Comments contain { or :
	 *
	 * TRADE-OFF: We chose simplicity over bulletproof parsing.
	 * If you need to handle complex signatures, you'll want a real parser (@babel/parser or ast module).
	 * For now, this works for 95% of function declarations.
	 */
	let openingBraceLine = signatureLine;

	if (language === 'python') {
		// Python: find the line ending with ':'
		if (!signatureText.trimEnd().endsWith(':')) {
			openingBraceLine = signatureLine + 1;
			while (
				openingBraceLine < lines.length &&
				!lines[openingBraceLine].trimEnd().endsWith(':')
			) {
				openingBraceLine++;
			}
		}
	} else {
		// TypeScript/JavaScript: find the line containing '{'
		if (signatureText.indexOf('{') === -1) {
			openingBraceLine = signatureLine + 1;
			while (
				openingBraceLine < lines.length &&
				lines[openingBraceLine].indexOf('{') === -1
			) {
				openingBraceLine++;
			}
		}
	}

	// Prepare the stub with indentation
	const stubLines = stub.split('\n');
	const bodyIndentation = indentation + '\t';
	const indentedStub = stubLines.map((l) => (l === '' ? '' : bodyIndentation + l));

	/**
	 * DECISION: Where do we insert the stub?
	 *
	 * TS/JS: Right after the opening brace {
	 * Python: Right after the colon :
	 *
	 * CONSTRAINT: We assume the function body is empty (or we're inserting at the start).
	 * If there's existing code, we insert above it (which is correct for stubs).
	 *
	 * We add a closing brace for TS/JS, but ONLY if one doesn't already exist nearby.
	 * This heuristic is fragile. If a function has existing code, we might not add the brace.
	 * But for stub generation (empty functions), it works.
	 */
	if (language === 'python') {
		lines.splice(openingBraceLine + 1, 0, ...indentedStub);
	} else {
		// TypeScript/JavaScript
		lines.splice(openingBraceLine + 1, 0, ...indentedStub);

		// Check if we need to add a closing brace
		const nextLineAfterStub = openingBraceLine + indentedStub.length + 1;
		const hasClosingBrace =
			nextLineAfterStub < lines.length &&
			lines[nextLineAfterStub].trim().startsWith('}');

		if (!hasClosingBrace) {
			lines.splice(nextLineAfterStub, 0, indentation + '}');
		}
	}

	return lines.join(lineEnding);
}
