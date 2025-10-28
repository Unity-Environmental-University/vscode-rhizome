/**
 * Tests for Epistle System
 *
 * Tests registry management and epistle generation across all three formats:
 * - Letter epistles (file-based)
 * - Inline epistles (comment-embedded)
 * - Dynamic personas (synthesized from file analysis)
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
	EpistleRegistry,
	EpistleRegistryEntry,
	createEpistleRegistry,
} from './epistleRegistry';
import {
	LetterEpistleGenerator,
	InlineEpistleGenerator,
	DynamicPersonaGenerator,
	FileAnalysis,
	EpisodeContext,
} from './epistleGenerator';

/**
 * Test fixture: Temporary directory management
 */
class TempWorkspace {
	private tempDir: string;

	constructor() {
		this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'epistle-test-'));
	}

	getRootPath(): string {
		return this.tempDir;
	}

	getEpistlesDir(): string {
		const dir = path.join(this.tempDir, '.rhizome', 'plugins', 'epistles');
		fs.mkdirSync(dir, { recursive: true });
		return dir;
	}

	cleanup(): void {
		if (fs.existsSync(this.tempDir)) {
			fs.rmSync(this.tempDir, { recursive: true, force: true });
		}
	}
}

describe('Epistle System', () => {
	describe('Registry: Load and Save', () => {
		let workspace: TempWorkspace;

		beforeEach(() => {
			workspace = new TempWorkspace();
		});

		afterEach(() => {
			workspace.cleanup();
		});

		it('should create registry if it does not exist', () => {
			const registry = createEpistleRegistry(workspace.getRootPath());
			assert.strictEqual(registry.getAllEntries().length, 0);
		});

		it('should save and load registry entries', () => {
			const registry = createEpistleRegistry(workspace.getRootPath());

			const entry: EpistleRegistryEntry = {
				id: 'epistle-001',
				type: 'letter',
				date: '2025-10-28',
				personas: ['dev-guide', 'code-reviewer'],
				topic: 'Error handling',
				status: 'draft',
				file: 'epistle-001.md',
			};

			registry.addEntry(entry);

			// Load registry again
			const registry2 = createEpistleRegistry(workspace.getRootPath());
			assert.strictEqual(registry2.getAllEntries().length, 1);
			assert.deepStrictEqual(registry2.getEntry('epistle-001'), entry);
		});
	});

	describe('Registry: Query and Filter', () => {
		let registry: EpistleRegistry;
		let workspace: TempWorkspace;

		beforeEach(() => {
			workspace = new TempWorkspace();
			registry = createEpistleRegistry(workspace.getRootPath());

			// Add test entries
			registry.addEntry({
				id: 'epistle-001',
				type: 'letter',
				date: '2025-10-28',
				personas: ['dev-guide', 'code-reviewer'],
				topic: 'Error handling',
				status: 'draft',
				file: 'epistle-001.md',
			});

			registry.addEntry({
				id: 'inline-001',
				type: 'inline',
				date: '2025-10-28',
				personas: ['dev-guide'],
				inline_file: 'src/extension.ts',
				lines: '148-151',
			});

			registry.addEntry({
				id: 'persona-parser',
				type: 'dynamic_persona',
				date: '2025-10-28',
				personas: ['parser-advocate'],
				source_file: 'src/parser.ts',
				name: 'parser-advocate',
				created_at: new Date().toISOString(),
			});
		});

		afterEach(() => {
			workspace.cleanup();
		});

		it('should filter by type', () => {
			assert.strictEqual(registry.getEntriesByType('letter').length, 1);
			assert.strictEqual(registry.getEntriesByType('inline').length, 1);
			assert.strictEqual(registry.getEntriesByType('dynamic_persona').length, 1);
		});

		it('should filter by persona', () => {
			const devGuideEpistles = registry.getEntriesByPersona('dev-guide');
			assert.strictEqual(devGuideEpistles.length, 2);
		});

		it('should filter by date', () => {
			const todayEpistles = registry.getEntriesByDate('2025-10-28');
			assert.strictEqual(todayEpistles.length, 3);
		});

		it('should get inline epistles in a specific file', () => {
			const inlineInExt = registry.getInlineEpistlesInFile('src/extension.ts');
			assert.strictEqual(inlineInExt.length, 1);
		});

		it('should get dynamic personas', () => {
			const personas = registry.getDynamicPersonas();
			assert.strictEqual(personas.length, 1);
			assert.strictEqual(personas[0].name, 'parser-advocate');
		});
	});

	describe('Registry: ID Generation', () => {
		let registry: EpistleRegistry;
		let workspace: TempWorkspace;

		beforeEach(() => {
			workspace = new TempWorkspace();
			registry = createEpistleRegistry(workspace.getRootPath());
		});

		afterEach(() => {
			workspace.cleanup();
		});

		it('should generate unique letter IDs', () => {
			const id1 = registry.generateId('letter', 'Error handling');
			const id2 = registry.generateId('letter', 'Error handling');
			assert.notStrictEqual(id1, id2);
			assert.ok(/epistle-\d+-error-handling-[a-z0-9]+/.test(id1));
		});

		it('should generate unique inline IDs', () => {
			const id1 = registry.generateId('inline');
			const id2 = registry.generateId('inline');
			assert.notStrictEqual(id1, id2);
			assert.ok(/inline-epistle-\d+-[a-z0-9]+/.test(id1));
		});

		it('should generate unique persona IDs', () => {
			const id1 = registry.generateId('dynamic_persona', 'parser.ts');
			const id2 = registry.generateId('dynamic_persona', 'parser.ts');
			assert.notStrictEqual(id1, id2);
			assert.ok(/persona-parser-ts-\d+-[a-z0-9]+/.test(id1));
		});
	});

	describe('Letter Epistle: Generation', () => {
		it('should generate epistle markdown content', () => {
			const context: EpisodeContext = {
				selectedCode: 'const x = 42;',
				selectedFile: 'src/test.ts',
				selectedLines: { start: 10, end: 11 },
				personas: ['dev-guide', 'code-reviewer'],
				topic: 'Constant naming',
				flightPlan: 'fp-001',
				language: 'typescript',
			};

			const content = LetterEpistleGenerator.generateContent(context, 'epistle-001');

			assert.ok(content.includes('# Epistle: dev-guide ↔ code-reviewer'));
			assert.ok(content.includes('**Date**:'));
			assert.ok(content.includes('Constant naming'));
			assert.ok(content.includes('test.ts:10-11'));
			assert.ok(content.includes('fp-001'));
			assert.ok(content.includes('**Status**: draft'));
			assert.ok(content.includes('const x = 42;'));
		});

		it('should create epistle file in epistles directory', () => {
			const workspace = new TempWorkspace();
			const epistlesDir = workspace.getEpistlesDir();

			const context: EpisodeContext = {
				selectedCode: 'function test() {}',
				selectedFile: 'src/test.ts',
				selectedLines: { start: 1, end: 1 },
				personas: ['dev-guide'],
				topic: 'Function naming',
				language: 'typescript',
			};

			const result = LetterEpistleGenerator.createFile(
				context,
				'epistle-test-001',
				epistlesDir
			);

			assert.ok(fs.existsSync(result.filePath));
			const content = fs.readFileSync(result.filePath, 'utf-8');
			assert.ok(content.includes('# Epistle: dev-guide'));

			workspace.cleanup();
		});

		it('should generate correct registry entry', () => {
			const context: EpisodeContext = {
				selectedCode: 'test',
				selectedFile: 'src/test.ts',
				selectedLines: { start: 1, end: 1 },
				personas: ['dev-guide'],
				topic: 'Testing',
				flightPlan: 'fp-001',
			};

			const entry = LetterEpistleGenerator.generateRegistryEntry(
				'epistle-001',
				context,
				'epistle-001.md'
			);

			assert.strictEqual(entry.id, 'epistle-001');
			assert.strictEqual(entry.type, 'letter');
			assert.strictEqual(entry.topic, 'Testing');
			assert.strictEqual(entry.file, 'epistle-001.md');
			assert.strictEqual(entry.flight_plan, 'fp-001');
		});
	});

	describe('Inline Epistle: Generation', () => {
		it('should generate comment block with correct syntax', () => {
			const context: EpisodeContext = {
				selectedCode: 'const x = 42;',
				selectedFile: 'src/test.ts',
				selectedLines: { start: 10, end: 11 },
				personas: ['dev-guide', 'code-reviewer'],
				topic: 'Variable naming',
				language: 'typescript',
			};

			const block = InlineEpistleGenerator.generateCommentBlock(context, 'inline-001');

			assert.ok(/\/\/ EPISTLE inline-001: Variable naming/.test(block));
			assert.ok(/\/\/ dev-guide: \[response pending\]/.test(block));
			assert.ok(/\/\/ code-reviewer: \[response pending\]/.test(block));
		});

		it('should use correct comment syntax for different languages', () => {
			const testCases = [
				{ language: 'typescript', expected: '//' },
				{ language: 'python', expected: '#' },
				{ language: 'java', expected: '//' },
			];

			for (const testCase of testCases) {
				const context: EpisodeContext = {
					selectedCode: 'test',
					selectedFile: 'test.src',
					selectedLines: { start: 1, end: 1 },
					personas: ['dev-guide'],
					topic: 'Test',
					language: testCase.language,
				};

				const block = InlineEpistleGenerator.generateCommentBlock(context, 'inline-001');
				assert.ok(new RegExp(`${testCase.expected} EPISTLE`).test(block));
			}
		});

		it('should generate correct registry entry', () => {
			const context: EpisodeContext = {
				selectedCode: 'test',
				selectedFile: 'src/test.ts',
				selectedLines: { start: 10, end: 15 },
				personas: ['dev-guide'],
				topic: 'Testing inline',
			};

			const entry = InlineEpistleGenerator.generateRegistryEntry('inline-001', context);

			assert.strictEqual(entry.id, 'inline-001');
			assert.strictEqual(entry.type, 'inline');
			assert.strictEqual(entry.inline_file, 'src/test.ts');
			assert.strictEqual(entry.lines, '10-15');
		});
	});

	describe('Dynamic Persona: File Analysis', () => {
		it('should analyze a typescript file', () => {
			const workspace = new TempWorkspace();
			const testFile = path.join(workspace.getRootPath(), 'test.ts');

			const content = `
import * as fs from 'fs';
import * as path from 'path';

export interface Config {
  name: string;
  value: number;
}

export class FileParser {
  private data: string[] = [];

  constructor(private filepath: string) {}

  public parse(): Config {
    try {
      const content = fs.readFileSync(this.filepath, 'utf-8');
      return this.parseContent(content);
    } catch (error) {
      throw new Error(\`Failed to parse: \${error}\`);
    }
  }

  private parseContent(content: string): Config {
    // parsing logic
    return { name: 'test', value: 42 };
  }
}
`;

			fs.writeFileSync(testFile, content);

			const analysis = DynamicPersonaGenerator.analyzeFile(testFile);

			assert.strictEqual(analysis.language, 'typescript');
			assert.ok(analysis.imports.includes('fs'));
			assert.ok(analysis.errorPatterns.includes('try-catch'));
			assert.strictEqual(analysis.typeSafety, 'strict');

			workspace.cleanup();
		});

		it('should generate persona from file analysis', () => {
			const analysis: FileAnalysis = {
				filepath: 'src/parser.ts',
				language: 'typescript',
				imports: ['fs', 'path'],
				errorPatterns: ['try-catch', 'error-checking'],
				typeSafety: 'strict',
				namingStyle: 'semantic',
				structure: 'modular',
				mainConcerns: ['Error handling', 'Type safety', 'Modularity'],
			};

			const persona = DynamicPersonaGenerator.generatePersonaFromAnalysis(analysis);

			assert.strictEqual(persona.name, 'parser-advocate');
			assert.ok(/error handling|recovery/i.test(persona.philosophy));
			assert.ok(/type safety/i.test(persona.philosophy));
			assert.ok(persona.concerns.includes('Error handling'));
		});

		it('should generate registry entry for dynamic persona', () => {
			const entry = DynamicPersonaGenerator.generateRegistryEntry(
				'persona-parser',
				'parser-advocate',
				'src/parser.ts'
			);

			assert.strictEqual(entry.id, 'persona-parser');
			assert.strictEqual(entry.type, 'dynamic_persona');
			assert.strictEqual(entry.name, 'parser-advocate');
			assert.strictEqual(entry.source_file, 'src/parser.ts');
		});
	});

	describe('Integration: Full Workflow', () => {
		let workspace: TempWorkspace;
		let registry: EpistleRegistry;

		beforeEach(() => {
			workspace = new TempWorkspace();
			registry = createEpistleRegistry(workspace.getRootPath());
		});

		afterEach(() => {
			workspace.cleanup();
		});

		it('should create letter epistle and register it', () => {
			const epistlesDir = workspace.getEpistlesDir();

			const context: EpisodeContext = {
				selectedCode: 'const x = 42;',
				selectedFile: 'src/test.ts',
				selectedLines: { start: 10, end: 11 },
				personas: ['dev-guide', 'code-reviewer'],
				topic: 'Constant naming',
				language: 'typescript',
			};

			const id = registry.generateId('letter', context.topic);
			const { filePath } = LetterEpistleGenerator.createFile(context, id, epistlesDir);
			const entry = LetterEpistleGenerator.generateRegistryEntry(
				id,
				context,
				path.basename(filePath)
			);

			registry.addEntry(entry);

			// Verify
			assert.ok(fs.existsSync(filePath));
			assert.strictEqual(registry.getEntry(id)?.type, 'letter');
			assert.strictEqual(registry.getEntry(id)?.topic, 'Constant naming');
		});

		it('should create inline epistle and register it', () => {
			const context: EpisodeContext = {
				selectedCode: 'const x = 42;',
				selectedFile: 'src/test.ts',
				selectedLines: { start: 10, end: 11 },
				personas: ['dev-guide'],
				topic: 'Naming',
				language: 'typescript',
			};

			const id = registry.generateId('inline');
			const block = InlineEpistleGenerator.generateCommentBlock(context, id);
			const entry = InlineEpistleGenerator.generateRegistryEntry(id, context);

			registry.addEntry(entry);

			// Verify
			assert.match(block, /EPISTLE/);
			assert.strictEqual(registry.getEntry(id)?.type, 'inline');
			assert.strictEqual(registry.getEntry(id)?.inline_file, 'src/test.ts');
		});

		it('should create dynamic persona and register it', () => {
			const id = registry.generateId('dynamic_persona', 'test');
			const entry = DynamicPersonaGenerator.generateRegistryEntry(
				id,
				'test-advocate',
				'src/test.ts'
			);

			registry.addEntry(entry);

			// Verify
			assert.strictEqual(registry.getEntry(id)?.type, 'dynamic_persona');
			assert.strictEqual(registry.getEntry(id)?.name, 'test-advocate');

			const personas = registry.getDynamicPersonas();
			assert.strictEqual(personas.length, 1);
		});
	});
});
