/**
 * File Advocate System
 *
 * Analyze a source file's coding patterns, style, and concerns.
 * Generate personas that represent the file's "voice" and architectural philosophy.
 *
 * @rhizome: What does a file advocate do?
 * When you open extension.ts, what would the code-reviewer persona *think* about it?
 * What patterns would it notice? What concerns would it raise?
 * A file advocate is a synthetic persona that embodies the file's perspective.
 *
 * Example: extension.ts might have an advocate that says:
 * "This file is the VSCode activation point. It manages lifecycle, commands, and integrations.
 *  My concerns: error handling, telemetry consistency, command registration patterns."
 *
 * Usage:
 * 1. User right-clicks file → "Ask persona to advocate for this file"
 * 2. We analyze the file (imports, exports, patterns, structure)
 * 3. We generate file header comment with persona's perspective
 * 4. We save advocate epistle linking file to personas
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * File analysis result
 * Captures structural patterns that personas should know about
 */
export interface FileAnalysis {
	filepath: string;
	filename: string;
	language: string;
	size: number;
	lines: number;

	// Structural patterns
	imports: string[];
	exports: string[];
	classes: string[];
	functions: string[];
	interfaces: string[];

	// Coding concerns (patterns we can detect)
	concerns: {
		errorHandling: 'present' | 'minimal' | 'absent';
		testCoverage: boolean;
		documentation: 'rich' | 'moderate' | 'sparse';
		complexity: 'low' | 'medium' | 'high';
		dependencies: number;
		exports: number;
	};

	// File role (inferred from structure)
	role: 'entry-point' | 'utility' | 'generator' | 'registry' | 'ui-provider' | 'unknown';
	summary: string;
}

/**
 * Analyze a source file and extract its architectural patterns
 *
 * @rhizome: What should we analyze?
 * - Imports → what does this file depend on?
 * - Exports → what does it provide to the codebase?
 * - Classes/functions → what's the public API?
 * - Error handling → try/catch, error checks
 * - Comments → documentation density
 * - Structure → is it an entry point? A utility? A provider?
 *
 * We use heuristic parsing (regex) rather than AST because:
 * - Works across languages (TS, JS, Python, etc.)
 * - Fast enough for editor responsiveness
 * - Good enough to identify patterns
 * - AST parsing requires language-specific parsers
 */
export async function analyzeFile(filepath: string): Promise<FileAnalysis> {
	if (!fs.existsSync(filepath)) {
		throw new Error(`File not found: ${filepath}`);
	}

	const content = fs.readFileSync(filepath, 'utf-8');
	const lines = content.split('\n');
	const filename = path.basename(filepath);
	const ext = path.extname(filename).toLowerCase();

	// Detect language
	const languageMap: Record<string, string> = {
		'.ts': 'TypeScript',
		'.tsx': 'TypeScript (React)',
		'.js': 'JavaScript',
		'.jsx': 'JavaScript (React)',
		'.py': 'Python',
		'.md': 'Markdown',
		'.json': 'JSON',
	};
	const language = languageMap[ext] || 'Unknown';

	// Extract imports (TypeScript/JavaScript)
	const importRegex = /^import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/gm;
	const imports: string[] = [];
	let match;
	while ((match = importRegex.exec(content)) !== null) {
		imports.push(match[1]);
	}

	// Extract exports
	const exportRegex = /^export\s+(?:(?:async\s+)?function|class|const|interface|type)\s+(\w+)/gm;
	const exports: string[] = [];
	while ((match = exportRegex.exec(content)) !== null) {
		exports.push(match[1]);
	}

	// Extract class names
	const classRegex = /class\s+(\w+)/g;
	const classes: string[] = [];
	while ((match = classRegex.exec(content)) !== null) {
		classes.push(match[1]);
	}

	// Extract function names (top-level only)
	const funcRegex = /(?:^|[\n])(?:async\s+)?function\s+(\w+)/gm;
	const functions: string[] = [];
	while ((match = funcRegex.exec(content)) !== null) {
		functions.push(match[1]);
	}

	// Extract interfaces
	const interfaceRegex = /interface\s+(\w+)/g;
	const interfaces: string[] = [];
	while ((match = interfaceRegex.exec(content)) !== null) {
		interfaces.push(match[1]);
	}

	// Analyze concerns
	const errorHandling =
		content.includes('try') && content.includes('catch')
			? 'present'
			: content.includes('throw') || content.includes('Error')
				? 'minimal'
				: 'absent';

	const testCoverage = filename.includes('.test.') || filename.includes('.spec.');
	const commentCount = (content.match(/\/\//g) || []).length + (content.match(/\/\*/g) || []).length;
	const documentation = commentCount > lines.length * 0.3 ? 'rich' : commentCount > lines.length * 0.1 ? 'moderate' : 'sparse';

	// Estimate complexity from line count and nesting
	const complexity = lines.length > 500 ? 'high' : lines.length > 200 ? 'medium' : 'low';

	// Infer file role
	let role: FileAnalysis['role'] = 'unknown';
	if (filename === 'extension.ts' || filename === 'index.ts' || filename === 'main.ts') {
		role = 'entry-point';
	} else if (filename.includes('test') || filename.includes('spec')) {
		role = 'unknown'; // Tests aren't advocates
	} else if (filename.includes('Generator') || filename.includes('Builder')) {
		role = 'generator';
	} else if (filename.includes('Registry') || filename.includes('Store')) {
		role = 'registry';
	} else if (filename.includes('Provider') || filename.includes('Panel')) {
		role = 'ui-provider';
	} else if (filename.includes('util') || filename.includes('helper')) {
		role = 'utility';
	}

	// Generate summary
	const summaryParts: string[] = [];
	if (role !== 'unknown') {
		summaryParts.push(capitalize(role.replace('-', ' ')));
	}
	if (exports.length > 0) {
		summaryParts.push(`exports ${exports.length} ${exports.length === 1 ? 'function' : 'functions'}`);
	}
	if (classes.length > 0) {
		summaryParts.push(`${classes.length} ${classes.length === 1 ? 'class' : 'classes'}`);
	}
	const summary = summaryParts.join(' • ');

	return {
		filepath,
		filename,
		language,
		size: content.length,
		lines: lines.length,
		imports,
		exports,
		classes,
		functions,
		interfaces,
		concerns: {
			errorHandling,
			testCoverage,
			documentation,
			complexity,
			dependencies: imports.length,
			exports: exports.length,
		},
		role,
		summary,
	};
}

/**
 * Generate a file advocate header comment
 *
 * @rhizome: What should the comment say?
 * The persona's view of the file's role, concerns, and expectations.
 * Should be brief (2-4 lines) but insightful.
 *
 * Example for extension.ts:
 * // [code-reviewer] This is the VSCode activation entry point.
 * // - Manages extension lifecycle (activate/deactivate)
 * // - Registers commands, event handlers, and UI elements
 * // - Concern: Error handling consistency across command handlers
 */
export function generateFileAdvocateComment(
	analysis: FileAnalysis,
	persona: string,
	personaOpinion: string,
	language: string = 'typescript'
): string {
	const commentPrefix = language === 'python' ? '#' : '//';
	const lines: string[] = [];

	// Header line with persona name
	lines.push(`${commentPrefix} [${persona}] ${analysis.summary}`);

	// Add analysis summary
	if (analysis.concerns.exports > 0) {
		lines.push(`${commentPrefix} - Exports: ${analysis.exports.slice(0, 3).join(', ')}${analysis.exports.length > 3 ? `, +${analysis.exports.length - 3} more` : ''}`);
	}

	if (analysis.concerns.dependencies > 0) {
		lines.push(`${commentPrefix} - Dependencies: ${analysis.concerns.dependencies} modules`);
	}

	// Add concerns if appropriate
	const concerns: string[] = [];
	if (analysis.concerns.errorHandling === 'absent') {
		concerns.push('error handling');
	}
	if (analysis.concerns.complexity === 'high') {
		concerns.push(`complexity (${analysis.lines} lines)`);
	}
	if (concerns.length > 0) {
		lines.push(`${commentPrefix} - Concern: ${concerns.join(', ')}`);
	}

	// Add persona opinion if provided
	if (personaOpinion) {
		lines.push(`${commentPrefix} - ${persona} says: ${personaOpinion}`);
	}

	return lines.join('\n');
}

/**
 * Helper: Capitalize first letter
 */
function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * File advocate epistle metadata
 * Stored in registry to track which personas have advocated for which files
 */
export interface FileAdvocateEntry {
	file_path: string;
	file_name: string;
	persona: string;
	analyzed_at: string;
	summary: string;
	concerns: FileAnalysis['concerns'];
}

/**
 * Create advocate epistle from file analysis
 *
 * @rhizome: What information should the advocate epistle contain?
 * - File path and structure
 * - Persona's specific concerns about the file
 * - Recommended next steps or refactoring hints
 * - Link to the file for context
 *
 * Format: Letter epistle with file analysis + persona perspective
 */
export function createFileAdvocateEpistle(analysis: FileAnalysis, persona: string, personaOpinion: string): string {
	const date = new Date().toISOString().split('T')[0];
	const epistle = `# File Advocate: ${analysis.filename}

**Date:** ${date}
**Persona:** ${persona}
**File Role:** ${capitalize(analysis.role.replace('-', ' '))}

## File Overview

- **Path:** \`${analysis.filepath}\`
- **Language:** ${analysis.language}
- **Size:** ${analysis.lines} lines
- **Exports:** ${analysis.exports.join(', ') || '(none)'}
- **Classes:** ${analysis.classes.join(', ') || '(none)'}

## Structural Analysis

- **Dependencies:** ${analysis.concerns.dependencies} modules imported
- **Error Handling:** ${analysis.concerns.errorHandling}
- **Documentation:** ${analysis.concerns.documentation}
- **Complexity:** ${analysis.concerns.complexity}

## ${capitalize(persona)}'s Perspective

${personaOpinion || `${capitalize(persona)} is examining this file's role in the system.`}

### Concerns

- File serves as: ${capitalize(analysis.role.replace('-', ' '))}
- Primary exports: ${analysis.exports.slice(0, 5).join(', ') || '(none listed)'}
- Potential areas for review: ${getReviewAreas(analysis)}

### Questions to Consider

- Is the file's responsibility clear from its structure?
- Are error cases handled consistently?
- Could complexity be reduced by extracting utilities?
- Are imports well-organized and minimal?

---

*Generated by vscode-rhizome epistle system*
`;

	return epistle;
}

/**
 * Helper: Generate review areas based on analysis
 */
function getReviewAreas(analysis: FileAnalysis): string {
	const areas: string[] = [];

	if (analysis.concerns.errorHandling === 'absent') {
		areas.push('error handling');
	}
	if (analysis.concerns.complexity === 'high') {
		areas.push('complexity reduction');
	}
	if (analysis.concerns.documentation === 'sparse') {
		areas.push('documentation');
	}
	if (analysis.concerns.dependencies > 10) {
		areas.push('dependency management');
	}

	return areas.join(', ') || 'general code quality';
}
