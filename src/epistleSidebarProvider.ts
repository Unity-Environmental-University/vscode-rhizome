/**
 * Epistle Registry Sidebar Provider
 *
 * Provides a TreeView in the sidebar showing all epistles from the registry.
 * Users can browse, filter, and open epistles.
 *
 * @rhizome: Why a separate provider?
 * VSCode's TreeDataProvider is a specific interface (register once, update on demand).
 * This keeps sidebar logic separate from registry management.
 * Registry = storage/querying (epistleRegistry.ts)
 * Provider = display/interaction (this file)
 * Command handlers = user workflows (extension.ts)
 */

import * as path from 'path';
import { EpistleRegistry, EpistleRegistryEntry } from './epistleRegistry';

// VSCode imports wrapped in conditional (for testing without vscode module)
let vscode: any;
try {
	vscode = require('vscode');
} catch {
	// vscode not available in test context
}

/**
 * Tree item for displaying an epistle in the sidebar
 *
 * @rhizome: What information should be visible?
 * - ID (for filtering/linking)
 * - Type (letter/inline/dynamic)
 * - Topic (for letters)
 * - Date (when it was created)
 * - Personas (who discussed it)
 * - Status (for letters: draft/resolved/archived)
 */
export class EpistleTreeItem {
	label: string;
	description: string;
	iconPath: any;
	command?: { title: string; command: string; arguments: any[] };
	collapsibleState?: number;

	constructor(
		public readonly entry: EpistleRegistryEntry,
		public readonly workspaceRoot: string
	) {
		// Build display label based on type
		this.label = EpistleTreeItem.buildLabel(entry);

		// Set collapsible state (for tree item compatibility)
		if (vscode) {
			this.collapsibleState = vscode.TreeItemCollapsibleState.None;
		}

		// Set icon based on type
		this.iconPath = this.getIconPath();

		// Set description (shows on the right)
		this.description = this.buildDescription();

		// Command to open the epistle
		this.command = {
			title: 'Open Epistle',
			command: 'vscode-rhizome.openEpistle',
			arguments: [entry, workspaceRoot],
		};
	}

	private static buildLabel(entry: EpistleRegistryEntry): string {
		switch (entry.type) {
			case 'letter':
				return entry.topic || `Letter ${entry.id}`;
			case 'inline':
				return `${path.basename(entry.inline_file || 'unknown')} (lines ${entry.lines})`;
			case 'dynamic_persona':
				return `👤 ${entry.name || entry.id}`;
		}
	}

	private buildDescription(): string {
		const parts: string[] = [];

		// Add date
		parts.push(this.entry.date);

		// Add personas
		if (this.entry.personas?.length > 0) {
			const personaStr =
				this.entry.personas.length === 1
					? this.entry.personas[0]
					: `${this.entry.personas.length} personas`;
			parts.push(personaStr);
		}

		// Add status for letters
		if (this.entry.status) {
			parts.push(`[${this.entry.status}]`);
		}

		return parts.join(' • ');
	}

	private getIconPath(): any {
		if (!vscode) {
			return undefined;
		}
		switch (this.entry.type) {
			case 'letter':
				return new vscode.ThemeIcon('mail');
			case 'inline':
				return new vscode.ThemeIcon('comment');
			case 'dynamic_persona':
				return new vscode.ThemeIcon('account');
		}
	}
}

/**
 * Tree category (grouping epistles by type, persona, date, etc.)
 */
export class EpistleCategory {
	contextValue = 'epistleCategory';

	constructor(
		public readonly label: string,
		public readonly entries: EpistleRegistryEntry[],
		public readonly collapsibleState: number = 1 // Collapsed by default
	) {}
}

/**
 * Epistle Registry Sidebar Provider
 *
 * Implements TreeDataProvider interface (if vscode available) to show epistles in the sidebar.
 */
export class EpistleSidebarProvider {
	private _onDidChangeTreeData: any; // EventEmitter<vscode.TreeItem | undefined | null | void>
	readonly onDidChangeTreeData: any; // Event<vscode.TreeItem | undefined | null | void>

	private filterMode: 'type' | 'persona' | 'date' | 'flight-plan' = 'type';
	private searchQuery: string = '';

	constructor(
		private registry: EpistleRegistry,
		private workspaceRoot: string
	) {
		// Initialize event emitter only if vscode is available
		if (vscode) {
			this._onDidChangeTreeData = new vscode.EventEmitter();
			this.onDidChangeTreeData = this._onDidChangeTreeData.event;
		}
	}

	/**
	 * Refresh the tree (called when registry changes)
	 */
	refresh(): void {
		if (this._onDidChangeTreeData) {
			this._onDidChangeTreeData.fire();
		}
	}

	/**
	 * Set filter mode and refresh
	 *
	 * @rhizome: Why expose this?
	 * Users might want to switch views: "Show me all letters" vs "Show me all by dev-guide"
	 * Quick picker to choose filter mode, then refresh.
	 */
	setFilterMode(mode: 'type' | 'persona' | 'date' | 'flight-plan'): void {
		this.filterMode = mode;
		this.searchQuery = '';
		this.refresh();
	}

	/**
	 * Set search query and refresh
	 */
	setSearchQuery(query: string): void {
		this.searchQuery = query;
		this.refresh();
	}

	/**
	 * Get root elements (top-level categories)
	 */
	async getChildren(
		element?: any
	): Promise<any[]> {
		// If no element, show categories at root
		if (!element) {
			return this.getRootCategories();
		}

		// If element is a category, show epistles in that category
		if (element instanceof EpistleCategory) {
			return element.entries.map(
				entry => new EpistleTreeItem(entry, this.workspaceRoot)
			);
		}

		return [];
	}

	/**
	 * Get root categories based on filter mode
	 *
	 * @rhizome: What should the hierarchy be?
	 * Type view: Letters → Inlines → Dynamic personas
	 * Persona view: dev-guide → code-reviewer → ... (one category per persona)
	 * Date view: Today → This week → This month → Older
	 * Flight plan view: fp-xxx → fp-yyy → Unlinked
	 */
	private getRootCategories(): EpistleCategory[] {
		let entries = this.registry.getAllEntries();

		// Apply search filter
		if (this.searchQuery.trim()) {
			entries = this.registry.search(this.searchQuery);
		}

		switch (this.filterMode) {
			case 'type':
				return this.categorizeByType(entries);
			case 'persona':
				return this.categorizeByPersona(entries);
			case 'date':
				return this.categorizeByDate(entries);
			case 'flight-plan':
				return this.categorizeByFlightPlan(entries);
		}
	}

	private categorizeByType(entries: EpistleRegistryEntry[]): EpistleCategory[] {
		const categories: EpistleCategory[] = [];

		const letters = entries.filter(e => e.type === 'letter');
		if (letters.length > 0) {
			categories.push(
				new EpistleCategory(
					`Letters (${letters.length})`,
					letters,
					0 // Expanded
				)
			);
		}

		const inlines = entries.filter(e => e.type === 'inline');
		if (inlines.length > 0) {
			categories.push(
				new EpistleCategory(
					`Inline Epistles (${inlines.length})`,
					inlines,
					1 // Collapsed
				)
			);
		}

		const personas = entries.filter(e => e.type === 'dynamic_persona');
		if (personas.length > 0) {
			categories.push(
				new EpistleCategory(
					`Dynamic Personas (${personas.length})`,
					personas,
					1 // Collapsed
				)
			);
		}

		return categories;
	}

	private categorizeByPersona(entries: EpistleRegistryEntry[]): EpistleCategory[] {
		const personaMap = new Map<string, EpistleRegistryEntry[]>();

		for (const entry of entries) {
			for (const persona of entry.personas) {
				if (!personaMap.has(persona)) {
					personaMap.set(persona, []);
				}
				personaMap.get(persona)!.push(entry);
			}
		}

		// Create categories, sorted by count (most active first)
		const categories: EpistleCategory[] = [];
		const sorted = Array.from(personaMap.entries()).sort(
			(a, b) => b[1].length - a[1].length
		);

		for (const [persona, epistles] of sorted) {
			categories.push(
				new EpistleCategory(
					`${persona} (${epistles.length})`,
					epistles,
					1 // Collapsed
				)
			);
		}

		return categories;
	}

	private categorizeByDate(entries: EpistleRegistryEntry[]): EpistleCategory[] {
		const today = new Date().toISOString().split('T')[0];
		const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
		const weekAgo = new Date(Date.now() - 604800000).toISOString().split('T')[0];

		const today_entries = entries.filter(e => e.date === today);
		const yesterday_entries = entries.filter(e => e.date === yesterday);
		const week_entries = entries.filter(
			e => e.date !== today && e.date !== yesterday && e.date >= weekAgo
		);
		const older_entries = entries.filter(e => e.date < weekAgo);

		const categories: EpistleCategory[] = [];

		if (today_entries.length > 0) {
			categories.push(
				new EpistleCategory(
					`Today (${today_entries.length})`,
					today_entries,
					0 // Expanded
				)
			);
		}

		if (yesterday_entries.length > 0) {
			categories.push(
				new EpistleCategory(
					`Yesterday (${yesterday_entries.length})`,
					yesterday_entries,
					1 // Collapsed
				)
			);
		}

		if (week_entries.length > 0) {
			categories.push(
				new EpistleCategory(
					`This Week (${week_entries.length})`,
					week_entries,
					1 // Collapsed
				)
			);
		}

		if (older_entries.length > 0) {
			categories.push(
				new EpistleCategory(
					`Older (${older_entries.length})`,
					older_entries,
					1 // Collapsed
				)
			);
		}

		return categories;
	}

	private categorizeByFlightPlan(entries: EpistleRegistryEntry[]): EpistleCategory[] {
		const flightPlanMap = new Map<string, EpistleRegistryEntry[]>();
		const unlinked: EpistleRegistryEntry[] = [];

		for (const entry of entries) {
			if (entry.flight_plan) {
				if (!flightPlanMap.has(entry.flight_plan)) {
					flightPlanMap.set(entry.flight_plan, []);
				}
				flightPlanMap.get(entry.flight_plan)!.push(entry);
			} else {
				unlinked.push(entry);
			}
		}

		const categories: EpistleCategory[] = [];

		// Add flight plan categories
		for (const [fp, epistles] of flightPlanMap.entries()) {
			categories.push(
				new EpistleCategory(
					`${fp} (${epistles.length})`,
					epistles,
					1 // Collapsed
				)
			);
		}

		// Add unlinked category
		if (unlinked.length > 0) {
			categories.push(
				new EpistleCategory(
					`Unlinked (${unlinked.length})`,
					unlinked,
					1 // Collapsed
				)
			);
		}

		return categories;
	}

	getTreeItem(element: any): any {
		return element;
	}
}

/**
 * Create and register epistle sidebar provider
 *
 * @rhizome: Where does this get called?
 * In extension.ts activate() function, after registry is created.
 */
export function registerEpistleSidebar(
	context: any, // vscode.ExtensionContext
	registry: EpistleRegistry,
	workspaceRoot: string
): EpistleSidebarProvider {
	const provider = new EpistleSidebarProvider(registry, workspaceRoot);

	// Register the tree view (only if vscode is available)
	if (vscode && vscode.window) {
		vscode.window.registerTreeDataProvider('epistle-registry-sidebar', provider);
	}

	// Create view container (if not already defined in package.json)
	// For now, we assume it's defined in package.json

	return provider;
}
