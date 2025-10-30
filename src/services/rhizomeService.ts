/**
 * rhizomeService.ts
 *
 * @rhizome: What belongs in a service layer?
 * Pure I/O with rhizome CLI. No UI, no side effects, just I/O + error handling.
 * Other files depend ON this, not the other way around.
 *
 * Question: When you call out to an external tool, what should you encapsulate?
 * Answer: The subprocess call + error parsing. That's it.
 */

import * as vscode from 'vscode';

const { execSync } = require('child_process');

/**
 * Query a persona via rhizome CLI
 *
 * @param text - The prompt text to send
 * @param persona - The persona name to query
 * @param timeoutMs - Timeout in milliseconds
 * @param workspaceRoot - Workspace root directory
 * @returns The response from the persona
 * @throws Error if query fails or times out
 */
export async function queryPersona(
	text: string,
	persona: string,
	timeoutMs: number = 30000,
	workspaceRoot?: string
): Promise<string> {
	const cwd = workspaceRoot || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	console.log(
		`[vscode-rhizome:rhizomeService] queryPersona invoked — persona: ${persona}, textLength: ${text.length}, cwd: ${
			cwd ?? 'unknown'
		}`
	);

	// Wrap execSync in a promise with explicit timeout
	const queryPromise = new Promise<string>((resolve, reject) => {
		try {
			const response = execSync(`rhizome query --persona ${persona}`, {
				input: text,
				encoding: 'utf-8',
				timeout: timeoutMs,
				cwd: cwd,
				stdio: ['pipe', 'pipe', 'pipe'],
				maxBuffer: 10 * 1024 * 1024,
				env: process.env, // Pass environment variables to child process
			});
			resolve(response);
		} catch (error: any) {
			console.log('[vscode-rhizome:rhizomeService] queryPersona execSync failed', {
				message: error?.message,
				status: error?.status,
				stdout: error?.stdout,
				stderr: error?.stderr,
			});
			reject(error);
		}
	});

	const timeoutPromise = new Promise<string>((_, reject) => {
		setTimeout(() => {
			const timeoutMessage = `${persona} timed out after ${timeoutMs}ms`;
			console.log('[vscode-rhizome:rhizomeService] queryPersona timeout', { persona, timeoutMs, cwd });
			reject(new Error(timeoutMessage));
		}, timeoutMs + 1000);
	});

	return Promise.race([queryPromise, timeoutPromise]);
}

/**
 * Get list of available personas from rhizome
 *
 * @returns Map of persona name to description
 * @throws Error if rhizome command fails
 */
export async function getAvailablePersonas(): Promise<Map<string, string>> {
	const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

	try {
		// Try JSON format first
		try {
			const jsonOutput = execSync('rhizome persona list --json', {
				encoding: 'utf-8',
				timeout: 5000,
				stdio: 'pipe',
				cwd: cwd,
				env: process.env,
			});

			const personasObj = JSON.parse(jsonOutput);
			const personas = new Map<string, string>();

			for (const [name, data] of Object.entries(personasObj)) {
				const role = (data as any).role || '-';
				personas.set(name, role);
			}

			return personas;
		} catch (jsonError: any) {
			// Fall back to text parsing
			const output = execSync('rhizome persona list', {
				encoding: 'utf-8',
				timeout: 5000,
				stdio: 'pipe',
				cwd: cwd,
				env: process.env,
			});

			const personas = new Map<string, string>();
			const lines = output.split('\n');

			for (const line of lines) {
				if (!line.trim()) continue;
				const match = line.match(/^\s*(\S+)\s+\|\s+role:\s+(.+?)\s+\|\s+source:/);
				if (match) {
					const name = match[1].trim();
					const role = match[2].trim();
					personas.set(name, role);
				}
			}

			return personas;
		}
	} catch (error: any) {
		// Return hardcoded fallback
		return new Map([
			['don-socratic', 'Socratic questioning'],
			['dev-guide', 'Mentor: What were you trying to accomplish?'],
			['code-reviewer', 'Skeptic: What\'s your evidence?'],
			['ux-advocate', 'Curator: Have we watched someone use this?'],
			['dev-advocate', 'Strategist: What trade-off are we making?'],
		]);
	}
}

/**
 * Check if API key is available (env vars or config file)
 *
 * @param workspaceRoot - Workspace root directory
 * @returns true if API key found, false otherwise
 */
export async function checkApiKeyAvailable(workspaceRoot?: string): Promise<boolean> {
	const fs = require('fs');
	const path = require('path');

	const cwd = workspaceRoot || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

	// Check environment variables
	const envKeys = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'RHIZOME_API_KEY'];
	for (const key of envKeys) {
		if (process.env[key]) {
			return true;
		}
	}

	// Check rhizome config file
	try {
		const configPath = path.join(cwd, '.rhizome', 'config.json');
		if (fs.existsSync(configPath)) {
			const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
			if (config.ai?.openai_key || config.ai?.key || config.openai_api_key) {
				return true;
			}
		}
	} catch {
		// Config file doesn't exist, continue
	}

	// Try rhizome config command
	try {
		const configOutput = execSync('rhizome config get ai', {
			encoding: 'utf-8',
			cwd: cwd,
			stdio: ['pipe', 'pipe', 'pipe'],
			timeout: 5000,
			env: process.env,
		});
		if (configOutput && configOutput.includes('key')) {
			return true;
		}
	} catch {
		// Config command failed, continue
	}

	return false;
}
