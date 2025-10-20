/**
 * @rhizome stub
 * Abstract interface for rhizome backend
 *
 * TODO: define complete method interface
 * User Stories: all (rhizome integration)
 * Design: abstraction layer so we can swap CLI ↔ MCP without changing extension
 */

export interface RecordOptions {
	actor?: string;
	action?: string;
	object?: string;
	what?: string;
	note?: string;
	persona?: string;
	role?: string;
	phase?: string;
	certainty?: number;
	basis?: string[];
	gap?: string[];
}

export interface RecordResult {
	ok: boolean;
	error?: string;
	recorded?: Record<string, unknown>;
}

export interface PersonaInfo {
	name: string;
	role?: string;
	description?: string;
	source?: string;
}

/**
 * @rhizome stub infer
 * RhizomeBackend interface
 *
 * TODO: expand with all rhizome commands
 * Current methods are MVP for stub generation and decision logging
 * Future: add persona-merge, graph-config, watch, flight, policy, etc.
 */
export interface RhizomeBackend {
	/**
	 * Record a decision/observation to rhizome journal
	 * Equivalent to: rhizome record --actor ... --action ... etc.
	 */
	record(options: RecordOptions): Promise<RecordResult>;

	/**
	 * List all available personas
	 * Equivalent to: rhizome persona-list
	 */
	personaList(): Promise<PersonaInfo[]>;

	/**
	 * Show details of a specific persona
	 * Equivalent to: rhizome persona-show --name <name>
	 */
	personaShow(name: string): Promise<PersonaInfo>;

	/**
	 * Adopt persona with options
	 * Equivalent to: rhizome persona-adopt --include-bro --include-brand
	 */
	personaAdopt(options: {
		includeBro?: boolean;
		includeBrand?: boolean;
	}): Promise<RecordResult>;

	// TODO: add more methods as needed
	// personaSprout, personaMerge, init, etc.
}

/**
 * @rhizome stub
 * Factory to get the active backend
 *
 * TODO: read config to determine which backend to use
 * Config source: extension settings? .rhizome/config.json? environment?
 */
export async function getRhizomeBackend(): Promise<RhizomeBackend> {
	throw new NotImplementedError();
	// TODO: check config for backend choice (cli, mcp, etc.)
	// TODO: instantiate and return appropriate backend
	// TODO: verify backend is available (CLI in PATH, MCP server running)
}
