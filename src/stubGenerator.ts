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
 * You asked for AST parsing. Good question. Here's what you get:
 *
 * Two paths in this function:
 * - REGEX: Simple, fast, no dependencies. But brittle for complex signatures.
 * - AST: Robust, parses anything, but requires @babel/parser (TS/JS) or ast module (Python).
 *
 * The code tries AST first (if the parser is available).
 * Falls back to regex if you don't have the dependencies.
 *
 * This way: you get robustness when you have the tools.
 * You get simplicity when you don't.
 * And you can feel the difference when you upgrade.
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
	 * STRATEGY: Try AST parsing first. Fall back to regex.
	 *
	 * Why both?
	 * - AST is correct. It understands scope, complexity, edge cases.
	 * - Regex is simple. No dependencies. But fragile.
	 *
	 * If @babel/parser is installed, we use it. Otherwise, regex.
	 * The user doesn't need to know. It just works better when it can.
	 */

	// Try to load the parser. If it fails, we'll fall back to regex.
	let hasParser = false;
	let parser: any = null;

	if (language === 'typescript' || language === 'javascript') {
		try {
			// @ts-ignore: dynamic require
			parser = require('@babel/parser');
			hasParser = true;
		} catch (e) {
			// Parser not installed. That's fine, we'll use regex.
		}
	}

	for (let i = 0; i < lines.length; i++) {
		if (markerRegex.test(lines[i])) {
			const markerLine = i;

			// Find next non-blank line
			let signatureLine = i + 1;
			while (
				signatureLine < lines.length &&
				lines[signatureLine].trim() === ''
			) {
				signatureLine++;
			}

			if (signatureLine >= lines.length) {
				continue;
			}

			// Try AST parsing if available
			if (hasParser && language !== 'python') {
				try {
					const result = parseWithAST(
						lines,
						signatureLine,
						markerLine,
						parser,
						code
					);
					if (result) {
						results.push(result);
						continue;
					}
				} catch (e) {
					// AST parsing failed. Fall through to regex.
				}
			}

			// Fall back to regex (Python always uses regex for now)
			const regexResult = parseWithRegex(
				lines[signatureLine].trim(),
				markerLine,
				language
			);
			if (regexResult) {
				results.push(regexResult);
			}
		}
	}

	return results;
}

/**
 * Parse function signature using AST (@babel/parser for TS/JS)
 *
 * This is more robust than regex. It understands:
 * ✓ Destructured params: function({a, b})
 * ✓ Complex generics: function<T extends Base>(x: T)
 * ✓ Arrow functions with multiline params
 * ✓ Default values and optional params
 *
 * But it's also more complex. We wrap it in try/catch so
 * if the code is malformed, we gracefully fall back to regex.
 */
function parseWithAST(
	lines: string[],
	signatureLine: number,
	markerLine: number,
	parser: any,
	fullCode: string
): {
	line: number;
	functionName: string;
	signature: string;
	params: string;
	returnType: string | null;
} | null {
	try {
		// Reconstruct multi-line function signature
		// (signatures can span multiple lines)
		let signatureText = '';
		let currentLine = signatureLine;

		// Scan until we find the opening brace
		while (currentLine < lines.length) {
			signatureText += lines[currentLine];
			if (signatureText.includes('{')) {
				break;
			}
			signatureText += '\n';
			currentLine++;
		}

		// Parse just the function declaration
		// Wrap in a scope to make it valid JavaScript
		const wrapped = `function _wrapper() { ${signatureText}; }`;

		const ast = parser.parse(wrapped, {
			sourceType: 'module',
			plugins: ['typescript'],
		});

		// Extract the function node from the AST
		// This is a deep dive—but it's worth seeing how AST works
		const wrapper = ast.program.body[0]?.body?.body[0];
		if (!wrapper || wrapper.type !== 'FunctionDeclaration') {
			return null;
		}

		const func = wrapper;
		const name = func.id.name;
		const params = signatureText
			.substring(signatureText.indexOf('('), signatureText.indexOf(')') + 1)
			.trim();

		// Extract return type if present (TS annotation)
		const returnTypeMatch = signatureText.match(
			/\):\s*([\w<>\[\]\s|&,]+)\s*[{]/
		);
		const returnType = returnTypeMatch
			? returnTypeMatch[1].trim()
			: null;

		return {
			line: markerLine,
			functionName: name,
			signature: signatureText.split('\n')[0],
			params,
			returnType,
		};
	} catch (e) {
		// AST parsing failed. Will fall through to regex.
		return null;
	}
}

/**
 * Parse function signature using regex (fallback)
 *
 * Simple, no dependencies. But fragile.
 * Handles 90% of real code. The other 10%? Silent failure.
 *
 * This is the constraint you feel when regex breaks.
 * When you hit it, you'll know exactly why we offer AST as an alternative.
 */
function parseWithRegex(
	sig: string,
	markerLine: number,
	language: string
): {
	line: number;
	functionName: string;
	signature: string;
	params: string;
	returnType: string | null;
} | null {
	let match;
	let name, params, returnType;

	if (language === 'python') {
		const pythonFunctionRegex =
			/^(?:async\s+)?def\s+(\w+)\s*(\([^)]*\))(?:\s*->\s*([\w\[\]]+))?:/;
		match = sig.match(pythonFunctionRegex);
		if (match) {
			name = match[1];
			params = match[2];
			returnType = match[3] || null;
		}
	} else {
		// TypeScript / JavaScript
		const tsJsFunctionRegex =
			/^(?:export\s+)?(?:const\s+)?(?:async\s+)?(?:function\s+)?(\w+)\s*(\([^)]*\))(?:\s*:\s*([\w<>\[\]|\s]+))?/;
		match = sig.match(tsJsFunctionRegex);
		if (match) {
			name = match[1];
			params = match[2];
			returnType = match[3]?.trim() || null;
		}
	}

	if (name && params) {
		return {
			line: markerLine,
			functionName: name,
			signature: sig,
			params,
			returnType: returnType ?? null,
		};
	}

	return null;
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
