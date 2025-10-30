/**
 * personaService.ts
 *
 * @rhizome: What's the responsibility of a persona service?
 * High-level persona workflows: picking personas, building prompts, extracting suggestions.
 * Not I/O (that's rhizomeService), not UI rendering (that's outputFormatter).
 * Just the logic of "persona interaction."
 */

import * as vscode from 'vscode';
import { queryPersona, getAvailablePersonas } from './rhizomeService';
import { initializeRhizomeIfNeeded } from './initService';

/**
 * Execute persona query and return response
 *
 * @param persona - Persona name
 * @param personaDisplayName - Display name for persona
 * @param prompt - Prompt text
 * @param context - Optional context (question, selectedText)
 * @returns Response from persona
 */
export async function askPersonaWithPrompt(
	persona: string,
	personaDisplayName: string,
	prompt: string,
	context?: { question?: string; selectedText?: string }
): Promise<string> {
	console.log(
		`[vscode-rhizome:persona] askPersonaWithPrompt — persona: ${persona}, promptLength: ${prompt.length}, hasContext: ${
			context ? 'yes' : 'no'
		}`
	);
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (!workspaceRoot) {
		vscode.window.showErrorMessage('No workspace folder open');
		throw new Error('No workspace folder');
	}

	const initialized = await initializeRhizomeIfNeeded(workspaceRoot);
	if (!initialized) {
		vscode.window.showErrorMessage('Could not initialize rhizome. Check workspace permissions.');
		throw new Error('Rhizome initialization failed');
	}

	try {
		const response = await queryPersona(prompt, persona, 30000, workspaceRoot);
		console.log(
			`[vscode-rhizome:persona] queryPersona success — persona: ${persona}, responseLength: ${response.length}`
		);
		return response;
	} catch (error) {
		console.log('[vscode-rhizome:persona] queryPersona failed', error);
		throw error;
	}
}

/**
 * Infer a question from selected text
 *
 * @param selection - Selected code
 * @param languageId - Language identifier
 * @returns Inferred question
 */
export function inferQuestionFromSelection(selection: string, languageId?: string): string {
	const descriptor = languageId?.includes('markdown') || languageId === 'plaintext' ? 'content' : 'code';
	const trimmed = selection.replace(/\s+/g, ' ').trim();
	const snippet = trimmed.slice(0, 90);
	const ellipsis = trimmed.length > 90 ? '…' : '';
	return `What should we improve in this ${descriptor}? (${snippet}${ellipsis})`;
}

/**
 * Extract suggested commands from persona response
 *
 * @param response - Persona response text
 * @returns List of suggested commands
 */
export function extractAgenticCommands(response: string): string[] {
	const commands = new Set<string>();

	// Extract from fenced code blocks
	const codeBlockRegex = /```[a-zA-Z0-9+\-_.]*\s*([\s\S]*?)```/g;
	let match: RegExpExecArray | null;
	while ((match = codeBlockRegex.exec(response)) !== null) {
		const block = match[1]
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);
		for (const line of block) {
			const cleaned = line.startsWith('$') ? line.slice(1).trim() : line;
			if (isLikelyCommand(cleaned)) {
				commands.add(cleaned);
			}
		}
	}

	// Extract from inline "Command:" or "Action:" lines
	const inlineRegex = /^\s*(?:-|\*|•)?\s*(?:Command|Action|Run|Execute)\s*[:：]\s*`?([^`\n]+)`?/gim;
	let inlineMatch: RegExpExecArray | null;
	while ((inlineMatch = inlineRegex.exec(response)) !== null) {
		const cleaned = inlineMatch[1].trim();
		if (isLikelyCommand(cleaned)) {
			commands.add(cleaned);
		}
	}

	return Array.from(commands.values());
}

/**
 * Check if text is likely a shell command
 */
function isLikelyCommand(text: string): boolean {
	if (!text) return false;
	const lower = text.toLowerCase();
	return (
		lower.startsWith('rhizome ') ||
		lower.startsWith('npm ') ||
		lower.startsWith('pip ') ||
		lower.startsWith('python ') ||
		lower.startsWith('node ') ||
		lower.startsWith('bash ') ||
		lower.startsWith('./') ||
		lower.startsWith('gh ')
	);
}

/**
 * Show agentic action suggestions to user
 *
 * @param commands - Commands to suggest
 * @returns true if user confirmed execution
 */
export async function promptAgenticActions(commands: string[]): Promise<void> {
	const items = commands.map((command) => ({
		label: command,
		description: 'Send to terminal',
	}));

	const picked = await vscode.window.showQuickPick(items, {
		canPickMany: true,
		title: 'Rhizome suggested actions',
		placeHolder: 'Select commands to run (Esc to skip)',
	});

	if (!picked || picked.length === 0) {
		return;
	}

	const confirmation = await vscode.window.showWarningMessage(
		`Run ${picked.length} command${picked.length > 1 ? 's' : ''} in terminal?`,
		{ modal: true },
		'Run',
		'Cancel'
	);

	if (confirmation !== 'Run') {
		return;
	}

	const terminal = getOrCreateTerminal();
	terminal.show(true);
	for (const { label } of picked) {
		terminal.sendText(label, true);
	}

	vscode.window.showInformationMessage(`Sent ${picked.length} command${picked.length > 1 ? 's' : ''} to terminal.`);
}

let agenticTerminal: vscode.Terminal | undefined;

function getOrCreateTerminal(): vscode.Terminal {
	if (!agenticTerminal) {
		agenticTerminal = vscode.window.createTerminal({
			name: 'Rhizome Agentic Actions',
		});
	}
	return agenticTerminal;
}

/**
 * Dispose agentic terminal (call from extension deactivation)
 */
export function disposeAgenticTerminal(): void {
	if (agenticTerminal) {
		agenticTerminal.dispose();
		agenticTerminal = undefined;
	}
}
