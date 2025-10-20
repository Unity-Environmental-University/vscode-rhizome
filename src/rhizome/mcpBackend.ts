/**
 * @rhizome stub infer
 * MCP Backend: call rhizome via MCP microservice
 *
 * TODO: implement MCP client
 * User Stories: future user adoption, distribution without Python dependency
 * Strategy: HTTP/JSON-RPC to MCP server on localhost, handle lifecycle
 */

import { RhizomeBackend, RecordOptions, RecordResult, PersonaInfo } from './rhizomeBackend';

export interface MCPServerConfig {
	host: string;
	port: number;
	timeout?: number;
}

export class MCPBackend implements RhizomeBackend {
	private config: MCPServerConfig;

	/**
	 * @rhizome stub
	 * Initialize MCP backend
	 *
	 * TODO: validate MCP server connection
	 * TODO: handle server unreachable gracefully
	 */
	constructor(config: MCPServerConfig = { host: 'localhost', port: 3000 }) {
		this.config = config;
	}

	/**
	 * @rhizome stub infer
	 * Internal: make JSON-RPC call to MCP server
	 *
	 * TODO: implement JSON-RPC 2.0 protocol
	 * TODO: handle timeouts, retries
	 * TODO: parse responses
	 */
	private async rpc(method: string, params: Record<string, unknown>): Promise<unknown> {
		throw new NotImplementedError();
		// Build JSON-RPC payload:
		// { jsonrpc: "2.0", method, params, id: uuid() }
		// POST to: http://localhost:port/rpc
		// Parse response: { result: ... } or { error: ... }
		// Handle: connection errors, timeouts, server errors
	}

	/**
	 * @rhizome stub
	 * Record a decision/observation via MCP
	 *
	 * TODO: call rpc('rhizome.record', options)
	 */
	async record(options: RecordOptions): Promise<RecordResult> {
		throw new NotImplementedError();
		// Call: this.rpc('rhizome.record', options)
		// Return: RecordResult from server
	}

	/**
	 * @rhizome stub
	 * List personas via MCP
	 *
	 * TODO: call rpc('rhizome.personaList')
	 */
	async personaList(): Promise<PersonaInfo[]> {
		throw new NotImplementedError();
		// Call: this.rpc('rhizome.personaList', {})
		// Return: PersonaInfo[] from server
	}

	/**
	 * @rhizome stub
	 * Show persona via MCP
	 *
	 * TODO: call rpc('rhizome.personaShow', { name })
	 */
	async personaShow(name: string): Promise<PersonaInfo> {
		throw new NotImplementedError();
		// Call: this.rpc('rhizome.personaShow', { name })
		// Return: PersonaInfo from server
	}

	/**
	 * @rhizome stub
	 * Adopt persona via MCP
	 *
	 * TODO: call rpc('rhizome.personaAdopt', options)
	 */
	async personaAdopt(options: {
		includeBro?: boolean;
		includeBrand?: boolean;
	}): Promise<RecordResult> {
		throw new NotImplementedError();
		// Call: this.rpc('rhizome.personaAdopt', options)
		// Return: RecordResult from server
	}
}

/**
 * @rhizome stub
 * Manage MCP server lifecycle
 *
 * TODO: start/stop MCP server process
 * Questions: binary location? port management? auto-restart?
 */
export class MCPServerManager {
	/**
	 * @rhizome stub
	 * Start MCP server
	 *
	 * TODO: spawn MCP server process
	 * TODO: wait for server ready
	 * TODO: return MCPBackend instance
	 */
	async start(): Promise<MCPBackend> {
		throw new NotImplementedError();
		// Find MCP server binary (bundled, or installed?)
		// Spawn: { host, port, working_dir }
		// Poll: until server responds to health check
		// Return: new MCPBackend with config
	}

	/**
	 * @rhizome stub
	 * Stop MCP server
	 *
	 * TODO: graceful shutdown
	 */
	async stop(): Promise<void> {
		throw new NotImplementedError();
		// Send SIGTERM, wait for graceful shutdown
		// On timeout, SIGKILL
	}
}
