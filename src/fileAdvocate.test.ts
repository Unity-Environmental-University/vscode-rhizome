/**
 * Tests for File Advocate System
 *
 * Tests analyze(), generateFileAdvocateComment(), and advocate epistle generation.
 * Uses temporary files to test real file analysis.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { analyzeFile, generateFileAdvocateComment, createFileAdvocateEpistle, FileAnalysis } from './fileAdvocate';

/**
 * Test workspace: Create temp files and clean up after tests
 */
class TempFileManager {
	private tempDir: string;

	constructor() {
		this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-rhizome-'));
	}

	createFile(filename: string, content: string): string {
		const filepath = path.join(this.tempDir, filename);
		fs.writeFileSync(filepath, content, 'utf-8');
		return filepath;
	}

	cleanup() {
		if (fs.existsSync(this.tempDir)) {
			fs.rmSync(this.tempDir, { recursive: true });
		}
	}
}

describe('File Advocate System', () => {
	describe('analyzeFile()', () => {
		let temp: TempFileManager;

		beforeEach(() => {
			temp = new TempFileManager();
		});

		afterEach(() => {
			temp.cleanup();
		});

		it('should analyze a TypeScript file with imports and exports', async () => {
			const content = `
import * as vscode from 'vscode';
import { Epistle } from './epistle';

export class FileAnalyzer {
	async analyze() {
		return 'done';
	}
}

export function helperFunction() {}
`;

			const filepath = temp.createFile('test.ts', content);
			const analysis = await analyzeFile(filepath);

			assert.strictEqual(analysis.filename, 'test.ts');
			assert.strictEqual(analysis.language, 'TypeScript');
			assert.ok(analysis.imports.includes('vscode'));
			assert.ok(analysis.imports.includes('./epistle'));
			assert.ok(analysis.exports.includes('FileAnalyzer'));
			assert.ok(analysis.exports.includes('helperFunction'));
			assert.strictEqual(analysis.classes.length, 1);
			assert.ok(analysis.classes.includes('FileAnalyzer'));
		});

		it('should detect error handling patterns', async () => {
			const withErrorHandling = `
export function safeFn() {
	try {
		doSomething();
	} catch (error) {
		console.error(error);
	}
}
`;

			const filepath = temp.createFile('safe.ts', withErrorHandling);
			const analysis = await analyzeFile(filepath);

			assert.strictEqual(analysis.concerns.errorHandling, 'present');
		});

		it('should detect minimal error handling', async () => {
			const withThrow = `
export function throwsFn() {
	throw new Error('Not implemented');
}
`;

			const filepath = temp.createFile('throws.ts', withThrow);
			const analysis = await analyzeFile(filepath);

			assert.strictEqual(analysis.concerns.errorHandling, 'minimal');
		});

		it('should detect absent error handling', async () => {
			const noErrors = `
export function simpleFn() {
	return 42;
}
`;

			const filepath = temp.createFile('simple.ts', noErrors);
			const analysis = await analyzeFile(filepath);

			assert.strictEqual(analysis.concerns.errorHandling, 'absent');
		});

		it('should detect test files', async () => {
			const testContent = 'describe("tests", () => {})';

			const filepath = temp.createFile('example.test.ts', testContent);
			const analysis = await analyzeFile(filepath);

			assert.strictEqual(analysis.concerns.testCoverage, true);
		});

		it('should detect file role as entry-point for extension.ts', async () => {
			const content = 'export function activate() {}';

			const filepath = temp.createFile('extension.ts', content);
			const analysis = await analyzeFile(filepath);

			assert.strictEqual(analysis.role, 'entry-point');
		});

		it('should detect file role as generator for Generator-named files', async () => {
			const content = 'export class StubGenerator {}';

			const filepath = temp.createFile('stubGenerator.ts', content);
			const analysis = await analyzeFile(filepath);

			assert.strictEqual(analysis.role, 'generator');
		});

		it('should detect file role as registry for Registry-named files', async () => {
			const content = 'export class EpistleRegistry {}';

			const filepath = temp.createFile('epistleRegistry.ts', content);
			const analysis = await analyzeFile(filepath);

			assert.strictEqual(analysis.role, 'registry');
		});

		it('should estimate complexity from line count', async () => {
			const shortFile = 'export const x = 1;';
			const longFile = 'export const x = 1;\n' + 'const y = i;\n'.repeat(600);

			const shortPath = temp.createFile('short.ts', shortFile);
			const longPath = temp.createFile('long.ts', longFile);

			const shortAnalysis = await analyzeFile(shortPath);
			const longAnalysis = await analyzeFile(longPath);

			assert.strictEqual(shortAnalysis.concerns.complexity, 'low');
			assert.strictEqual(longAnalysis.concerns.complexity, 'high');
		});

		it('should count imports and exports in concerns', async () => {
			const content = `
import { a } from 'x';
import { b } from 'y';
import { c } from 'z';
export function fn1() {}
export function fn2() {}
`;

			const filepath = temp.createFile('counted.ts', content);
			const analysis = await analyzeFile(filepath);

			assert.strictEqual(analysis.concerns.dependencies, 3);
			assert.strictEqual(analysis.concerns.exports, 2);
		});

		it('should detect documentation density as rich', async () => {
			const richDocs = `
// This function does X
// It is important because Y
export function fn() {
	// Implementation note
	return 42;
}
`;

			const filepath = temp.createFile('documented.ts', richDocs);
			const analysis = await analyzeFile(filepath);

			assert.strictEqual(analysis.concerns.documentation, 'rich');
		});

		it('should detect documentation as sparse', async () => {
			const sparseDocs = 'export function fn() { return 42; }';

			const filepath = temp.createFile('undocumented.ts', sparseDocs);
			const analysis = await analyzeFile(filepath);

			assert.strictEqual(analysis.concerns.documentation, 'sparse');
		});

		it('should throw when file does not exist', async () => {
			try {
				await analyzeFile('/nonexistent/file.ts');
				assert.fail('Should have thrown');
			} catch (error) {
				assert.ok(error instanceof Error);
			}
		});

		it('should handle interfaces in analysis', async () => {
			const content = `
export interface Config {
	name: string;
}

export interface Runner {
	run(): void;
}
`;

			const filepath = temp.createFile('interfaces.ts', content);
			const analysis = await analyzeFile(filepath);

			assert.strictEqual(analysis.interfaces.length, 2);
			assert.ok(analysis.interfaces.includes('Config'));
			assert.ok(analysis.interfaces.includes('Runner'));
		});

		it('should generate summary with role and export count', async () => {
			const content = `
export function fn1() {}
export function fn2() {}
`;

			const filepath = temp.createFile('utility.ts', content);
			const analysis = await analyzeFile(filepath);

			assert.ok(analysis.summary.includes('2 functions'));
		});
	});

	describe('generateFileAdvocateComment()', () => {
		let temp: TempFileManager;

		beforeEach(() => {
			temp = new TempFileManager();
		});

		afterEach(() => {
			temp.cleanup();
		});

		it('should generate TypeScript comment with persona header', () => {
			const content = `
import { a } from 'x';
export function fn() {}
`;

			const filepath = temp.createFile('test.ts', content);
			const analysis: FileAnalysis = {
				filepath,
				filename: 'test.ts',
				language: 'TypeScript',
				size: 100,
				lines: 5,
				imports: ['x'],
				exports: ['fn'],
				classes: [],
				functions: [],
				interfaces: [],
				concerns: {
					errorHandling: 'absent',
					testCoverage: false,
					documentation: 'sparse',
					complexity: 'low',
					dependencies: 1,
					exports: 1,
				},
				role: 'utility',
				summary: 'Utility exports 1 function',
			};

			const comment = generateFileAdvocateComment(analysis, 'code-reviewer', 'This is a simple utility', 'typescript');

			assert.ok(comment.includes('// [code-reviewer]'));
			assert.ok(comment.includes('Utility exports 1 function'));
		});

		it('should generate Python comment with # prefix', () => {
			const analysis: FileAnalysis = {
				filepath: 'test.py',
				filename: 'test.py',
				language: 'Python',
				size: 100,
				lines: 5,
				imports: [],
				exports: [],
				classes: [],
				functions: [],
				interfaces: [],
				concerns: {
					errorHandling: 'absent',
					testCoverage: false,
					documentation: 'sparse',
					complexity: 'low',
					dependencies: 0,
					exports: 0,
				},
				role: 'unknown',
				summary: 'test.py',
			};

			const comment = generateFileAdvocateComment(analysis, 'dev-guide', '', 'python');

			assert.ok(comment.includes('# [dev-guide]'));
		});

		it('should mention export names in comment', () => {
			const analysis: FileAnalysis = {
				filepath: 'test.ts',
				filename: 'test.ts',
				language: 'TypeScript',
				size: 100,
				lines: 5,
				imports: [],
				exports: ['fn1', 'fn2', 'fn3'],
				classes: [],
				functions: [],
				interfaces: [],
				concerns: {
					errorHandling: 'absent',
					testCoverage: false,
					documentation: 'sparse',
					complexity: 'low',
					dependencies: 0,
					exports: 3,
				},
				role: 'utility',
				summary: 'Utility with functions',
			};

			const comment = generateFileAdvocateComment(analysis, 'code-reviewer', '', 'typescript');

			assert.ok(comment.includes('Exports: fn1, fn2, fn3'));
		});

		it('should include concern flags when appropriate', () => {
			const analysis: FileAnalysis = {
				filepath: 'test.ts',
				filename: 'test.ts',
				language: 'TypeScript',
				size: 100,
				lines: 5,
				imports: [],
				exports: [],
				classes: [],
				functions: [],
				interfaces: [],
				concerns: {
					errorHandling: 'absent',
					testCoverage: false,
					documentation: 'sparse',
					complexity: 'high',
					dependencies: 0,
					exports: 0,
				},
				role: 'unknown',
				summary: 'test.ts',
			};

			const comment = generateFileAdvocateComment(analysis, 'code-reviewer', '', 'typescript');

			assert.ok(comment.includes('Concern:'));
			assert.ok(comment.includes('complexity'));
		});
	});

	describe('createFileAdvocateEpistle()', () => {
		let temp: TempFileManager;

		beforeEach(() => {
			temp = new TempFileManager();
		});

		afterEach(() => {
			temp.cleanup();
		});

		it('should create epistle with file overview section', async () => {
			const content = 'export function fn() {}';
			const filepath = temp.createFile('test.ts', content);
			const analysis = await analyzeFile(filepath);

			const epistle = createFileAdvocateEpistle(analysis, 'code-reviewer', 'This is a simple function');

			assert.ok(epistle.includes('# File Advocate: test.ts'));
			assert.ok(epistle.includes('**Persona:** code-reviewer'));
			assert.ok(epistle.includes('## File Overview'));
		});

		it('should include file path in epistle', async () => {
			const content = 'export function fn() {}';
			const filepath = temp.createFile('example.ts', content);
			const analysis = await analyzeFile(filepath);

			const epistle = createFileAdvocateEpistle(analysis, 'code-reviewer', '');

			assert.ok(epistle.includes(`\`${filepath}\``));
		});

		it('should include structural analysis section', async () => {
			const content = `
import { a } from 'x';
try {
	doSomething();
} catch (e) {}
export function fn() {}
`;

			const filepath = temp.createFile('analyzed.ts', content);
			const analysis = await analyzeFile(filepath);

			const epistle = createFileAdvocateEpistle(analysis, 'code-reviewer', '');

			assert.ok(epistle.includes('## Structural Analysis'));
			assert.ok(epistle.includes('Dependencies:'));
			assert.ok(epistle.includes('Error Handling:'));
		});

		it('should include persona perspective section', async () => {
			const content = 'export function fn() {}';
			const filepath = temp.createFile('test.ts', content);
			const analysis = await analyzeFile(filepath);

			const opinion = 'This file needs better error handling';
			const epistle = createFileAdvocateEpistle(analysis, 'code-reviewer', opinion);

			assert.ok(epistle.includes(opinion));
		});

		it('should include concerns and review areas', async () => {
			const content = 'export function fn() {}';
			const filepath = temp.createFile('test.ts', content);
			const analysis = await analyzeFile(filepath);

			const epistle = createFileAdvocateEpistle(analysis, 'code-reviewer', '');

			assert.ok(epistle.includes('### Concerns'));
			assert.ok(epistle.includes('### Questions to Consider'));
		});
	});
});
