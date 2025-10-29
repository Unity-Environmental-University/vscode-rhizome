/**
 * personaCommands.ts
 *
 * @rhizome: What's in a command handler?
 * 1. Gather input (selection, user input)
 * 2. Call service (persona query, etc)
 * 3. Present output (show result, handle errors)
 *
 * Handlers are thin. They don't own business logic.
 * They orchestrate: UI -> Service -> UI.
 */

import * as vscode from 'vscode';
import { getAvailablePersonas } from '../services/rhizomeService';
import { askPersonaWithPrompt, inferQuestionFromSelection, extractAgenticCommands, promptAgenticActions, disposeAgenticTerminal } from '../services/personaService';
import { formatPersonaOutput } from '../ui/outputFormatter';
import { detectLanguage } from '../utils/helpers';

/**
 * Command: Ask any persona (dynamic picker)
 */
export const askPersonaCommand = async () => {
	const editor = vscode.window.activeTextEditor;
	const selectionRange = editor?.selection;
	const selectedText = editor && selectionRange && !selectionRange.isEmpty
		? editor.document.getText(selectionRange).trim()
		: '';

	const personas = await getAvailablePersonas();

	if (personas.size === 0) {
		vscode.window.showErrorMessage('No personas available. Check rhizome installation.');
		return;
	}

	const personaOptions = Array.from(personas.entries()).map(([name, role]) => ({
		label: name,
		description: role,
	}));

	const picked = await vscode.window.showQuickPick(personaOptions, {
		placeHolder: 'Choose a persona to question your code',
		matchOnDescription: true,
	});

	if (!picked) {
		return;
	}

	let question: string | undefined;
	if (selectedText) {
		const inferred = inferQuestionFromSelection(selectedText, editor?.document.languageId);
		const confirmed = await vscode.window.showInputBox({
			title: 'Question for persona',
			prompt: 'Review or adjust the question before asking.',
			value: inferred,
			valueSelection: [0, inferred.length],
			ignoreFocusOut: true,
		});
		if (confirmed === undefined) {
			return;
		}
		question = confirmed.trim();
		if (!question) {
			vscode.window.showErrorMessage('Question cannot be empty.');
			return;
		}
	} else {
		const entered = await vscode.window.showInputBox({
			title: 'Ask a persona',
			prompt: 'What would you like to ask?',
			placeHolder: 'e.g., What should I focus on next?',
			ignoreFocusOut: true,
		});
		if (!entered) {
			return;
		}
		question = entered.trim();
		if (!question) {
			vscode.window.showErrorMessage('Question cannot be empty.');
			return;
		}
	}

	const prompt = selectedText ? `${question}\n\n${selectedText}` : question;

	try {
		const outputChannel = vscode.window.createOutputChannel('vscode-rhizome');
		outputChannel.show(true);

		const response = await askPersonaWithPrompt(picked.label, picked.label, prompt, {
			question,
			selectedText,
		});

		formatPersonaOutput(outputChannel, picked.label, question, selectedText, response);

		const suggestedCommands = extractAgenticCommands(response);
		if (suggestedCommands.length > 0) {
			await promptAgenticActions(suggestedCommands);
		}
	} catch (error: any) {
		vscode.window.showErrorMessage(`Failed to query persona: ${(error as Error).message}`);
	}
};

/**
 * Command: Document with persona (right-click menu)
 */
export const documentWithPersonaCommand = async () => {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('Please open a file and select code before documenting');
		return;
	}

	if (editor.selection.isEmpty) {
		vscode.window.showErrorMessage('Please select some code to document');
		return;
	}

	const selectedText = editor.document.getText(editor.selection);
	const document = editor.document;

	const personasMap = await getAvailablePersonas();

	if (personasMap.size === 0) {
		vscode.window.showErrorMessage('No personas available. Check rhizome installation.');
		return;
	}

	const personaOptions = Array.from(personasMap.entries()).map(([name, role]) => ({
		label: name,
		description: role || `Ask ${name} to document this`,
	}));

	const picked = await vscode.window.showQuickPick(personaOptions, {
		placeHolder: 'Which persona should document this code?',
	});

	if (!picked) {
		return;
	}

	const prompt = `Please provide clear documentation/comments for this code:\n\n${selectedText}`;

	try {
		await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: `Asking ${picked.label} to document your code...`,
				cancellable: false,
			},
			async (progress) => {
				progress.report({ message: 'Waiting for response (this may take 10-30 seconds)...' });

				const response = await askPersonaWithPrompt(picked.label, picked.label, prompt);

				const language = detectLanguage(document.languageId);
				const commentPrefix = language === 'python' ? '#' : '//';

				const commentLines = response.split('\n').map((line) => `${commentPrefix} ${line}`);
				const comment = commentLines.join('\n');

				const insertPos = editor.selection.start;
				const edit = new vscode.TextEdit(
					new vscode.Range(insertPos, insertPos),
					`${comment}\n`
				);
				const workspaceEdit = new vscode.WorkspaceEdit();
				workspaceEdit.set(document.uri, [edit]);
				await vscode.workspace.applyEdit(workspaceEdit);

				progress.report({ message: 'Documentation added! ✓' });
				vscode.window.showInformationMessage(`${picked.label} documentation added above selection`);
			}
		);
	} catch (error: any) {
		vscode.window.showErrorMessage(
			`Failed to get documentation from ${picked.label}: ${(error as Error).message}`
		);
	}
};

/**
 * Dispose resources when extension deactivates
 */
export function disposeCommands(): void {
	disposeAgenticTerminal();
}
