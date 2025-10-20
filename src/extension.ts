import * as vscode from 'vscode';

/**
 * Activate extension on startup
 *
 * TODO: Parse @rhizome stub comments
 * TODO: Add right-click context menu for "Stub this function"
 * TODO: Implement stub generation
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('vscode-rhizome activated');

	// TODO: Register stub command
	let stubDisposable = vscode.commands.registerCommand('vscode-rhizome.stub', () => {
		vscode.window.showInformationMessage('Stub command not yet implemented');
	});

	context.subscriptions.push(stubDisposable);
}

export function deactivate() {}

