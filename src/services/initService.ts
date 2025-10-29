/**
 * initService.ts
 *
 * @rhizome: What does "initialization" mean?
 * Setting up the state required before the extension can work.
 * Questions: Is rhizome installed? Is the workspace set up? Is the API key configured?
 * This service answers those questions and guides setup.
 */

import * as vscode from 'vscode';
import { isRhizomeInstalled, getCandidateLocations } from '../utils/rhizomePath';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Initialize rhizome in workspace if needed
 *
 * @param workspaceRoot - Workspace root directory
 * @returns true if initialized successfully
 */
export async function initializeRhizomeIfNeeded(workspaceRoot: string): Promise<boolean> {
	// Check if rhizome is installed
	if (!isRhizomeInstalled()) {
		const isMember = await isUEUMember();

		if (isMember) {
			const response = await vscode.window.showErrorMessage(
				'rhizome CLI not found. You are a member of Unity-Environmental-University. Install rhizome now?',
				'Install rhizome',
				'View Guide'
			);

			if (response === 'Install rhizome') {
				try {
					vscode.window.showInformationMessage('Installing rhizome...');
					execSync('npm install -g @rhizome/cli', {
						encoding: 'utf-8',
						timeout: 60000,
						stdio: 'inherit',
					});
					vscode.window.showInformationMessage('rhizome installed successfully!');

					if (!isRhizomeInstalled()) {
						vscode.window.showWarningMessage(
							'Installation completed but rhizome still not found in PATH. You may need to restart VSCode.'
						);
						return false;
					}

					return await initializeRhizomeIfNeeded(workspaceRoot);
				} catch (error: any) {
					vscode.window.showErrorMessage(`Failed to install rhizome: ${(error as Error).message}`);
					return false;
				}
			} else if (response === 'View Guide') {
				vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-rhizome-repo#installation'));
			}
			return false;
		} else {
			const response = await vscode.window.showWarningMessage(
				'rhizome CLI not found. Please install it to use vscode-rhizome.',
				'View Installation Guide'
			);
			if (response === 'View Installation Guide') {
				vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-rhizome-repo#installation'));
			}
			return false;
		}
	}

	const rhizomePath = vscode.Uri.joinPath(vscode.Uri.file(workspaceRoot), '.rhizome');
	try {
		await vscode.workspace.fs.stat(rhizomePath);
		// .rhizome exists, check for key config
		const keyConfigured = await ensureOpenAIKeyConfigured(workspaceRoot);
		return keyConfigured;
	} catch {
		// .rhizome doesn't exist, try to initialize
		try {
			vscode.window.showInformationMessage('Initializing rhizome in workspace...');
			execSync('rhizome init --force', {
				cwd: workspaceRoot,
				encoding: 'utf-8',
				timeout: 10000,
			});
			vscode.window.showInformationMessage('Rhizome initialized in workspace');

			const keyConfigured = await ensureOpenAIKeyConfigured(workspaceRoot);
			return keyConfigured;
		} catch (error: any) {
			vscode.window.showErrorMessage(`Failed to initialize rhizome: ${(error as Error).message}`);
			return false;
		}
	}
}

/**
 * Ensure OpenAI API key is configured
 *
 * @param workspaceRoot - Workspace root directory
 * @returns true if key is configured, false otherwise
 */
export async function ensureOpenAIKeyConfigured(workspaceRoot: string): Promise<boolean> {
	const configPath = vscode.Uri.joinPath(vscode.Uri.file(workspaceRoot), '.rhizome', 'config.json');

	try {
		if (process.env.OPENAI_API_KEY) {
			return true;
		}

		const configExists = await vscode.workspace.fs.stat(configPath);
		if (configExists) {
			const configContent = await vscode.workspace.fs.readFile(configPath);
			const config = JSON.parse(new TextDecoder().decode(configContent));
			if (config.ai?.openai_key) {
				process.env.OPENAI_API_KEY = config.ai.openai_key;
				return true;
			}
		}
	} catch {
		// Config doesn't exist
	}

	// No key found, ask user
	const key = await vscode.window.showInputBox({
		prompt: 'Enter your OpenAI API key (stored locally in .rhizome/config.json)',
		password: true,
		ignoreFocusOut: true,
	});

	if (!key) {
		vscode.window.showWarningMessage('OpenAI API key is required for don-socratic');
		return false;
	}

	const sanitizedKey = key.trim();
	if (/^\s*OPENAI_API_KEY\s*=/i.test(sanitizedKey) || sanitizedKey.includes('=')) {
		vscode.window.showErrorMessage('Please enter only the OpenAI secret value (omit any "OPENAI_API_KEY=" prefix).');
		return false;
	}

	const keyPattern = /^sk-(proj-)?[A-Za-z0-9_-]{20,}$/;
	if (!keyPattern.test(sanitizedKey)) {
		vscode.window.showErrorMessage('That doesn\'t look like an OpenAI API key (expected to start with "sk-" and contain letters, numbers, "-" or "_").');
		return false;
	}

	const validationOk = await validateOpenAIKey(sanitizedKey);
	if (!validationOk) {
		return false;
	}

	// Save key to local config
	try {
		const rhizomePath = vscode.Uri.joinPath(vscode.Uri.file(workspaceRoot), '.rhizome');
		const configPath = vscode.Uri.joinPath(rhizomePath, 'config.json');

		let config: any = {};
		try {
			const existing = await vscode.workspace.fs.readFile(configPath);
			config = JSON.parse(new TextDecoder().decode(existing));
		} catch {
			// File doesn't exist
		}

		if (!config.ai) config.ai = {};
		config.ai.openai_key = sanitizedKey;

		const configContent = new TextEncoder().encode(JSON.stringify(config, null, 2));
		await vscode.workspace.fs.writeFile(configPath, configContent);
		process.env.OPENAI_API_KEY = sanitizedKey;

		await addToGitignore(workspaceRoot, '.rhizome/config.json');

		vscode.window.showInformationMessage('OpenAI API key configured and stored securely');
		return true;
	} catch (error: any) {
		vscode.window.showErrorMessage(`Failed to save API key: ${(error as Error).message}`);
		return false;
	}
}

/**
 * Validate OpenAI key by making a minimal API call
 */
export async function validateOpenAIKey(key: string): Promise<boolean> {
	try {
		const response = await fetch('https://api.openai.com/v1/models', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${key}`,
			},
		});

		if (response.ok) {
			return true;
		}

		const errorText = await response.text();
		let message = 'OpenAI rejected the provided API key.';

		try {
			const parsed = JSON.parse(errorText);
			if (parsed?.error?.message) {
				message += ` ${parsed.error.message}`;
			}
		} catch {
			if (errorText) {
				message += ` ${errorText}`;
			}
		}

		vscode.window.showErrorMessage(message.trim());
		return false;
	} catch (error: any) {
		vscode.window.showErrorMessage(`Failed to validate OpenAI API key: ${(error as Error).message}`);
		return false;
	}
}

/**
 * Add entry to .gitignore if not already there
 */
export async function addToGitignore(workspaceRoot: string, entry: string): Promise<void> {
	const gitignorePath = vscode.Uri.joinPath(vscode.Uri.file(workspaceRoot), '.gitignore');

	let content = '';
	try {
		const existing = await vscode.workspace.fs.readFile(gitignorePath);
		content = new TextDecoder().decode(existing);
	} catch {
		// .gitignore doesn't exist
	}

	if (!content.includes(entry)) {
		content += (content.endsWith('\n') ? '' : '\n') + entry + '\n';
		const encoded = new TextEncoder().encode(content);
		await vscode.workspace.fs.writeFile(gitignorePath, encoded);
	}
}

/**
 * Check if user is member of Unity-Environmental-University
 */
async function isUEUMember(): Promise<boolean> {
	try {
		execSync('gh auth status', {
			encoding: 'utf-8',
			timeout: 2000,
			stdio: 'pipe',
		});
	} catch {
		return false;
	}

	try {
		const org = execSync('git config user.organization', {
			encoding: 'utf-8',
			timeout: 2000,
			stdio: 'pipe',
		})
			.trim();
		if (org === 'Unity-Environmental-University') {
			return true;
		}
	} catch {
		// Config value not set
	}

	try {
		const orgs = execSync('gh org list', {
			encoding: 'utf-8',
			timeout: 5000,
		})
			.split('\n')
			.map((line: string) => line.trim())
			.filter((line: string) => line.length > 0);

		return orgs.includes('Unity-Environmental-University');
	} catch {
		return false;
	}
}
