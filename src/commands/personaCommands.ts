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
import { detectLanguage } from '../utils/helpers';

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

				// Insert at end of file to accumulate responses
				const lineCount = editor.document.lineCount;
				const lastLine = editor.document.lineAt(lineCount - 1);
				const insertPos = new vscode.Position(lineCount, 0);

				const edit = new vscode.TextEdit(
					new vscode.Range(insertPos, insertPos),
					`\n${commentPrefix}\n${commentPrefix} === ${picked.label} says:\n${comment}\n`
				);
				const workspaceEdit = new vscode.WorkspaceEdit();
				workspaceEdit.set(editor.document.uri, [edit]);
				await vscode.workspace.applyEdit(workspaceEdit);

				progress.report({ message: 'Response added! ✓' });
			}
		);
	} catch (error: any) {
		vscode.window.showErrorMessage(`Failed: ${(error as Error).message}`);
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

	const selectedText = editor.document.getText(editor.selection);

	try {
		await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: 'Red pen review (don-socratic)...',
				cancellable: false,
			},
			async (progress) => {
				progress.report({ message: 'Analyzing code...' });

				const prompt = `As a rigorous code reviewer, provide a critical red-pen review of this code. Ask hard questions about clarity, edge cases, and assumptions:\n\n${selectedText}`;
				const response = await askPersonaWithPrompt('don-socratic', 'don-socratic', prompt);

				const language = detectLanguage(editor.document.languageId);
				const commentPrefix = language === 'python' ? '#' : '//';
				const commentLines = response.split('\n').map(line => `${commentPrefix} 🔴 ${line}`);
				const comment = commentLines.join('\n');

				// Insert at end of file to accumulate reviews
				const lineCount = editor.document.lineCount;
				const insertPos = new vscode.Position(lineCount, 0);

				const edit = new vscode.TextEdit(
					new vscode.Range(insertPos, insertPos),
					`\n${commentPrefix}\n${commentPrefix} === 🔴 RED PEN REVIEW:\n${comment}\n`
				);
				const workspaceEdit = new vscode.WorkspaceEdit();
				workspaceEdit.set(editor.document.uri, [edit]);
				await vscode.workspace.applyEdit(workspaceEdit);

				progress.report({ message: 'Review added! ✓' });
			}
		);
	} catch (error: any) {
		vscode.window.showErrorMessage(`Failed: ${(error as Error).message}`);
	}
};

/**
 * Command: Red Pen Review entire file
 *
 * Right-click on file in explorer: Review whole file, append to file
 */
export const redPenReviewFileCommand = async (fileUri?: vscode.Uri) => {
	let targetUri = fileUri;

	// If not called from explorer context, use active editor
	if (!targetUri) {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No file open');
			return;
		}
		targetUri = editor.document.uri;
	}

	try {
		const fileContent = await vscode.workspace.fs.readFile(targetUri);
		const fileText = new TextDecoder().decode(fileContent);

		await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: 'Red pen review (entire file)...',
				cancellable: false,
			},
			async (progress) => {
				progress.report({ message: 'Analyzing entire file...' });

				const prompt = `As a rigorous code reviewer, provide a critical red-pen review of this entire file. Ask hard questions about structure, clarity, edge cases, and assumptions:\n\n${fileText}`;
				const response = await askPersonaWithPrompt('don-socratic', 'don-socratic', prompt);

				// Open file and append review at end
				const doc = await vscode.workspace.openTextDocument(targetUri);
				const editor = await vscode.window.showTextDocument(doc);

				const language = detectLanguage(doc.languageId);
				const commentPrefix = language === 'python' ? '#' : '//';
				const commentLines = response.split('\n').map(line => `${commentPrefix} 🔴 ${line}`);
				const comment = commentLines.join('\n');

				const lineCount = doc.lineCount;
				const insertPos = new vscode.Position(lineCount, 0);

				const edit = new vscode.TextEdit(
					new vscode.Range(insertPos, insertPos),
					`\n${commentPrefix}\n${commentPrefix} === 🔴 FILE-LEVEL RED PEN REVIEW:\n${comment}\n`
				);
				const workspaceEdit = new vscode.WorkspaceEdit();
				workspaceEdit.set(targetUri, [edit]);
				await vscode.workspace.applyEdit(workspaceEdit);

				progress.report({ message: 'File review added! ✓' });
			}
		);
	} catch (error: any) {
		vscode.window.showErrorMessage(`Failed: ${(error as Error).message}`);
	}
};

/**
 * Dispose resources when extension deactivates
 */
export function disposeCommands(): void {
	// Placeholder for cleanup if needed
}
