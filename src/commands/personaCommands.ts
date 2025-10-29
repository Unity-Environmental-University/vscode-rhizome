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
import { parseCommentInsertion, formatInsertionPreview } from './commentParser';

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

				const prompt = `You are the don-socratic. Your role is not to give answers, but to ask questions that make the developer examine their assumptions.

Read this code carefully. What questions does it raise? What assumptions might be hidden? What would happen at the edges?

For each line or section that invites questioning, write a comment (in ${commentPrefix} syntax). Start with what you observe, then ask the harder question. Make the developer think, not tell them what to do.

Format: "${commentPrefix} Line X: [What you observe]. [What's the question beneath this?]"

Examples (in ${commentPrefix} comment format):
${commentPrefix} Line 5: User could be undefined here. What happens then?
${commentPrefix} Lines 12-15: You're checking membership in an array. Have you measured the cost?
${commentPrefix} Line 20: This handles the error. But what was it, exactly?

Remember: Question, don't instruct. Observe, then ask why.

Here is the code:\n\n${selectedText}`;
				const response = await askPersonaWithPrompt('don-socratic', 'don-socratic', prompt);

				// Parse response into structured insertions
				const fileLines = editor.document.getText().split('\n');
				const insertions = parseCommentInsertion(response, fileLines, commentPrefix);

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
	let activeEditor: vscode.TextEditor | undefined;

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

	try {
		const fileContent = await vscode.workspace.fs.readFile(targetUri);
		const fileText = new TextDecoder().decode(fileContent);

		const doc = await vscode.workspace.openTextDocument(targetUri);
		// Detect file language and set appropriate comment syntax for persona response formatting
		const language = detectLanguage(doc.languageId);
		const commentPrefix = language === 'python' ? '#' : '//';

		// Determine scope: if there's an active selection, focus on that; otherwise review whole file
		let textToReview = fileText;
		let selectionStart = 0;
		let selectionEnd = fileText.split('\n').length;

		if (activeEditor && !activeEditor.selection.isEmpty) {
			textToReview = activeEditor.document.getText(activeEditor.selection);
			selectionStart = activeEditor.selection.start.line;
			selectionEnd = activeEditor.selection.end.line;
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

				const prompt = `You are the don-socratic, examining this ${activeEditor && !activeEditor.selection.isEmpty ? 'code section' : 'file'}. Not to judge it, but to question it.

What does the structure tell you? Where are the seams? What would break? What assumptions are baked in?

Look at:
- How the pieces fit together. Do they? Why arranged this way?
- Error cases. What happens when things go wrong? Did the author think about it?
- The names and patterns. What story do they tell?
- The edges and boundaries. What lives there?

For each section that raises a question—write a comment (in ${commentPrefix} syntax). Start with what you see. Then ask the question that matters.

Format: "${commentPrefix} Line X: [What you observe]. [What's the real question here?]"

Examples (in ${commentPrefix} comment format):
${commentPrefix} Line 12: This function imports from three places. Why those three? What would break if one changed?
${commentPrefix} Lines 45-50: You handle the happy path. What about the sad one?
${commentPrefix} Line 88: This pattern appears three times. Three times means something. What does it mean?

Question the code. Question the choices. Make the developer see what they built, and ask themselves why.

Here is the ${activeEditor && !activeEditor.selection.isEmpty ? 'section' : 'file'}:\n\n${textToReview}`;
				const response = await askPersonaWithPrompt('don-socratic', 'don-socratic', prompt);

				// Parse response into structured insertions
				const fileLines = fileText.split('\n');
				let insertions = parseCommentInsertion(response, fileLines, commentPrefix);

				// If reviewing a selection, filter insertions to only that range
				if (activeEditor && !activeEditor.selection.isEmpty) {
					insertions = insertions.filter(
						ins => ins.lineNumber >= selectionStart && ins.lineNumber <= selectionEnd
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
		vscode.window.showErrorMessage(`Failed: ${(error as Error).message}`);
	}
};

/**
 * Dispose resources when extension deactivates
 */
export function disposeCommands(): void {
	// Placeholder for cleanup if needed
}
