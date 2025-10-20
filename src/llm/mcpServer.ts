/**
 * @rhizome stub infer
 * MCP (Model Context Protocol) server for vscode-rhizome
 *
 * TODO: implement MCP server
 * Forwards @rhizome commands in editor comments to:
 * - LLM inference (via llmClient)
 * - Rhizome decision logging
 * - External Claude sessions
 * User Stories: "Understand Before Commit", "Stay Grounded in Code"
 */

export interface MCPCommand {
	command: string; // e.g., "stub", "stub infer", "review", "explain"
	context: string; // e.g., "Get student addresses"
	selection?: string; // code snippet if available
	metadata?: Record<string, unknown>;
}

/**
 * @rhizome stub
 * Parse @rhizome comments as MCP commands
 *
 * TODO: implement comment parsing for MCP
 * Patterns:
 * - // @rhizome stub
 * - # @rhizome stub infer
 * - /* @rhizome review this function */
 */
export function parseMCPCommand(commentText: string): MCPCommand | null {
	throw new NotImplementedError();
	// TODO: extract command, context, metadata from comment
	// TODO: handle multi-line comments
	// TODO: validate command format
}

/**
 * @rhizome stub
 * Execute MCP command via LLM with rhizome context
 *
 * TODO: implement MCP command execution
 * Depends on: llmClient, rhizomeContext
 * User Story: invoke LLM with persona awareness
 */
export async function executeMCPCommand(
	command: MCPCommand,
	rhizomeContextData: Record<string, unknown>
): Promise<string> {
	throw new NotImplementedError();
	// TODO: route to appropriate handler:
	//   - "stub" -> call propertyTemplates
	//   - "stub infer" -> call llmClient + rhizomeContext
	//   - "review" -> call llmClient with code-reviewer persona
	//   - "explain" -> call llmClient with dev-guide persona
}

/**
 * @rhizome stub
 * Forward MCP command result back to editor
 *
 * TODO: implement result handling
 * Actions:
 * - Insert generated code
 * - Show in output panel
 * - Log to rhizome journal
 * - Create TODO on backlog
 */
export async function handleMCPResult(
	command: MCPCommand,
	result: string,
	editorContext: Record<string, unknown>
): Promise<void> {
	throw new NotImplementedError();
	// TODO: parse result based on command type
	// TODO: insert into editor or show in panel
	// TODO: log decision to rhizome
}

/**
 * @rhizome stub
 * Start MCP server listening for @rhizome commands
 *
 * TODO: implement MCP server startup
 * Listen for:
 * - Editor document changes
 * - Comment additions
 * - Right-click context menu
 */
export async function startMCPServer(): Promise<void> {
	throw new NotImplementedError();
	// TODO: initialize MCP server
	// TODO: register command handlers
	// TODO: listen for editor events
}
