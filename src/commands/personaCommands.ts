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

				const prompt = `You are a rigorous, critical code reviewer. Review this code and provide specific, actionable feedback.

For EACH issue or observation, format as a code comment (${commentPrefix} syntax):

Format: "${commentPrefix} Line X: [specific issue]. [Question or suggestion]"
Or for multiple lines: "${commentPrefix} Lines X-Y: [specific issue]. [Question or suggestion]"

Examples (in ${commentPrefix} comment format):
${commentPrefix} Line 5: Missing null check. What if user is undefined?
${commentPrefix} Lines 12-15: Loop could use Set for O(1) lookup instead of array.indexOf(). Have you considered this?
${commentPrefix} Line 20: Good error handling here.

Important:
- Start each comment with '${commentPrefix}'
- Reference EXACT line numbers
- Be specific and reference actual code patterns
- Ask hard questions

Review this code:\n\n${selectedText}`;
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

		const doc = await vscode.workspace.openTextDocument(targetUri);
		const language = detectLanguage(doc.languageId);
		const commentPrefix = language === 'python' ? '#' : '//';

		await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: 'Red pen review (entire file)...',
				cancellable: false,
			},
			async (progress) => {
				progress.report({ message: 'Analyzing entire file...' });

				const prompt = `You are a rigorous, critical code reviewer analyzing an entire file. Provide specific, actionable feedback.

For EACH issue, observation, or strength, format as a code comment (${commentPrefix} syntax):

Format: "${commentPrefix} Line X: [specific issue]. [Question or suggestion]"
Or for multiple lines: "${commentPrefix} Lines X-Y: [specific issue]. [Question or suggestion]"

Important:
- Start each comment with '${commentPrefix}'
- Reference EXACT line numbers from the code
- Be specific and reference actual code patterns
- Ask hard questions

Review the ENTIRE file for:
- Structure and organization issues
- Missing error handling or edge cases
- Clarity and readability problems
- Design pattern violations
- Performance concerns
- Security vulnerabilities

Analyze this file:\n\n${fileText}`;
				const response = await askPersonaWithPrompt('don-socratic', 'don-socratic', prompt);

				// Parse response into structured insertions
				const fileLines = fileText.split('\n');
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
