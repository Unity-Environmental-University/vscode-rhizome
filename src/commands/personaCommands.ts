/**
 * personaCommands.ts - Minimal inline persona interactions
 *
 * Two commands:
 * 1. inlineComment - Right-click to add inline persona response
 * 2. redPenReview - Right-click for don-socratic review (adds comments)
 */

import * as vscode from 'vscode';
import { askPersonaWithPrompt } from '../services/personaService';
import { getAvailablePersonas } from '../services/rhizomeService';
import { initializeRhizomeIfNeeded, clearStoredOpenAIKey } from '../services/initService';
import { detectLanguage } from '../utils/helpers';
import { parseCommentInsertion, formatInsertionPreview } from './commentParser';
import { ensureOpenAIKeyConfigured } from '../extension';
import { execSync } from 'child_process';

/**
 * Parse rhizome errors and provide helpful feedback
 */
function getUserFriendlyError(error: any): string {
	const message = (error as Error).message || String(error);

	// Check for 401 / 403 / auth errors
	if (message.includes('401') || message.includes('Unauthorized') || message.includes('403')) {
		return 'OpenAI API error: Check that your API key is valid and has credits remaining. Run: export OPENAI_API_KEY="sk-..." and restart VSCode';
	}

	// Check for persona not found
	if (message.includes('not found') || message.includes('Persona context')) {
		return 'Rhizome persona context issue. Try: rhizome persona list to verify personas are available';
	}

	// Check for timeout
	if (message.includes('timed out')) {
		return 'Request timed out. Check internet connection and OpenAI API status';
	}

	// Check for rhizome CLI not found
	if (message.includes('rhizome') && message.includes('not found')) {
		return 'Rhizome CLI not found. Make sure rhizome is installed and in your PATH: which rhizome';
	}

	// Generic fallback
	return `Error: ${message.substring(0, 150)}`;
}

async function ensurePersonaReady(workspaceRoot: string, persona: string): Promise<boolean> {
	const personas = await getAvailablePersonas();
	if (personas.has(persona)) {
		return true;
	}

	const choice = await vscode.window.showWarningMessage(
		`${persona} persona is not available in this workspace. Initialize rhizome first?`,
		'Run rhizome init',
		'Rebuild personas',
		'Cancel'
	);

	if (!choice || choice === 'Cancel') {
		return false;
	}

	try {
		if (choice === 'Run rhizome init') {
			const initialized = await initializeRhizomeIfNeeded(workspaceRoot);
			if (!initialized) {
				return false;
			}
		} else if (choice === 'Rebuild personas') {
			execSync('rhizome persona merge', {
				cwd: workspaceRoot,
				encoding: 'utf-8',
				stdio: 'pipe',
				env: process.env,
			});
		}
	} catch (error: any) {
		console.log('[vscode-rhizome:persona] Failed to repair persona context', error);
		vscode.window.showErrorMessage(`Failed to prepare personas: ${(error as Error).message}`);
		return false;
	}

	const refreshed = await getAvailablePersonas();
	if (!refreshed.has(persona)) {
		vscode.window.showErrorMessage(
			`${persona} persona is still missing. Please run "rhizome init" in the workspace and try again.`
		);
		return false;
	}

	return true;
}

function isOpenAIAuthError(error: any): boolean {
	const message = ((error as Error)?.message || '').toLowerCase();
	const stdout = typeof (error as any)?.stdout === 'string' ? (error as any).stdout.toLowerCase() : '';
	return message.includes('401') || message.includes('unauthorized') || stdout.includes('401') || stdout.includes('unauthorized');
}

async function handleOpenAIAuthError(workspaceRoot: string, error: any): Promise<boolean> {
	if (!isOpenAIAuthError(error)) {
		return false;
	}

	console.log('[vscode-rhizome] Detected OpenAI auth error. Clearing stored key and prompting user.');
	await clearStoredOpenAIKey(workspaceRoot);
	const reconfigured = await ensureOpenAIKeyConfigured(workspaceRoot, {
		forcePrompt: true,
		promptReason: 'OpenAI rejected the stored API key (HTTP 401). Please enter a new key.',
	});

	if (reconfigured) {
		vscode.window.showInformationMessage('OpenAI API key updated. Please run the command again.');
	} else {
		vscode.window.showWarningMessage('OpenAI API key remains unset. Command cancelled.');
	}

	return true;
}

/**
 * Command: Add inline comment from persona
 *
 * Right-click menu: Get a persona's response to selected code, inserted as comment
 */
export const askPersonaCommand = async () => {
	const editor = vscode.window.activeTextEditor;
	if (!editor || editor.selection.isEmpty) {
		vscode.window.showErrorMessage('Please select code');
		return;
	}

	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (!workspaceRoot) {
		vscode.window.showErrorMessage('No workspace folder open');
		return;
	}

	// Check API key before proceeding
	if (!(await ensureOpenAIKeyConfigured(workspaceRoot))) {
		return;
	}

	const selectedText = editor.document.getText(editor.selection).trim();
	const personas = await getAvailablePersonas();

	if (personas.size === 0) {
		vscode.window.showErrorMessage('No personas available');
		return;
	}

	const personaOptions = Array.from(personas.entries()).map(([name, role]) => ({
		label: name,
		description: role,
	}));

	const picked = await vscode.window.showQuickPick(personaOptions, {
		placeHolder: 'Choose a persona',
	});

	if (!picked) {
		return;
	}

	const question = await vscode.window.showInputBox({
		title: `Ask ${picked.label}`,
		prompt: 'What would you like to ask?',
		ignoreFocusOut: true,
	});

	if (!question) {
		return;
	}

	try {
		await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: `${picked.label} is thinking...`,
				cancellable: false,
			},
			async (progress) => {
				progress.report({ message: 'Waiting for response...' });

				const prompt = `${question}\n\n${selectedText}`;
				const response = await askPersonaWithPrompt(picked.label, picked.label, prompt);

				const language = detectLanguage(editor.document.languageId);
				const commentPrefix = language === 'python' ? '#' : '//';
				const commentLines = response.split('\n').map(line => `${commentPrefix} ${line}`);
				const comment = commentLines.join('\n');

				// Insert above selection (interlinear)
				const insertPos = editor.selection.start;
				const edit = new vscode.TextEdit(
					new vscode.Range(insertPos, insertPos),
					`${commentPrefix} === ${picked.label} says:\n${comment}\n`
				);
				const workspaceEdit = new vscode.WorkspaceEdit();
				workspaceEdit.set(editor.document.uri, [edit]);
				await vscode.workspace.applyEdit(workspaceEdit);

				progress.report({ message: 'Response inserted! ✓' });
			}
		);
	} catch (error: any) {
		if (workspaceRoot && (await handleOpenAIAuthError(workspaceRoot, error))) {
			return;
		}
		console.log('[vscode-rhizome:ask-persona] Command failed', error);
		const friendlyError = getUserFriendlyError(error);
		vscode.window.showErrorMessage(friendlyError);
	}
};

/**
 * Command: DEPRECATED - Animate (removed)
 *
 * Replaced by redPenReview. Keep for backwards compatibility but skip.
 */
export const documentWithPersonaCommand = async () => {
	vscode.window.showWarningMessage(
		'Animate command is deprecated. Use "Red Pen Review" instead.'
	);
};

/**
 * Command: Red Pen Review
 *
 * Right-click: Don-socratic persona reviews selected code, adds critique as comments
 */
export const redPenReviewCommand = async () => {
	const editor = vscode.window.activeTextEditor;
	if (!editor || editor.selection.isEmpty) {
		vscode.window.showErrorMessage('Please select code to review');
		return;
	}

	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (!workspaceRoot) {
		vscode.window.showErrorMessage('No workspace folder open');
		return;
	}

	// Check API key before proceeding
	if (!(await ensureOpenAIKeyConfigured(workspaceRoot))) {
		return;
	}

	if (!(await ensurePersonaReady(workspaceRoot, 'don-socratic'))) {
		return;
	}

	const selectedText = editor.document.getText(editor.selection);
	console.log(
		`[vscode-rhizome:red-pen] Command invoked — file: ${editor.document.fileName}, language: ${editor.document.languageId}, selectionLength: ${selectedText.length}`
	);

	try {
		// Detect file language and set appropriate comment syntax
		// This ensures personas format feedback with correct syntax (// for TS, # for Python)
		const language = detectLanguage(editor.document.languageId);
		const commentPrefix = language === 'python' ? '#' : '//';

		await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: 'Red pen review (don-socratic)...',
				cancellable: false,
			},
			async (progress) => {
				progress.report({ message: 'Analyzing code...' });

				const prompt = `You are the don-socratic. Read this. What questions does it raise?

For each place that invites questioning, write a comment (in ${commentPrefix} syntax):

Format: "${commentPrefix} Line X: [observation]. [question]?"

Examples:
${commentPrefix} Line 5: User could be undefined. What happens then?
${commentPrefix} Lines 12-15: Checking membership in an array. Have you measured the cost?

Here:\n\n${selectedText}`;
				const response = await askPersonaWithPrompt('don-socratic', 'don-socratic', prompt);
				console.log(`[vscode-rhizome:red-pen] Persona response received — length: ${response.length}`);

				// Parse response into structured insertions
				const fileLines = editor.document.getText().split('\n');
				const insertions = parseCommentInsertion(response, fileLines, commentPrefix);
				console.log(`[vscode-rhizome:red-pen] Parsed insertions — count: ${insertions.length}`);

				// Show preview
				const preview = formatInsertionPreview(insertions, fileLines);
				const approved = await vscode.window.showInformationMessage(
					`Found ${insertions.length} suggested comments. Insert them?`,
					'Show Preview',
					'Insert All',
					'Cancel'
				);

				if (approved === 'Cancel') {
					return;
				}

				if (approved === 'Show Preview') {
					const doc = await vscode.workspace.openTextDocument({
						language: language === 'python' ? 'python' : 'typescript',
						content: preview,
					});
					await vscode.window.showTextDocument(doc);
					return;
				}

				// Insert all approved comments (in reverse order to avoid line number drift)
				const sortedInsertions = [...insertions].sort((a, b) => b.lineNumber - a.lineNumber);
				const edits = sortedInsertions.map(ins => {
					const insertPos = new vscode.Position(ins.lineNumber, 0);
					return new vscode.TextEdit(
						new vscode.Range(insertPos, insertPos),
						`${commentPrefix} 🔴 ${ins.comment}\n`
					);
				});

				const workspaceEdit = new vscode.WorkspaceEdit();
				workspaceEdit.set(editor.document.uri, edits);
				await vscode.workspace.applyEdit(workspaceEdit);

				progress.report({ message: `${insertions.length} reviews inserted! ✓` });
			}
		);
	} catch (error: any) {
		if (await handleOpenAIAuthError(workspaceRoot, error)) {
			return;
		}
		const friendlyError = getUserFriendlyError(error);
		vscode.window.showErrorMessage(friendlyError);
	}
};

/**
 * Command: Red Pen Review entire file
 *
 * Right-click on file in explorer: Review whole file, append to file
 */
export const redPenReviewFileCommand = async (fileUri?: vscode.Uri) => {
	let targetUri = fileUri;
	let activeEditor: vscode.TextEditor | undefined;

	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (!workspaceRoot) {
		vscode.window.showErrorMessage('No workspace folder open');
		return;
	}

	// If called from editor, remember the current editor and its selection
	// If called from explorer, just get the file
	if (!targetUri) {
		activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			vscode.window.showErrorMessage('No file open');
			return;
		}
		targetUri = activeEditor.document.uri;
	} else {
		// Called from explorer context, try to find open editor for this file
		activeEditor = vscode.window.visibleTextEditors.find(
			editor => editor.document.uri.fsPath === targetUri!.fsPath
		);
	}

	// Check API key before proceeding
	if (!(await ensureOpenAIKeyConfigured(workspaceRoot))) {
		return;
	}

	if (!(await ensurePersonaReady(workspaceRoot, 'don-socratic'))) {
		return;
	}

	try {
		console.log(
			`[vscode-rhizome:red-pen-file] Command invoked — target: ${targetUri?.fsPath ?? 'unknown'}, selectionActive: ${
				activeEditor && !activeEditor.selection.isEmpty
			}`
		);
		const fileContent = await vscode.workspace.fs.readFile(targetUri);
		const fileText = new TextDecoder().decode(fileContent);

		const doc = await vscode.workspace.openTextDocument(targetUri);
		// Detect file language and set appropriate comment syntax for persona response formatting
		const language = detectLanguage(doc.languageId);
		const commentPrefix = language === 'python' ? '#' : '//';

		// Determine scope: if there's an active selection, focus on that; otherwise review whole file
		let textToReview = fileText;
		let selectionStartLine = 0;
		let selectionEndLine = fileText.split('\n').length;

		if (activeEditor && !activeEditor.selection.isEmpty) {
			textToReview = activeEditor.document.getText(activeEditor.selection);
			selectionStartLine = activeEditor.selection.start.line;
			selectionEndLine = activeEditor.selection.end.line;
		}

		await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: 'Red pen review...',
				cancellable: false,
			},
			async (progress) => {
				const scopeMessage = activeEditor && !activeEditor.selection.isEmpty
					? 'Analyzing selection...'
					: 'Analyzing entire file...';
				progress.report({ message: scopeMessage });

				const prompt = `You are the don-socratic. Read this. What questions does it raise?

For each place that invites questioning, write a comment (in ${commentPrefix} syntax):

Format: "${commentPrefix} Line X: [observation]. [question]?"

Examples:
${commentPrefix} Line 12: Function imports from three places. Why those three?
${commentPrefix} Lines 45-50: Happy path handled. What about the sad one?

Here:\n\n${textToReview}`;
				const response = await askPersonaWithPrompt('don-socratic', 'don-socratic', prompt);
				console.log(
					`[vscode-rhizome:red-pen-file] Persona response received — length: ${response.length}`
				);

				// Parse response into structured insertions
				const fileLines = fileText.split('\n');
				let insertions = parseCommentInsertion(response, fileLines, commentPrefix);
				console.log(
					`[vscode-rhizome:red-pen-file] Parsed insertions before selection filter — count: ${insertions.length}`
				);

				// If reviewing a selection, filter insertions to only that range
				if (activeEditor && !activeEditor.selection.isEmpty) {
					insertions = insertions.filter(
						ins => ins.lineNumber >= selectionStartLine && ins.lineNumber <= selectionEndLine
					);
					console.log(
						`[vscode-rhizome:red-pen-file] Parsed insertions after selection filter — count: ${insertions.length}`
					);
				}

				// Show preview
				const preview = formatInsertionPreview(insertions, fileLines);
				const approved = await vscode.window.showInformationMessage(
					`Found ${insertions.length} suggested comments. Insert them?`,
					'Show Preview',
					'Insert All',
					'Cancel'
				);

				if (approved === 'Cancel') {
					return;
				}

				if (approved === 'Show Preview') {
					const previewDoc = await vscode.workspace.openTextDocument({
						language: language === 'python' ? 'python' : 'typescript',
						content: preview,
					});
					await vscode.window.showTextDocument(previewDoc);
					return;
				}

				// Show file and insert comments
				const editor = await vscode.window.showTextDocument(doc);

				// Insert all approved comments (in reverse order to avoid line number drift)
				const sortedInsertions = [...insertions].sort((a, b) => b.lineNumber - a.lineNumber);
				const edits = sortedInsertions.map(ins => {
					const insertPos = new vscode.Position(ins.lineNumber, 0);
					return new vscode.TextEdit(
						new vscode.Range(insertPos, insertPos),
						`${commentPrefix} 🔴 ${ins.comment}\n`
					);
				});

				const workspaceEdit = new vscode.WorkspaceEdit();
				workspaceEdit.set(targetUri, edits);
				await vscode.workspace.applyEdit(workspaceEdit);

				progress.report({ message: `${insertions.length} reviews inserted! ✓` });
			}
		);
	} catch (error: any) {
		if (await handleOpenAIAuthError(workspaceRoot, error)) {
			return;
		}
		console.log('[vscode-rhizome:red-pen-file] Command failed', error);
		const friendlyError = getUserFriendlyError(error);
		vscode.window.showErrorMessage(friendlyError);
	}
};

/**
 * Dispose resources when extension deactivates
 */
export function disposeCommands(): void {
	// Placeholder for cleanup if needed
}
