/**
 * Stub Generator
 *
 * don-socratic asks:
 * Before you write a line, answer this: what does "stub" actually MEAN?
 * When a developer sees the generated stub, what must be there?
 * What must NOT be there?
 *
 * Think carefully. Write down your answer in the comment below before proceeding.
 * TODO: Define what a stub is (for this extension, right now, in THIS moment)
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
	language: string,
	// TODO: what other parameters do we need?
): string {
	throw new Error('Not implemented');

	// don-socratic asks:
	// You're about to generate code. But do you know:
	// - What language-specific syntax to use?
	// - How to handle typed vs untyped functions?
	// - Should the TODO mention the function name?
	// - Should it include a timestamp? A user story reference?
	//
	// Don't guess. Think first.
}

/**
 * Find @rhizome stub comments in code
 *
 * don-socratic asks:
 * What does a @rhizome stub comment look like?
 * Is it always on the line directly above a function?
 * What if there's whitespace? What if there are other comments?
 * How do you KNOW you found the right function?
 *
 * TODO: Implement comment parsing
 * TODO: What's the pattern we're looking for?
 * TODO: How do we extract the function that follows?
 */
export function findStubComments(code: string, language: string): Array<{
	line: number;
	functionName: string;
	// TODO: what else do we need to return?
}> {
	throw new Error('Not implemented');

	// don-socratic asks:
	// Have you considered edge cases?
	// - Nested functions?
	// - Arrow functions vs declarations?
	// - Async functions?
	// - Methods inside classes?
	//
	// If you haven't, do that BEFORE you code.
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
	line: number,
	stub: string,
	language: string,
): string {
	throw new Error('Not implemented');

	// don-socratic observes:
	// This is where easy mistakes live. Off-by-one errors.
	// Indentation mismatches. Line ending chaos.
	//
	// Have you written tests for this part yet?
	// (Probably should, before you implement.)
}
