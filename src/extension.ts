
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
 * Helper: Query a persona via rhizome CLI
 *
 * don-socratic asks:
 * When you call out to an external service (rhizome CLI), what should
 * you encapsulate? What belongs in a helper, and what stays in the command handler?
 *
 * ANSWER:
 * The rhizome call itself is pure I/O. It takes text, sends it to rhizome,
 * gets back text. That's a perfect candidate for extraction.
 * The command handler stays focused: get selection, call helper, show result.
 * The helper stays focused: I/O with rhizome, error handling, nothing else.
 */
async function queryPersona(
	text: string,
	persona: string,
	timeoutMs: number = 30000
): Promise<string> {
	try {
		const { execSync } = require('child_process');
		const response = execSync(`rhizome query --persona ${persona}`, {
			input: text,
			encoding: 'utf-8',
			timeout: timeoutMs,
		});
		return response;
	} catch (error: any) {
		throw new Error(`Rhizome query failed: ${(error as Error).message}`);
	}
}

/**
 * Helper: Format output channel for persona responses
 *
 * don-socratic asks:
 * Those eight appendLine() calls... what pattern do you see?
 * Are they structural (header, content, footer)? Could you name that pattern?
 * What would happen if you extracted it?
 */
function formatPersonaOutput(channel: vscode.OutputChannel, personaName: string, selectedCode: string, response: string) {
	channel.appendLine('='.repeat(60));
	channel.appendLine(personaName);
	channel.appendLine('='.repeat(60));
	channel.appendLine('Selected code:');
	channel.appendLine('');
	channel.appendLine(selectedCode);
	channel.appendLine('');
	channel.appendLine('--- Waiting for persona response ---');
	channel.appendLine('');
	channel.appendLine('');
	channel.appendLine(`Response from ${personaName}:`);
	channel.appendLine('');
	channel.appendLine(response);
}

/**
 * Helper: Get active selection, validate it exists
 *
 * don-socratic asks:
 * Both don-socratic and inline-question handlers need the same thing: editor + selection.
 * What if you extracted that validation into a helper?
 * What would you call it?
 */
function getActiveSelection(): { editor: vscode.TextEditor; selectedText: string } | null {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active editor');
		return null;
	}

	const selectedText = editor.document.getText(editor.selection);
	if (!selectedText) {
		vscode.window.showErrorMessage('Please select code to question');
		return null;
	}

	return { editor, selectedText };
}

/**
 * Helper: Detect language from VSCode languageId
 *
 * Both stub generation and inline questioning need this.
 * Extract it once, use it everywhere.
 */
function detectLanguage(languageId: string): 'typescript' | 'javascript' | 'python' | null {
	if (languageId === 'typescript' || languageId === 'javascript') {
		return 'typescript';
	}
	if (languageId === 'python') {
		return 'python';
	}
	return null;
}

/**
 * Helper: Handle don-socratic response workflow
 *
 * Given selected code + persona, query rhizome and display in output channel.
 * Extracted so both "ask don-socratic" and "ask inline question" can use it.
 */
async function askPersonaAboutSelection(persona: string, personaDisplayName: string) {
	const selection = getActiveSelection();
	if (!selection) return;

	const { selectedText } = selection;

	await vscode.window.showInformationMessage(`Asking ${personaDisplayName}...`);

	const outputChannel = vscode.window.createOutputChannel('vscode-rhizome');
	outputChannel.show(true);

	try {
		const response = await queryPersona(selectedText, persona);
		formatPersonaOutput(outputChannel, personaDisplayName, selectedText, response);
	} catch (error: any) {
		outputChannel.appendLine('');
		outputChannel.appendLine('Error calling rhizome CLI:');
		outputChannel.appendLine((error as Error).message);
		outputChannel.appendLine('');
		outputChannel.appendLine('Make sure rhizome is installed and in your PATH.');
	}
}

/**
 * Activate extension on startup
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('vscode-rhizome activated');

	// ======================================
	// COMMAND: ask don-socratic about selection
	// ======================================
	let donSocraticDisposable = vscode.commands.registerCommand('vscode-rhizome.donSocratic', async () => {
		await askPersonaAboutSelection('don-socratic', 'don-socratic');
	});

	context.subscriptions.push(donSocraticDisposable);

	// ======================================
	// COMMAND: ask don-socratic inline question
	// ======================================
	let inlineQuestionDisposable = vscode.commands.registerCommand(
		'vscode-rhizome.inlineQuestion',
		async () => {
			await askPersonaAboutSelection('don-socratic', 'don-socratic (inline)');
		}
	);

	context.subscriptions.push(inlineQuestionDisposable);

	// ======================================
	// COMMAND: stub generation
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
		const language = detectLanguage(document.languageId);

		if (!language) {
			vscode.window.showErrorMessage(
				`Unsupported language: ${document.languageId}. Use TypeScript, JavaScript, or Python.`
			);
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
		const stub = generateStub(targetStub.functionName, targetStub.params, targetStub.returnType, language);

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

