
import * as vscode from 'vscode';
import { generateStub, findStubComments, insertStub } from './stubGenerator';

/**
 * @rhizome: how do libraries work here?
 *
 * In VSCode extensions, local TypeScript files are bundled with the extension.
 * We import from ./stubGenerator (same directory, same bundle).
 * esbuild will tree-shake unused code and bundle everything into dist/extension.js.
 *
 * Path aliases (@rhizome/lib) come later if we extract to separate package.
 * For now: relative imports within src/ work fine.
 */

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
 * ANSWER (from UX & workflow design):
 * Workflow A: Select code → right-click → "Ask don-socratic" (context menu)
 *   - User sees it in menu (feedback = visibility)
 *   - Package.json already has menu entry for donSocratic command
 *   - Shows when editor has selection (when condition)
 *   - Response appears in webview or output channel
 *
 * Workflow B (future): @rhizome stub comment above function → right-click → "Stub this function"
 *   - User sees function signature → underline → context action
 *   - Or: keyboard shortcut (configure in keybindings)
 *   - Stub appears in file after triggering
 *
 * For now: Build workflow A fully. Stub command can follow same pattern.
 * Feedback: Use vscode.window.showInformationMessage() for simple cases,
 * webview panel for rich responses (show personas, chat history, etc.)
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('vscode-rhizome activated');

	// ======================================
	// CORE FEATURE: don-socratic guidance
	// ======================================
	// The don is always listening. When you select code, he brings
	// Socratic questioning to bear on what you're building.
	//
	// Workflow: Select code → right-click → "Ask don-socratic"
	// Response: Shows in output channel (for now; webview later)
	//
	// CURRENT IMPLEMENTATION:
	// 1. Get active editor and selection (user feedback: "What are you seeing?" )
	// 2. Create or show output channel
	// 3. Log what we're about to do (for MVP: just show the code)
	// 4. TODO: Call rhizome CLI with persona + code → get LLM response
	// 5. Display response to user
	//
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

		// Show user we're doing something
		await vscode.window.showInformationMessage('Asking don-socratic...');

		// Create or get output channel for responses
		const outputChannel = vscode.window.createOutputChannel('vscode-rhizome');
		outputChannel.show(true);

		// Log what we're about to do
		outputChannel.appendLine('='.repeat(60));
		outputChannel.appendLine('don-socratic');
		outputChannel.appendLine('='.repeat(60));
		outputChannel.appendLine('Selected code:');
		outputChannel.appendLine('');
		outputChannel.appendLine(selectedText);
		outputChannel.appendLine('');
		outputChannel.appendLine('--- Waiting for persona response ---');
		outputChannel.appendLine('');

		// TODO: Call rhizome CLI: rhizome ask --persona don-socratic <selected code>
		// TODO: Parse JSON response
		// TODO: Display in output channel
		// For now, placeholder:
		outputChannel.appendLine('(Persona-LLM integration coming soon)');
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
	// ANSWER (step-by-step workflow):
	// 1. Get active editor (vscode.window.activeTextEditor)
	// 2. Get the document text (editor.document.getText())
	// 3. Find all @rhizome stub comments (findStubComments from stubGenerator)
	// 4. If multiple, ask user which one (InputBox)
	// 5. For selected stub:
	//    a. Extract function signature
	//    b. Detect language from file extension
	//    c. Call generateStub(functionName, params, returnType, language)
	//    d. Call insertStub(code, line, generatedStub, language)
	// 6. Apply edit to document (TextEdit)
	// 7. Show success/error message
	//
	// Error handling: Show user what went wrong at each step
	//
	let stubDisposable = vscode.commands.registerCommand('vscode-rhizome.stub', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}

		const document = editor.document;
		const code = document.getText();

		// Detect language from file extension
		const ext = document.languageId; // 'typescript', 'javascript', 'python', etc.
		const language = ext === 'typescript' || ext === 'javascript' ? 'typescript' : ext === 'python' ? 'python' : null;

		if (!language) {
			vscode.window.showErrorMessage(`Unsupported language: ${ext}. Use TypeScript, JavaScript, or Python.`);
			return;
		}

		// Find @rhizome stub comments in the file
		const stubs = findStubComments(code, language);

		if (stubs.length === 0) {
			vscode.window.showWarningMessage('No @rhizome stub comments found in this file');
			return;
		}

		// If multiple stubs, ask user which one
		let targetStub = stubs[0];
		if (stubs.length > 1) {
			const picked = await vscode.window.showQuickPick(
				stubs.map((s) => `Line ${s.line}: ${s.functionName}`),
				{ placeHolder: 'Which function to stub?' }
			);
			if (!picked) return;
			const index = stubs.map((s) => `Line ${s.line}: ${s.functionName}`).indexOf(picked);
			targetStub = stubs[index];
		}

		// Generate stub code
		const stub = generateStub(targetStub.functionName, targetStub.params, targetStub.returnType, language as any);

		// Insert stub into file
		const modifiedCode = insertStub(code, targetStub.line, stub, language);

		// Apply edit to document
		const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(code.length));
		const edit = new vscode.TextEdit(fullRange, modifiedCode);

		// Create workspace edit and apply
		const workspaceEdit = new vscode.WorkspaceEdit();
		workspaceEdit.set(document.uri, [edit]);
		await vscode.workspace.applyEdit(workspaceEdit);

		vscode.window.showInformationMessage(`Stub created for ${targetStub.functionName}`);
	});

	context.subscriptions.push(stubDisposable);
}

export function deactivate() {}

