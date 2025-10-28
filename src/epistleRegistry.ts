/**
 * Epistle Registry Management
 *
 * Handles loading, updating, and querying epistles from the registry.ndjson file.
 * Epistles can be: letter (file-based), inline (comment-embedded), or dynamic (synthesized personas).
 *
 * @rhizome: Why extract this?
 * Registry operations are common across all epistle features (create, read, filter).
 * Centralizing them here:
 * - Makes testing easier (mock registry operations)
 * - Reduces duplication across epistle commands
 * - Clarifies the "epistle schema" in one place
 * - Makes it easier to swap registry format later (if needed)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Epistle registry entry schema
 *
 * @rhizome: What fields does each epistle need?
 * - Common: id, date, personas, type
 * - Letter-specific: topic, status, flight_plan
 * - Inline-specific: file, lines
 * - Dynamic persona-specific: source_file, name, created_at
 */
export interface EpistleRegistryEntry {
	// Common fields
	id: string;
	type: 'letter' | 'inline' | 'dynamic_persona';
	date: string;
	personas: string[];

	// Letter epistle fields
	topic?: string;
	status?: 'draft' | 'resolved' | 'archived';
	flight_plan?: string;
	file?: string; // Filename for letter epistles

	// Inline epistle fields
	inline_file?: string; // Source file containing inline epistle
	lines?: string; // "148-151" format

	// Dynamic persona fields
	source_file?: string;
	name?: string;
	created_at?: string;

	// Optional metadata
	references?: string[];
	context?: string[];
	keywords?: string[];
}

/**
 * Registry manager for epistles
 */
export class EpistleRegistry {
	private registryPath: string;
	private entries: Map<string, EpistleRegistryEntry> = new Map();

	constructor(workspaceRoot: string) {
		this.registryPath = path.join(
			workspaceRoot,
			'.rhizome',
			'plugins',
			'epistles',
			'registry.ndjson'
		);
		this.loadRegistry();
	}

	/**
	 * Load registry from disk
	 *
	 * @rhizome: How do we read NDJSON?
	 * Line-delimited JSON: each line is one JSON object.
	 * We split by newline, parse each non-empty line.
	 */
	private loadRegistry(): void {
		try {
			if (!fs.existsSync(this.registryPath)) {
				// Create empty registry if it doesn't exist
				fs.mkdirSync(path.dirname(this.registryPath), { recursive: true });
				fs.writeFileSync(this.registryPath, '');
				return;
			}

			const content = fs.readFileSync(this.registryPath, 'utf-8');
			const lines = content.split('\n').filter(line => line.trim());

			this.entries.clear();
			for (const line of lines) {
				try {
					const entry = JSON.parse(line) as EpistleRegistryEntry;
					this.entries.set(entry.id, entry);
				} catch (e) {
					console.error(`Failed to parse registry line: ${line}`);
				}
			}
		} catch (e) {
			console.error(`Failed to load epistle registry: ${e}`);
		}
	}

	/**
	 * Save registry to disk
	 */
	private saveRegistry(): void {
		try {
			const lines = Array.from(this.entries.values()).map(entry =>
				JSON.stringify(entry)
			);
			const content = lines.join('\n');
			fs.writeFileSync(this.registryPath, content);
		} catch (e) {
			console.error(`Failed to save epistle registry: ${e}`);
		}
	}

	/**
	 * Add a new epistle to the registry
	 */
	addEntry(entry: EpistleRegistryEntry): void {
		this.entries.set(entry.id, entry);
		this.saveRegistry();
	}

	/**
	 * Update an existing epistle in the registry
	 */
	updateEntry(id: string, updates: Partial<EpistleRegistryEntry>): void {
		const entry = this.entries.get(id);
		if (entry) {
			this.entries.set(id, { ...entry, ...updates });
			this.saveRegistry();
		}
	}

	/**
	 * Get a single epistle by ID
	 */
	getEntry(id: string): EpistleRegistryEntry | undefined {
		return this.entries.get(id);
	}

	/**
	 * Get all epistles
	 */
	getAllEntries(): EpistleRegistryEntry[] {
		return Array.from(this.entries.values());
	}

	/**
	 * Get epistles by type
	 */
	getEntriesByType(type: 'letter' | 'inline' | 'dynamic_persona'): EpistleRegistryEntry[] {
		return this.getAllEntries().filter(e => e.type === type);
	}

	/**
	 * Get epistles by persona
	 */
	getEntriesByPersona(persona: string): EpistleRegistryEntry[] {
		return this.getAllEntries().filter(e => e.personas.includes(persona));
	}

	/**
	 * Get epistles by date (ISO format)
	 */
	getEntriesByDate(date: string): EpistleRegistryEntry[] {
		return this.getAllEntries().filter(e => e.date === date);
	}

	/**
	 * Get epistles by flight plan
	 */
	getEntriesByFlightPlan(flightPlan: string): EpistleRegistryEntry[] {
		return this.getAllEntries().filter(e => e.flight_plan === flightPlan);
	}

	/**
	 * Get inline epistles in a specific file
	 */
	getInlineEpistlesInFile(filepath: string): EpistleRegistryEntry[] {
		return this.getAllEntries().filter(
			e => e.type === 'inline' && e.inline_file === filepath
		);
	}

	/**
	 * Get dynamic personas (not tied to a specific interaction)
	 */
	getDynamicPersonas(): EpistleRegistryEntry[] {
		return this.getAllEntries().filter(e => e.type === 'dynamic_persona');
	}

	/**
	 * Get dynamic persona by source file
	 */
	getDynamicPersonaForFile(sourceFile: string): EpistleRegistryEntry | undefined {
		return this.getAllEntries().find(
			e => e.type === 'dynamic_persona' && e.source_file === sourceFile
		);
	}

	/**
	 * Search epistles by keyword (in topic, context, keywords)
	 */
	search(query: string): EpistleRegistryEntry[] {
		const lowerQuery = query.toLowerCase();
		return this.getAllEntries().filter(e => {
			const matchTopic = e.topic?.toLowerCase().includes(lowerQuery);
			const matchKeywords = e.keywords?.some(k => k.toLowerCase().includes(lowerQuery));
			const matchContext = e.context?.some(c => c.toLowerCase().includes(lowerQuery));
			return matchTopic || matchKeywords || matchContext;
		});
	}

	/**
	 * Generate a unique ID for a new epistle
	 *
	 * @rhizome: How should we name epistles?
	 * For letters: epistle-TIMESTAMP-TOPIC (e.g., epistle-1761677263-error-handling)
	 * For inline: inline-epistlе-TIMESTAMP-FILEHASH (tracks location in file)
	 * For personas: persona-FILENAME-TIMESTAMP
	 *
	 * Always include random suffix for uniqueness even within same millisecond
	 */
	generateId(type: 'letter' | 'inline' | 'dynamic_persona', context?: string): string {
		const timestamp = Date.now();
		const randomSuffix = Math.random().toString(36).substring(2, 8);

		switch (type) {
			case 'letter':
				const topicSlug = context?.toLowerCase().replace(/\s+/g, '-').substring(0, 20) || 'epistle';
				return `epistle-${timestamp}-${topicSlug}-${randomSuffix}`;
			case 'inline':
				return `inline-epistle-${timestamp}-${randomSuffix}`;
			case 'dynamic_persona':
				const personaName = context?.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'persona';
				return `persona-${personaName}-${timestamp}-${randomSuffix}`;
		}
	}

	/**
	 * Get registry file path
	 */
	getRegistryPath(): string {
		return this.registryPath;
	}
}

/**
 * Create an epistle registry for the current workspace
 *
 * @rhizome: Should this be async?
 * Registry loading is synchronous (small file, fast).
 * Kept sync for simplicity. If registry grows large, could optimize later.
 */
export function createEpistleRegistry(workspaceRoot: string): EpistleRegistry {
	return new EpistleRegistry(workspaceRoot);
}
