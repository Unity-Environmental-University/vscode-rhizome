/**
 * commentParser.ts
 *
 * Parse persona responses into structured line-by-line comments.
 * Converts natural language feedback into insertion points with line numbers.
 */

export interface CommentInsertion {
	lineNumber: number;
	comment: string;
	context?: string; // The code snippet being commented on
}

/**
 * Parse persona response into structured insertions.
 *
 * Expects response format like:
 * Line 5: Missing null check here. What if user is undefined?
 * Line 12-15: This loop could be optimized with a Set instead of array lookup
 * Line 20: Good error handling, but consider logging the error
 *
 * The commentPrefix parameter (// for TypeScript, # for Python) is prepended to each
 * parsed comment. This ensures comments use the correct syntax for the file type.
 *
 * Falls back to inserting at logical points if no line numbers detected.
 */
export function parseCommentInsertion(
	response: string,
	fileLines: string[],
	commentPrefix: string = '//'
): CommentInsertion[] {
	const insertions: CommentInsertion[] = [];

	// Try to extract line number references
	const linePattern = /(?:line|lines?)\s*(\d+)(?:-(\d+))?:?\s*(.+?)(?=line|\n|$)/gi;
	let match;

	while ((match = linePattern.exec(response)) !== null) {
		const startLine = parseInt(match[1], 10) - 1; // Convert to 0-indexed
		const endLine = match[2] ? parseInt(match[2], 10) - 1 : startLine;
		const comment = match[3].trim();

		// Extract context from file
		const context = fileLines
			.slice(Math.max(0, startLine), Math.min(fileLines.length, endLine + 1))
			.join('\n');

		if (startLine >= 0 && startLine < fileLines.length) {
			insertions.push({
				lineNumber: startLine,
				comment: `${commentPrefix} ${comment}`,
				context,
			});
		}
	}

	// If no line numbers found, try to match against code snippets in response
	if (insertions.length === 0) {
		insertions.push({
			lineNumber: 0,
			comment: `${commentPrefix}\n${commentPrefix} REVIEW:\n${response
				.split('\n')
				.map(line => `${commentPrefix} ${line}`)
				.join('\n')}`,
		});
	}

	return insertions;
}

/**
 * Format insertions as a preview for user approval
 */
export function formatInsertionPreview(insertions: CommentInsertion[], fileLines: string[]): string {
	return insertions
		.map((ins, idx) => {
			const lineNum = ins.lineNumber + 1;
			const codeLine = fileLines[ins.lineNumber] || '';
			return `[${idx + 1}] Line ${lineNum}:\n${ins.comment}\n\n${codeLine}\n`;
		})
		.join('\n---\n\n');
}
