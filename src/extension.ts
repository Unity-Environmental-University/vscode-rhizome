import * as vscode from 'vscode';

/**
 * @rhizome stub
 * Activate extension on startup
 *
 * TODO: implement activation logic
 * User Stories: "Stay Grounded in Code" - extension ready when needed
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('vscode-rhizome activated');

	// TODO: Register stub command
	// Command: vscode-rhizome.stub
	// Action: Generate pseudocode stub with NotImplementedError + TODO comment
	// User Story: "Pseudocode Without Friction"
	let stubDisposable = vscode.commands.registerCommand('vscode-rhizome.stub', () => {
		vscode.window.showInformationMessage('Stub command not yet implemented');
	});

	// TODO: Register stub infer command
	// Command: vscode-rhizome.stubInfer
	// Action: Generate stub with LLM-inferred properties (requires LLM config)
	// User Story: "Test-Driven Top-Down Development"
	let stubInferDisposable = vscode.commands.registerCommand('vscode-rhizome.stubInfer', () => {
		vscode.window.showInformationMessage('Stub infer command not yet implemented');
	});

	context.subscriptions.push(stubDisposable);
	context.subscriptions.push(stubInferDisposable);

	// TODO: Add diagnostic provider for @rhizome comments
	// Listen for comment lines with @rhizome stub / @rhizome stub infer
	// Show red squiggles on undefined functions
	// Enable right-click context menu

	// TODO: Add context menu provider
	// Right-click on undefined function -> "Stub this function"
	// Trigger command registration above
}

/**
 * @rhizome stub
 * Deactivate extension
 *
 * TODO: cleanup if needed (currently none)
 */
export function deactivate() {
	console.log('vscode-rhizome deactivated');
}
