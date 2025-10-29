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
import { askPersonaCommand, redPenReviewCommand, disposeCommands } from './commands/personaCommands';
import { ensureLocalBinOnPath } from './utils/rhizomePath';
import { getAvailablePersonas } from './services/rhizomeService';

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

	console.log('[vscode-rhizome] ACTIVATION COMPLETE');
}

/**
 * Deactivate extension on shutdown
 */
export function deactivate() {
	console.log('[vscode-rhizome] DEACTIVATION');
}
