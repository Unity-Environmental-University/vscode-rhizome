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

	// ======================================
	// CORE FEATURE: don-socratic guidance
	// ======================================
	// The don is always listening. When you select code and ask,
	// he brings Socratic questioning to bear on what you're building.
	//
	// TODO: Implement don-socratic command
	let donSocraticDisposable = vscode.commands.registerCommand('vscode-rhizome.donSocratic', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}

		const selection = editor.selection;
		const selectedText = editor.document.getText(selection);

		if (!selectedText) {
			vscode.window.showErrorMessage('Please select code to question');
			return;
		}

		// TODO: Load don-socratic persona from .rhizome/
		// TODO: Pass selected code to don
		// TODO: Generate Socratic questions about the selection
		// TODO: Display in output panel or webview

		vscode.window.showInformationMessage('don-socratic command not yet implemented');
	});

	context.subscriptions.push(donSocraticDisposable);

	// ======================================
	// STUB GENERATION
	// ======================================
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
}

export function deactivate() {}

