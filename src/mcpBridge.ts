import * as vscode from 'vscode';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { AddressInfo } from 'net';
import { promises as fs } from 'fs';
import * as path from 'path';

type JsonValue = any;

export interface McpBridgeState {
	port: number;
	configPath?: string;
	httpBase: string;
}

let currentBridgeState: McpBridgeState | null = null;

export function getCurrentMcpBridgeState(): McpBridgeState | null {
	return currentBridgeState;
}

/**
 * Start an MCP bridge so rhizome CLI personas can access rich VS Code state.
 * Writes `.rhizome/mcp/config.json` pointing to a local JSON-RPC endpoint.
 */
export async function activateMcpBridge(context: vscode.ExtensionContext, workspaceRoot: string): Promise<void> {
	try {
		const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
			if (req.method !== 'POST') {
				res.writeHead(405, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify(makeError(null, -32601, 'Method not allowed')));
				return;
			}

			if (req.url && req.url !== '/rpc') {
				res.writeHead(404, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify(makeError(null, -32601, 'Endpoint not found')));
				return;
			}

			let body = '';
			req.on('data', (chunk: Buffer) => {
				body += chunk.toString('utf-8');
			});

			req.on('end', async () => {
				let request: any;
				try {
					request = JSON.parse(body || '{}');
				} catch (error: any) {
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify(makeError(null, -32700, `Invalid JSON: ${(error as Error).message}`)));
					return;
				}

				const response = await handleRpcRequest(request, workspaceRoot);
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify(response));
			});
		});

		let configPath: string | undefined;

		server.listen(0, '127.0.0.1', async () => {
			const address = server.address() as AddressInfo | null;
			const port = address?.port;
			if (!port) {
				console.error('[vscode-rhizome] MCP bridge failed: no port assigned');
				return;
			}

			try {
				const httpBase = `http://127.0.0.1:${port}`;
				configPath = await writeMcpConfig(workspaceRoot, port);
				currentBridgeState = {
					port,
					configPath,
					httpBase,
				};
				await ensureGitignoreEntry(workspaceRoot, '.rhizome/mcp/config.json');
				console.log(`[vscode-rhizome] MCP bridge ready on ${httpBase}/rpc`);
			} catch (error: any) {
				console.error('[vscode-rhizome] MCP bridge configuration failed:', (error as Error).message);
			}
		});

		const disposable = new vscode.Disposable(async () => {
			server.close();
			if (configPath) {
				try {
					await fs.unlink(configPath);
				} catch (error) {
					// Ignore unlink failures (file may have been removed manually)
				}
			}
			currentBridgeState = null;
		});

		context.subscriptions.push(disposable);
	} catch (error: any) {
		console.error('[vscode-rhizome] MCP bridge activation failed:', (error as Error).message);
	}
}

async function handleRpcRequest(request: any, workspaceRoot: string): Promise<JsonValue> {
	const id = request?.id ?? null;
	const method = request?.method;

	if (!method) {
		return makeError(id, -32600, 'Missing method');
	}

	try {
		if (method === 'tools/list') {
			return {
				jsonrpc: '2.0',
				id,
				result: {
					'repo.describe': {
						description: 'Summarise workspace state for personas (open files, git info, diagnostics).',
						parameters: {
							type: 'object',
							properties: {},
						},
					},
					'repo.selection': {
						description: 'Return the active editor selection (file path, language, text).',
						parameters: {
							type: 'object',
							properties: {},
						},
					},
					'repo.readFile': {
						description: 'Read a workspace file (UTF-8) so personas can inspect additional context.',
						parameters: {
							type: 'object',
							required: ['path'],
							properties: {
								path: { type: 'string', description: 'Path relative to workspace root' },
							},
						},
					},
				},
			};
		}

		if (method === 'tools/call') {
			const params = request?.params ?? {};
			const name = params.name;
			const args = params.arguments ?? {};

			if (!name || typeof name !== 'string') {
				return makeError(id, -32602, 'Tool name missing or invalid');
			}

			const result = await callTool(name, args, workspaceRoot);
			return { jsonrpc: '2.0', id, result };
		}

		return makeError(id, -32601, `Unknown method: ${method}`);
	} catch (error: any) {
		return makeError(id, -32603, (error as Error).message);
	}
}

async function callTool(name: string, args: any, workspaceRoot: string): Promise<JsonValue> {
	switch (name) {
		case 'repo.describe':
			return describeWorkspace(workspaceRoot);
		case 'repo.selection':
			return selectionSnapshot();
		case 'repo.readFile':
			return readWorkspaceFile(args?.path, workspaceRoot);
		default:
			throw new Error(`Tool not implemented: ${name}`);
	}
}

async function describeWorkspace(workspaceRoot: string) {
	const workspaceFolders = vscode.workspace.workspaceFolders?.map((folder) => ({
		name: folder.name,
		path: folder.uri.fsPath,
	})) ?? [];

	const activeEditor = vscode.window.activeTextEditor;
	const active = activeEditor
		? {
				path: activeEditor.document.uri.fsPath,
				language: activeEditor.document.languageId,
				isDirty: activeEditor.document.isDirty,
				selection: activeEditor.selection
					? {
							start: activeEditor.selection.start,
							end: activeEditor.selection.end,
							isEmpty: activeEditor.selection.isEmpty,
					  }
					: null,
		  }
		: null;

	const openEditors = vscode.window.visibleTextEditors.map((editor) => ({
		path: editor.document.uri.fsPath,
		language: editor.document.languageId,
		isDirty: editor.document.isDirty,
	}));

	const diagnostics = vscode.languages
		.getDiagnostics()
		.filter(([uri]) => uri.fsPath.startsWith(workspaceRoot))
		.map(([uri, issues]) => ({
			path: uri.fsPath,
			issues: issues.map((issue) => ({
				message: issue.message,
				severity: issue.severity,
				start: issue.range.start,
				end: issue.range.end,
				source: issue.source,
			})),
		}));

	return {
		ok: true,
		workspaceFolders,
		activeEditor: active,
		openEditors,
		diagnostics,
	};
}

async function selectionSnapshot() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return { ok: false, error: 'No active editor' };
	}

	const selection = editor.selection;
	if (!selection || selection.isEmpty) {
		return { ok: false, error: 'Selection is empty' };
	}

	const text = editor.document.getText(selection);
	return {
		ok: true,
		path: editor.document.uri.fsPath,
		language: editor.document.languageId,
		range: {
			start: selection.start,
			end: selection.end,
		},
		text,
	};
}

async function readWorkspaceFile(relativePath: unknown, workspaceRoot: string) {
	if (!relativePath || typeof relativePath !== 'string') {
		throw new Error('Argument "path" must be provided');
	}

	const normalized = path.normalize(relativePath);
	const absolute = path.resolve(workspaceRoot, normalized);
	if (!absolute.startsWith(workspaceRoot)) {
		throw new Error('Path outside workspace not permitted');
	}

	const uri = vscode.Uri.file(absolute);
	const bytes = await vscode.workspace.fs.readFile(uri);
	return {
		ok: true,
		path: normalized,
		contents: Buffer.from(bytes).toString('utf-8'),
	};
}

async function writeMcpConfig(workspaceRoot: string, port: number): Promise<string> {
	const cfgDir = path.join(workspaceRoot, '.rhizome', 'mcp');
	await fs.mkdir(cfgDir, { recursive: true });
	const cfgPath = path.join(cfgDir, 'config.json');
	const payload = {
		http_base: `http://127.0.0.1:${port}`,
		http_path: '/rpc',
	};
	await fs.writeFile(cfgPath, JSON.stringify(payload, null, 2), 'utf-8');
	return cfgPath;
}

async function ensureGitignoreEntry(workspaceRoot: string, entry: string): Promise<void> {
	const gitignorePath = path.join(workspaceRoot, '.gitignore');
	let content = '';
	try {
		content = await fs.readFile(gitignorePath, 'utf-8');
	} catch {
		// If the file doesn't exist we create it below
	}

	if (!content.includes(entry)) {
		const next = content.length > 0 ? (content.endsWith('\n') ? content : `${content}\n`) : '';
		await fs.writeFile(gitignorePath, `${next}${entry}\n`, 'utf-8');
	}
}

function makeError(id: any, code: number, message: string) {
	return {
		jsonrpc: '2.0',
		id,
		error: {
			code,
			message,
		},
	};
}
