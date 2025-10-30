/**
 * extension.ts — vscode-rhizome minimal entry point
 *
 * ONLY registers two inline persona commands:
 * 1. askPersona - right-click to ask any persona
 * 2. redPenReview - right-click for don-socratic review
 *
 * Everything else gutted for clarity and focus.
 */

import * as vscode from 'vscode';
import { askPersonaCommand, redPenReviewCommand, redPenReviewFileCommand, disposeCommands } from './commands/personaCommands';
import { ensureLocalBinOnPath } from './utils/rhizomePath';
import { getAvailablePersonas } from './services/rhizomeService';
import { initializeRhizomeIfNeeded } from './services/initService';

const fs = require('fs');
const path = require('path');

/**
 * Helper: Add line to .gitignore if not already present
 */
async function addToGitignore(workspaceRoot: string, line: string): Promise<void> {
	const gitignorePath = path.join(workspaceRoot, '.gitignore');
	try {
		let content = '';
		try {
			content = fs.readFileSync(gitignorePath, 'utf-8');
		} catch {
			// File doesn't exist, start fresh
		}
		if (!content.includes(line)) {
			content += (content ? '\n' : '') + line + '\n';
			fs.writeFileSync(gitignorePath, content);
		}
	} catch (error) {
		console.log('[vscode-rhizome] Could not update .gitignore:', error);
	}
}

/**
 * Helper: Offer to collect and store OpenAI key
 *
 * don-socratic asks:
 * Where should secrets live? In code? In env? In config files?
 * How do you keep them secure while making them accessible?
 * What happens the first time a tool needs a secret?
 */
export async function ensureOpenAIKeyConfigured(workspaceRoot: string): Promise<boolean> {
	try {
		// Check if key is already configured (env var or config file)
		if (process.env.OPENAI_API_KEY) {
			return true;
		}

		const configPath = vscode.Uri.joinPath(vscode.Uri.file(workspaceRoot), '.rhizome', 'config.json');
		const configExists = await vscode.workspace.fs.stat(configPath).catch(() => null);
		if (configExists) {
			const configContent = await vscode.workspace.fs.readFile(configPath);
			const config = JSON.parse(new TextDecoder().decode(configContent));
			if (config.ai?.openai_key) {
				// Load key from config into env for this session
				process.env.OPENAI_API_KEY = config.ai.openai_key;
				return true;
			}
		}
	} catch {
		// Config file doesn't exist or can't be read, that's fine
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

	// Save key to local config
	try {
		const rhizomePath = vscode.Uri.joinPath(vscode.Uri.file(workspaceRoot), '.rhizome');
		const configPath = vscode.Uri.joinPath(rhizomePath, 'config.json');

		let config: any = {};
		try {
			const existing = await vscode.workspace.fs.readFile(configPath);
			config = JSON.parse(new TextDecoder().decode(existing));
		} catch {
			// File doesn't exist, start fresh
		}

		// Ensure nested structure exists
		if (!config.ai) config.ai = {};
		config.ai.openai_key = key;

		// Write config
		const configContent = new TextEncoder().encode(JSON.stringify(config, null, 2));
		await vscode.workspace.fs.writeFile(configPath, configContent);

		// Set env var for this session
		process.env.OPENAI_API_KEY = key;

		// Add .rhizome/config.json to .gitignore
		await addToGitignore(workspaceRoot, '.rhizome/config.json');

		vscode.window.showInformationMessage('OpenAI key saved to .rhizome/config.json');
		return true;
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to save API key: ${(error as Error).message}`);
		return false;
	}
}

/**
 * Activate extension on startup
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('[vscode-rhizome] ACTIVATION START');
	ensureLocalBinOnPath();

	// Cleanup on deactivation
	context.subscriptions.push(
		new vscode.Disposable(() => {
			disposeCommands();
		})
	);

	// Initialize rhizome on startup (check rhizome, .rhizome/, and API key)
	(async () => {
		try {
			const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
			if (!workspaceRoot) {
				console.log('[vscode-rhizome] No workspace folder open, skipping initialization');
				return;
			}

			console.log('[vscode-rhizome] Checking rhizome setup...');
			const initialized = await initializeRhizomeIfNeeded(workspaceRoot);
			if (initialized) {
				console.log('[vscode-rhizome] Rhizome is ready');
			} else {
				console.log('[vscode-rhizome] Rhizome initialization incomplete or cancelled');
			}
		} catch (error) {
			console.log('[vscode-rhizome] ERROR during initialization:', (error as Error).message);
		}
	})();

	// Log available personas on startup
	(async () => {
		try {
			const personas = await getAvailablePersonas();
			console.log(`[vscode-rhizome] ${personas.size} personas available`);
		} catch (error) {
			console.log('[vscode-rhizome] ERROR fetching personas:', (error as Error).message);
		}
	})();

	// ======================================
	// COMMAND: Ask any persona
	// ======================================
	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.askPersona', askPersonaCommand)
	);

	// ======================================
	// COMMAND: Red Pen Review (don-socratic)
	// ======================================
	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.redPenReview', redPenReviewCommand)
	);

	// ======================================
	// COMMAND: Red Pen Review File (entire file)
	// ======================================
	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.redPenReviewFile', redPenReviewFileCommand)
	);

	console.log('[vscode-rhizome] ACTIVATION COMPLETE');
}

/**
 * Deactivate extension on shutdown
 */
export function deactivate() {
	console.log('[vscode-rhizome] DEACTIVATION');
}
