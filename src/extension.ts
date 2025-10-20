import * as vscode from 'vscode';
// import { generateStub, findStubComments, insertStub } from './stubGenerator';

/**
 * Activate extension on startup
 *
 * don-socratic asks:
 * What's the user's workflow? They write a comment, then what?
 * Do they:
 * a) Right-click on the red squiggle?
 * b) Hit a keyboard shortcut?
 * c) Something else?
 *
 * How do they KNOW the extension is listening?
 * What feedback do they get?
 *
 * Think about this BEFORE you code the activation logic.
 *
 * TODO: Wire up the stub generation workflow
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('vscode-rhizome activated');

	// don-socratic asks:
	// When someone invokes the stub command, what needs to happen?
	// 1. Find the @rhizome stub comment?
	// 2. Parse the function signature?
	// 3. Generate the stub?
	// 4. Insert it into the file?
	//
	// In what order? And how do you know each step succeeded?
	//
	// TODO: Implement stub command handler
	let stubDisposable = vscode.commands.registerCommand('vscode-rhizome.stub', async () => {
		// don-socratic asks:
		// Where are we? In which file? At which line?
		// How do you get the active editor?
		// What if there's no active editor?
		//
		// TODO: Get active editor and selection
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}

		// TODO: Find @rhizome stub comments near cursor
		// TODO: Generate stub
		// TODO: Insert into file
		// TODO: Show feedback to user

		vscode.window.showInformationMessage('Stub command not yet implemented');
	});

	context.subscriptions.push(stubDisposable);

	// don-socratic asks:
	// Is registering a command enough?
	// How does the user discover this command?
	// Should it be in the command palette?
	// Should it be in a right-click context menu?
	// Should it BOTH?
	//
	// TODO: Make stub command discoverable
}

export function deactivate() {}

