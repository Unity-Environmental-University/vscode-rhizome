/**
 * Epistle Generator
 *
 * Creates epistles in three formats:
 * 1. Letter epistles - markdown files in .rhizome/plugins/epistles/
 * 2. Inline epistles - comment blocks embedded in source code
 * 3. Dynamic personas - synthesized from file analysis
 *
 * @rhizome: Why separate from registry?
 * Registry = storage/querying. Generator = creation/formatting.
 * This keeps concerns separated: registry doesn't know how to format, generator doesn't know storage.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { EpistleRegistryEntry } from './epistleRegistry';

/**
 * Epistle context: information needed to generate an epistle
 */
export interface EpisodeContext {
	selectedCode: string;
	selectedFile: string;
	selectedLines: { start: number; end: number };
	personas: string[];
	topic: string;
	flightPlan?: string;
	language?: string; // Programming language for inline epistles
}

/**
 * Letter epistle generator
 *
 * Creates a markdown file in .rhizome/plugins/epistles/ with epistle template.
 */
export class LetterEpistleGenerator {
	/**
	 * Generate letter epistle markdown content
	 *
	 * @rhizome: What should a letter template contain?
	 * - Metadata: date, topic, code context, linked flight plan, status
	 * - Dialog section: persona names with conversation template
	 * - Calls to action: "user fills in or uses persona query to populate"
	 */
	static generateContent(context: EpisodeContext, id: string): string {
		const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
		const personaList = context.personas.join(' ↔ ');
		const codeLocation = `${path.basename(context.selectedFile)}:${context.selectedLines.start}-${context.selectedLines.end}`;

		const dialogSection = context.personas
			.map(persona => `**${persona}:**\n[Your response here]\n`)
			.join('\n');

		const template = `# Epistle: ${personaList}

**Date**: ${date}
**Topic**: ${context.topic}
**Code context**: ${codeLocation}
**Linked flight plan**: ${context.flightPlan || 'None'}
**Status**: draft

## Code Selection

\`\`\`${context.language || 'text'}
${context.selectedCode}
\`\`\`

## Dialog

${dialogSection}

## Notes

- Use this space to record the multi-persona discussion about the code
- Each persona can ask questions, challenge assumptions, propose solutions
- Capture the reasoning behind your design decision
- Mark status as "resolved" when the discussion is complete
- You can link this epistle to a flight plan to keep design reasoning with your work
`;

		return template;
	}

	/**
	 * Create a letter epistle file
	 */
	static createFile(
		context: EpisodeContext,
		id: string,
		epistlesDirectory: string
	): { filePath: string; content: string } {
		const filename = `${id}.md`;
		const filePath = path.join(epistlesDirectory, filename);
		const content = this.generateContent(context, id);

		// Ensure directory exists
		fs.mkdirSync(epistlesDirectory, { recursive: true });

		// Write file
		fs.writeFileSync(filePath, content, 'utf-8');

		return { filePath, content };
	}

	/**
	 * Generate registry entry for letter epistle
	 */
	static generateRegistryEntry(
		id: string,
		context: EpisodeContext,
		filename: string
	): EpistleRegistryEntry {
		return {
			id,
			type: 'letter',
			date: new Date().toISOString().split('T')[0],
			personas: context.personas,
			topic: context.topic,
			status: 'draft',
			flight_plan: context.flightPlan,
			file: filename,
			keywords: [context.topic, ...context.personas],
			context: [context.selectedFile],
		};
	}
}

/**
 * Inline epistle generator
 *
 * Creates multi-persona comment blocks embedded in source code.
 */
export class InlineEpistleGenerator {
	/**
	 * Detect comment syntax for a given language
	 *
	 * @rhizome: How do we know the comment syntax?
	 * Map of common languages to their comment characters.
	 * If language not found, default to //.
	 */
	private static getCommentSyntax(language: string): { single: string; start: string; end: string } {
		const syntaxMap: Record<string, { single: string; start: string; end: string }> = {
			typescript: { single: '//', start: '/*', end: '*/' },
			javascript: { single: '//', start: '/*', end: '*/' },
			python: { single: '#', start: '"""', end: '"""' },
			java: { single: '//', start: '/*', end: '*/' },
			go: { single: '//', start: '/*', end: '*/' },
			rust: { single: '//', start: '/*', end: '*/' },
			cpp: { single: '//', start: '/*', end: '*/' },
			c: { single: '//', start: '/*', end: '*/' },
			csharp: { single: '//', start: '/*', end: '*/' },
			ruby: { single: '#', start: '=begin', end: '=end' },
			html: { single: '<!-- ', start: '<!--', end: '-->' },
			css: { single: '', start: '/*', end: '*/' },
		};

		return syntaxMap[language.toLowerCase()] || { single: '//', start: '/*', end: '*/' };
	}

	/**
	 * Generate inline epistle comment block
	 *
	 * @rhizome: What format for inline epistles?
	 * Header: "EPISTLE: topic"
	 * Lines: "// [persona]: [response]" (language-aware comment syntax)
	 * Template entries for user to fill in
	 */
	static generateCommentBlock(context: EpisodeContext, id: string): string {
		const syntax = this.getCommentSyntax(context.language || 'typescript');
		const commentChar = syntax.single || '//';

		const dialogLines = context.personas
			.map(persona => `${commentChar} ${persona}: [response pending]`)
			.join('\n');

		const block = `${commentChar} EPISTLE ${id}: ${context.topic}
${dialogLines}`;

		return block;
	}

	/**
	 * Insert inline epistle above selection in editor
	 *
	 * @rhizome: Why return true/false?
	 * So callers know if insertion succeeded (editor might be closed, etc).
	 */
	static insertAboveSelection(
		editor: vscode.TextEditor,
		commentBlock: string
	): boolean {
		try {
			editor.edit(editBuilder => {
				const insertPosition = editor.selection.start;
				editBuilder.insert(insertPosition, commentBlock + '\n');
			});
			return true;
		} catch (e) {
			console.error(`Failed to insert inline epistle: ${e}`);
			return false;
		}
	}

	/**
	 * Generate registry entry for inline epistle
	 */
	static generateRegistryEntry(
		id: string,
		context: EpisodeContext
	): EpistleRegistryEntry {
		return {
			id,
			type: 'inline',
			date: new Date().toISOString().split('T')[0],
			personas: context.personas,
			inline_file: context.selectedFile,
			lines: `${context.selectedLines.start}-${context.selectedLines.end}`,
			keywords: [context.topic, ...context.personas],
			context: [context.selectedFile],
		};
	}
}

/**
 * Dynamic persona generator
 *
 * Analyzes a source file and synthesizes a persona that represents its perspective.
 */
export interface FileAnalysis {
	filepath: string;
	language: string;
	imports: string[];
	errorPatterns: string[];
	typeSafety: 'strict' | 'lenient' | 'mixed';
	namingStyle: 'semantic' | 'brief' | 'mixed';
	structure: 'monolithic' | 'modular' | 'mixed';
	mainConcerns: string[];
}

export class DynamicPersonaGenerator {
	/**
	 * Analyze a source file to understand its perspective
	 *
	 * @rhizome: How do we analyze a file?
	 * Extract:
	 * - Imports (what does it depend on?)
	 * - Error patterns (how does it handle errors?)
	 * - Type annotations (strict or lenient?)
	 * - Variable names (semantic or brief?)
	 * - Module structure (monolithic or modular?)
	 *
	 * This is a heuristic approach, not perfect AST parsing.
	 */
	static analyzeFile(filepath: string): FileAnalysis {
		const content = fs.readFileSync(filepath, 'utf-8');
		const language = this.detectLanguage(filepath);

		const imports = this.extractImports(content, language);
		const errorPatterns = this.findErrorPatterns(content, language);
		const typeSafety = this.analyzeTypeSafety(content, language);
		const namingStyle = this.analyzeNamingStyle(content);
		const structure = this.analyzeStructure(content, language);
		const mainConcerns = this.deriveMainConcerns(
			imports,
			errorPatterns,
			typeSafety,
			structure
		);

		return {
			filepath,
			language,
			imports,
			errorPatterns,
			typeSafety,
			namingStyle,
			structure,
			mainConcerns,
		};
	}

	/**
	 * Generate persona name and philosophy from file analysis
	 */
	static generatePersonaFromAnalysis(
		analysis: FileAnalysis
	): { name: string; philosophy: string; concerns: string[] } {
		const baseFileName = path.basename(analysis.filepath, path.extname(analysis.filepath));
		const name = `${baseFileName}-advocate`;

		const philosophyParts: string[] = [];

		// Add philosophy based on error handling
		if (analysis.errorPatterns.includes('try-catch')) {
			philosophyParts.push(
				'I believe in graceful error handling and recovery strategies'
			);
		} else if (analysis.errorPatterns.includes('error-result')) {
			philosophyParts.push(
				'I believe in explicit error types and Result-based error handling'
			);
		}

		// Add philosophy based on type safety
		if (analysis.typeSafety === 'strict') {
			philosophyParts.push('I care deeply about type safety and avoiding implicit coercions');
		} else if (analysis.typeSafety === 'lenient') {
			philosophyParts.push('I prefer flexibility and runtime type adaptability');
		}

		// Add philosophy based on structure
		if (analysis.structure === 'modular') {
			philosophyParts.push('I advocate for clear module boundaries and single responsibilities');
		} else if (analysis.structure === 'monolithic') {
			philosophyParts.push(
				'I focus on comprehensive context and tightly integrated concerns'
			);
		}

		// Add main concerns
		const concernsList = analysis.mainConcerns.join(', ');

		const philosophy =
			philosophyParts.length > 0
				? philosophyParts.join('. ') + '.'
				: `I represent the perspective of ${analysis.filepath}.`;

		return {
			name,
			philosophy,
			concerns: analysis.mainConcerns,
		};
	}

	/**
	 * Generate registry entry for dynamic persona
	 */
	static generateRegistryEntry(
		id: string,
		name: string,
		sourceFile: string
	): EpistleRegistryEntry {
		return {
			id,
			type: 'dynamic_persona',
			date: new Date().toISOString().split('T')[0],
			personas: [name],
			source_file: sourceFile,
			name,
			created_at: new Date().toISOString(),
			keywords: ['dynamic-persona', name],
		};
	}

	// ===== Private helper methods =====

	private static detectLanguage(filepath: string): string {
		const ext = path.extname(filepath).toLowerCase();
		const extMap: Record<string, string> = {
			'.ts': 'typescript',
			'.js': 'javascript',
			'.py': 'python',
			'.java': 'java',
			'.go': 'go',
			'.rs': 'rust',
			'.cpp': 'cpp',
			'.c': 'c',
			'.cs': 'csharp',
			'.rb': 'ruby',
		};
		return extMap[ext] || 'text';
	}

	private static extractImports(content: string, language: string): string[] {
		const imports: string[] = [];
		const importRegexes: Record<string, RegExp> = {
			typescript: /^import\s+.*\s+from\s+['"]([^'"]+)['"]/gm,
			javascript: /^import\s+.*\s+from\s+['"]([^'"]+)['"]/gm,
			python: /^import\s+(\S+)|^from\s+(\S+)\s+import/gm,
			java: /^import\s+([^;]+)/gm,
		};

		const regex = importRegexes[language];
		if (regex) {
			let match;
			while ((match = regex.exec(content)) !== null) {
				imports.push(match[1] || match[2] || match[0]);
			}
		}

		return [...new Set(imports)]; // Deduplicate
	}

	private static findErrorPatterns(content: string, language: string): string[] {
		const patterns: string[] = [];

		if (/try\s*{|catch\s*\(/m.test(content)) {
			patterns.push('try-catch');
		}
		if (/Result<|Ok\(|Err\(/m.test(content)) {
			patterns.push('error-result');
		}
		if (/throw new|raise /m.test(content)) {
			patterns.push('exceptions');
		}
		if (/if\s+\(.*error|if\s+\(!.*success/m.test(content)) {
			patterns.push('error-checking');
		}

		return patterns;
	}

	private static analyzeTypeSafety(
		content: string,
		language: string
	): 'strict' | 'lenient' | 'mixed' {
		const typeAnnotationCount = (content.match(/:\s*\w+|as\s+\w+|<\w+>/g) || []).length;
		const totalLines = content.split('\n').length;
		const typeAnnotationRatio = typeAnnotationCount / Math.max(totalLines, 1);

		if (typeAnnotationRatio > 0.3) {
			return 'strict';
		} else if (typeAnnotationRatio < 0.1) {
			return 'lenient';
		}
		return 'mixed';
	}

	private static analyzeNamingStyle(content: string): 'semantic' | 'brief' | 'mixed' {
		const names = content.match(/const\s+(\w+)|let\s+(\w+)|var\s+(\w+)|function\s+(\w+)/g) || [];
		const longNames = names.filter(n => n.split(/\s+/)[1].length > 10).length;
		const ratio = longNames / Math.max(names.length, 1);

		if (ratio > 0.5) {
			return 'semantic';
		} else if (ratio < 0.2) {
			return 'brief';
		}
		return 'mixed';
	}

	private static analyzeStructure(
		content: string,
		language: string
	): 'monolithic' | 'modular' | 'mixed' {
		const functionCount = (content.match(/function\s+\w+|const\s+\w+\s*=/g) || []).length;
		const exportCount = (content.match(/export\s+|module\.exports/g) || []).length;
		const linesPerFunction = content.split('\n').length / Math.max(functionCount, 1);

		if (exportCount > functionCount * 0.3) {
			return 'modular';
		} else if (linesPerFunction > 50) {
			return 'monolithic';
		}
		return 'mixed';
	}

	private static deriveMainConcerns(
		imports: string[],
		errorPatterns: string[],
		typeSafety: 'strict' | 'lenient' | 'mixed',
		structure: 'monolithic' | 'modular' | 'mixed'
	): string[] {
		const concerns: string[] = [];

		if (errorPatterns.length > 0) {
			concerns.push('Error handling and recovery');
		}
		if (typeSafety === 'strict') {
			concerns.push('Type safety and correctness');
		}
		if (structure === 'modular') {
			concerns.push('Module boundaries and separation of concerns');
		}
		if (imports.includes('react') || imports.includes('vue')) {
			concerns.push('Component lifecycle and UI behavior');
		}

		return concerns.length > 0
			? concerns
			: ['Core functionality and reliability'];
	}
}
