/**
 * Tests for Epistle Sidebar Provider
 *
 * Tests the tree view functionality:
 * - Loading epistles from registry
 * - Categorizing by type/persona/date/flight-plan
 * - Filtering and search
 * - Tree item rendering
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EpistleSidebarProvider, EpistleTreeItem, EpistleCategory } from './epistleSidebarProvider';
import { createEpistleRegistry, EpistleRegistryEntry } from './epistleRegistry';

/**
 * Test fixture: Temporary workspace
 */
class TestWorkspace {
	private tempDir: string;

	constructor() {
		this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'epistle-sidebar-test-'));
	}

	getRootPath(): string {
		return this.tempDir;
	}

	cleanup(): void {
		if (fs.existsSync(this.tempDir)) {
			fs.rmSync(this.tempDir, { recursive: true, force: true });
		}
	}
}

describe('Epistle Sidebar Provider', () => {
	describe('EpistleTreeItem', () => {
		let workspace: TestWorkspace;

		beforeEach(() => {
			workspace = new TestWorkspace();
		});

		afterEach(() => {
			workspace.cleanup();
		});

		it('should create tree item for letter epistle', () => {
			const entry: EpistleRegistryEntry = {
				id: 'epistle-001',
				type: 'letter',
				date: '2025-10-28',
				personas: ['dev-guide', 'code-reviewer'],
				topic: 'Error handling',
				status: 'draft',
				file: 'epistle-001.md',
			};

			const item = new EpistleTreeItem(entry, workspace.getRootPath());
			const description = typeof item.description === 'string' ? item.description : '';

			assert.strictEqual(item.label, 'Error handling');
			assert.ok(description.includes('2025-10-28'));
			assert.ok(description.includes('draft'));
		});

		it('should create tree item for inline epistle', () => {
			const entry: EpistleRegistryEntry = {
				id: 'inline-001',
				type: 'inline',
				date: '2025-10-28',
				personas: ['dev-guide'],
				inline_file: 'src/extension.ts',
				lines: '148-151',
			};

			const item = new EpistleTreeItem(entry, workspace.getRootPath());
			const label = typeof item.label === 'string' ? item.label : '';

			assert.ok(label.includes('extension.ts'));
			assert.ok(label.includes('lines'));
		});

		it('should create tree item for dynamic persona', () => {
			const entry: EpistleRegistryEntry = {
				id: 'persona-parser',
				type: 'dynamic_persona',
				date: '2025-10-28',
				personas: ['parser-advocate'],
				source_file: 'src/parser.ts',
				name: 'parser-advocate',
				created_at: new Date().toISOString(),
			};

			const item = new EpistleTreeItem(entry, workspace.getRootPath());
			const label = typeof item.label === 'string' ? item.label : '';

			assert.ok(label.includes('parser-advocate'));
		});
	});

	describe('EpistleSidebarProvider: Categorization', () => {
		let provider: EpistleSidebarProvider;
		let workspace: TestWorkspace;

		beforeEach(() => {
			workspace = new TestWorkspace();
			const registry = createEpistleRegistry(workspace.getRootPath());

			// Add test entries
			registry.addEntry({
				id: 'letter-1',
				type: 'letter',
				date: '2025-10-28',
				personas: ['dev-guide'],
				topic: 'Error handling',
				file: 'epistle-001.md',
			});

			registry.addEntry({
				id: 'letter-2',
				type: 'letter',
				date: '2025-10-27',
				personas: ['code-reviewer'],
				topic: 'Type safety',
				file: 'epistle-002.md',
			});

			registry.addEntry({
				id: 'inline-1',
				type: 'inline',
				date: '2025-10-28',
				personas: ['dev-guide'],
				inline_file: 'src/extension.ts',
				lines: '100-105',
			});

			registry.addEntry({
				id: 'persona-1',
				type: 'dynamic_persona',
				date: '2025-10-28',
				personas: ['extension-advocate'],
				source_file: 'src/extension.ts',
				name: 'extension-advocate',
			});

			provider = new EpistleSidebarProvider(registry, workspace.getRootPath());
		});

		afterEach(() => {
			workspace.cleanup();
		});

		it('should categorize epistles by type', async () => {
			provider.setFilterMode('type');
			const categories = await provider.getChildren() as EpistleCategory[];

			assert.strictEqual(categories.length, 3); // Letters, Inline, Dynamic personas
			assert.ok(categories.some(c => c.label?.includes('Letter')));
			assert.ok(categories.some(c => c.label?.includes('Inline')));
			assert.ok(categories.some(c => c.label?.includes('Dynamic')));
		});

		it('should categorize epistles by persona', async () => {
			provider.setFilterMode('persona');
			const categories = await provider.getChildren() as EpistleCategory[];

			assert.strictEqual(categories.length, 3); // dev-guide, code-reviewer, extension-advocate
			const personaLabels = categories.map(c => c.label?.toString() || '');
			assert.ok(personaLabels.some(l => l.includes('dev-guide')));
			assert.ok(personaLabels.some(l => l.includes('code-reviewer')));
		});

		it('should categorize epistles by date', async () => {
			provider.setFilterMode('date');
			const categories = await provider.getChildren() as EpistleCategory[];

			assert.ok(categories.length > 0);
			assert.ok(categories.some(c => c.label?.includes('Today')));
		});

		it('should categorize epistles by flight plan', async () => {
			provider.setFilterMode('flight-plan');
			const categories = await provider.getChildren() as EpistleCategory[];

			// Should have at least one category (Unlinked, since none are linked)
			assert.ok(categories.length > 0);
		});
	});

	describe('EpistleSidebarProvider: Search and Filter', () => {
		let provider: EpistleSidebarProvider;
		let workspace: TestWorkspace;

		beforeEach(() => {
			workspace = new TestWorkspace();
			const registry = createEpistleRegistry(workspace.getRootPath());

			registry.addEntry({
				id: 'letter-1',
				type: 'letter',
				date: '2025-10-28',
				personas: ['dev-guide'],
				topic: 'Error handling strategy',
				file: 'epistle-001.md',
				keywords: ['error', 'handling', 'strategy'],
			});

			registry.addEntry({
				id: 'letter-2',
				type: 'letter',
				date: '2025-10-28',
				personas: ['code-reviewer'],
				topic: 'Type safety in modules',
				file: 'epistle-002.md',
				keywords: ['type', 'safety', 'modules'],
			});

			provider = new EpistleSidebarProvider(registry, workspace.getRootPath());
		});

		afterEach(() => {
			workspace.cleanup();
		});

		it('should filter epistles by search query', async () => {
			provider.setSearchQuery('error');
			const categories = await provider.getChildren() as EpistleCategory[];

			// Should only have one category with "error handling" epistle
			let totalEpistles = 0;
			for (const category of categories) {
				totalEpistles += category.entries.length;
			}

			assert.strictEqual(totalEpistles, 1);
		});

		it('should match keywords in search', async () => {
			provider.setSearchQuery('type');
			const categories = await provider.getChildren() as EpistleCategory[];

			let totalEpistles = 0;
			for (const category of categories) {
				totalEpistles += category.entries.length;
			}

			assert.strictEqual(totalEpistles, 1);
			assert.ok(categories[0].entries[0].topic?.includes('Type'));
		});
	});

	describe('EpistleSidebarProvider: Tree Navigation', () => {
		let provider: EpistleSidebarProvider;
		let workspace: TestWorkspace;

		beforeEach(() => {
			workspace = new TestWorkspace();
			const registry = createEpistleRegistry(workspace.getRootPath());

			registry.addEntry({
				id: 'letter-1',
				type: 'letter',
				date: '2025-10-28',
				personas: ['dev-guide'],
				topic: 'Error handling',
				file: 'epistle-001.md',
			});

			provider = new EpistleSidebarProvider(registry, workspace.getRootPath());
		});

		afterEach(() => {
			workspace.cleanup();
		});

		it('should expand category to show epistles', async () => {
			provider.setFilterMode('type');
			const categories = await provider.getChildren() as EpistleCategory[];

			const lettersCategory = categories.find(c => {
				const label = typeof c.label === 'string' ? c.label : '';
				return label.includes('Letter');
			});
			assert.ok(lettersCategory);

			const epistles = await provider.getChildren(lettersCategory) as EpistleTreeItem[];
			assert.strictEqual(epistles.length, 1);
			const label = typeof epistles[0].label === 'string' ? epistles[0].label : '';
			assert.ok(label.includes('Error handling'));
		});

		it('should return empty for leaf nodes', async () => {
			provider.setFilterMode('type');
			const categories = await provider.getChildren() as EpistleCategory[];
			const lettersCategory = categories.find(c => c.label?.includes('Letter'));
			const epistles = await provider.getChildren(lettersCategory) as EpistleTreeItem[];
			const firstEpistle = epistles[0];

			// Epistle items have no children
			const children = await provider.getChildren(firstEpistle);
			assert.strictEqual(children.length, 0);
		});
	});
});
