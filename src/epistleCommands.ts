/**
 * Epistle Command Handlers
 *
 * Handles user-facing commands for recording epistles:
 * - Record letter epistle (multi-persona dialog saved to file)
 * - Record inline epistle (comment block in code)
 * - Create dynamic persona (analyze file)
 *
 * @rhizome: Why separate from extension.ts?
 * Extension.ts handles VS Code lifecycle and all commands.
 * This module handles epistle-specific logic (creating dialogs, calling generators, updating registry).
 * Keeps concerns separated: extension = VSCode, this = epistle domain logic.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { LetterEpistleGenerator, InlineEpistleGenerator, DynamicPersonaGenerator, EpisodeContext } from './epistleGenerator';
import { EpistleRegistry } from './epistleRegistry';
import { getActiveFlightPlan, getAllFlightPlans, formatFlightPlanInfo } from './flightPlanIntegration';

/**
 * Telemetry logging (imported from extension context)
 */
type TelemetryFn = (component: string, phase: string, message: string, data?: Record<string, any>) => void;

/**
 * Show persona picker dialog
 *
 * @rhizome: How do we present personas to the user?
 * Quick picker with:
 * - Curated default list (dev-guide, code-reviewer, etc.)
 * - Multi-select mode so user can pick multiple personas
 * - User fills in other personas if needed (future: autocomplete)
 */
export async function showPersonaPicker(
	curated: string[] = ['dev-guide', 'code-reviewer', 'dev-advocate', 'don-socratic']
): Promise<string[] | undefined> {
	const items = curated.map(p => ({
		label: p,
		picked: false,
	}));

	const selected = await vscode.window.showQuickPick(items, {
		canPickMany: true,
		placeHolder: 'Select personas for epistle (arrow keys + space, then Enter)',
		title: 'Choose personas to discuss this code',
	});

	return selected?.map(s => s.label);
}

/**
 * Show input dialog for epistle topic
 */
export async function getEpistleTopic(): Promise<string | undefined> {
	return vscode.window.showInputBox({
		placeHolder: 'e.g., "Error handling strategy" or "Why is this async?"',
		prompt: 'What is the topic of this epistle?',
		title: 'Epistle Topic',
		validateInput: (value: string) => {
			if (value.trim().length === 0) {
				return 'Topic cannot be empty';
			}
			if (value.length > 100) {
				return 'Topic must be less than 100 characters';
			}
			return null;
		},
	});
}

/**
 * Show dialog to link to a flight plan (optional)
 *
 * @rhizome: What's the UX for flight plan linking?
 * 1. Check if there's an active flight plan
 * 2. If yes, offer quick link to it
 * 3. Also offer to browse all flight plans
 * 4. Allow skipping entirely
 *
 * This makes linking frictionless for the common case (active flight plan)
 * but flexible for edge cases (multiple projects, retrospectives on old work).
 */
export async function selectFlightPlanLink(workspaceRoot: string): Promise<string | undefined> {
	// Check for active flight plan
	const activeFlightPlan = getActiveFlightPlan(workspaceRoot);

	// Build quick pick options
	const options: vscode.QuickPickItem[] = [
		{ label: 'Skip linking', description: 'Epistle stands alone (no flight plan reference)' },
	];

	if (activeFlightPlan) {
		options.unshift({
			label: formatFlightPlanInfo(activeFlightPlan),
			description: '✓ Active flight plan (recommended)',
			picked: true, // Default selection
		});
	}

	options.push({
		label: 'Browse other flight plans...',
		description: 'Choose from all available flight plans',
	});

	const response = await vscode.window.showQuickPick(options, {
		placeHolder: 'Link this epistle to a flight plan (optional)?',
		title: 'Flight Plan Linking',
	});

	if (!response) {
		// User cancelled
		return undefined;
	}

	if (response.label === 'Skip linking') {
		return undefined;
	}

	// Check if this is the active flight plan
	if (activeFlightPlan && response.label === formatFlightPlanInfo(activeFlightPlan)) {
		return activeFlightPlan.id;
	}

	// User wants to browse all flight plans
	if (response.label === 'Browse other flight plans...') {
		const allPlans = getAllFlightPlans(workspaceRoot);

		if (allPlans.length === 0) {
			vscode.window.showInformationMessage('No flight plans found in this workspace');
			return undefined;
		}

		const selected = await vscode.window.showQuickPick(
			allPlans.map(plan => ({
				label: formatFlightPlanInfo(plan),
				description: plan.id,
				flightPlanId: plan.id,
			})),
			{
				placeHolder: 'Choose a flight plan to link to',
				title: 'Select Flight Plan',
			}
		);

		return (selected as any)?.flightPlanId;
	}

	return undefined;
}

/**
 * Record a letter epistle (file-based multi-persona dialog)
 *
 * User flow:
 * 1. Right-click code selection → "Record epistle..." → "Letter epistle"
 * 2. Choose personas (dev-guide, code-reviewer, etc.)
 * 3. Enter topic ("Error handling strategy", etc.)
 * 4. Optionally link to flight plan
 * 5. Extension generates markdown template
 * 6. Opens in editor for user to fill in dialog
 * 7. Registers in epistle registry
 */
export async function recordLetterEpistle(
	editor: vscode.TextEditor,
	registry: EpistleRegistry,
	telemetry: TelemetryFn,
	epistlesDir: string,
	workspaceRoot: string
): Promise<void> {
	telemetry('EPISTLE', 'START', 'Record letter epistle');

	try {
		// 1. Get selected code
		const selectedCode = editor.document.getText(editor.selection);
		const selectedFile = editor.document.fileName;
		const selectedLines = {
			start: editor.selection.start.line + 1,
			end: editor.selection.end.line + 1,
		};

		if (selectedCode.trim().length === 0) {
			telemetry('EPISTLE', 'ERROR', 'No code selected');
			vscode.window.showErrorMessage('Please select some code before recording an epistle');
			return;
		}

		telemetry('EPISTLE', 'STEP', 'Code selected', {
			codeLength: selectedCode.length,
			file: path.basename(selectedFile),
		});

		// 2. Show persona picker
		const personas = await showPersonaPicker();
		if (!personas || personas.length === 0) {
			telemetry('EPISTLE', 'ERROR', 'No personas selected');
			return;
		}

		telemetry('EPISTLE', 'STEP', 'Personas selected', { personas });

		// 3. Get topic
		const topic = await getEpistleTopic();
		if (!topic) {
			telemetry('EPISTLE', 'ERROR', 'No topic provided');
			return;
		}

		telemetry('EPISTLE', 'STEP', 'Topic provided', { topic });

		// 4. Optionally link to flight plan
		const flightPlan = await selectFlightPlanLink(workspaceRoot);

		telemetry('EPISTLE', 'STEP', 'Flight plan linking', {
			linked: !!flightPlan,
			flightPlan,
		});

		// 5. Generate epistle
		const context: EpisodeContext = {
			selectedCode,
			selectedFile,
			selectedLines,
			personas,
			topic,
			flightPlan,
			language: editor.document.languageId,
		};

		const id = registry.generateId('letter', topic);
		const { filePath, content } = LetterEpistleGenerator.createFile(context, id, epistlesDir);

		telemetry('EPISTLE', 'STEP', 'Epistle file created', {
			id,
			filepath: path.basename(filePath),
		});

		// 6. Register in epistle registry
		const entry = LetterEpistleGenerator.generateRegistryEntry(id, context, path.basename(filePath));
		registry.addEntry(entry);

		telemetry('EPISTLE', 'STEP', 'Epistle registered', { id });

		// 7. Open in editor
		const doc = await vscode.workspace.openTextDocument(filePath);
		await vscode.window.showTextDocument(doc);

		telemetry('EPISTLE', 'SUCCESS', 'Letter epistle recorded', {
			id,
			topic,
			personas: personas.length,
		});

		vscode.window.showInformationMessage(
			`✓ Epistle "${topic}" created! Fill in the dialog and save.`
		);
	} catch (error: any) {
		telemetry('EPISTLE', 'ERROR', 'Failed to record letter epistle', {
			error: error.message,
		});
		vscode.window.showErrorMessage(`Failed to record epistle: ${error.message}`);
	}
}

/**
 * Record an inline epistle (comment block in source code)
 *
 * User flow:
 * 1. Right-click code selection → "Record epistle..." → "Inline epistle"
 * 2. Choose personas
 * 3. Enter brief header/topic
 * 4. Comment block inserted above selection
 * 5. Registered in epistle registry
 */
export async function recordInlineEpistle(
	editor: vscode.TextEditor,
	registry: EpistleRegistry,
	telemetry: TelemetryFn
): Promise<void> {
	telemetry('EPISTLE', 'START', 'Record inline epistle');

	try {
		// 1. Get selected code
		const selectedCode = editor.document.getText(editor.selection);
		const selectedFile = editor.document.fileName;
		const selectedLines = {
			start: editor.selection.start.line + 1,
			end: editor.selection.end.line + 1,
		};

		if (selectedCode.trim().length === 0) {
			telemetry('EPISTLE', 'ERROR', 'No code selected');
			vscode.window.showErrorMessage('Please select some code before recording an inline epistle');
			return;
		}

		telemetry('EPISTLE', 'STEP', 'Code selected for inline epistle', {
			codeLength: selectedCode.length,
		});

		// 2. Show persona picker
		const personas = await showPersonaPicker();
		if (!personas || personas.length === 0) {
			telemetry('EPISTLE', 'ERROR', 'No personas selected');
			return;
		}

		telemetry('EPISTLE', 'STEP', 'Personas selected', { personas });

		// 3. Get topic/header
		const topic = await vscode.window.showInputBox({
			placeHolder: 'e.g., "Why is this async?" or "Error handling"',
			prompt: 'Brief description for inline epistle',
			title: 'Inline Epistle Topic',
		});

		if (!topic) {
			telemetry('EPISTLE', 'ERROR', 'No topic provided');
			return;
		}

		telemetry('EPISTLE', 'STEP', 'Topic provided', { topic });

		// 4. Generate comment block
		const context: EpisodeContext = {
			selectedCode,
			selectedFile,
			selectedLines,
			personas,
			topic,
			language: editor.document.languageId,
		};

		const id = registry.generateId('inline');
		const commentBlock = InlineEpistleGenerator.generateCommentBlock(context, id);

		// 5. Insert into editor
		const inserted = InlineEpistleGenerator.insertAboveSelection(editor, commentBlock);

		if (!inserted) {
			telemetry('EPISTLE', 'ERROR', 'Failed to insert comment block');
			vscode.window.showErrorMessage('Failed to insert epistle comment');
			return;
		}

		telemetry('EPISTLE', 'STEP', 'Comment block inserted', { id });

		// 6. Register in epistle registry
		const entry = InlineEpistleGenerator.generateRegistryEntry(id, context);
		registry.addEntry(entry);

		telemetry('EPISTLE', 'SUCCESS', 'Inline epistle recorded', {
			id,
			topic,
			personas: personas.length,
			file: path.basename(selectedFile),
		});

		vscode.window.showInformationMessage(
			`✓ Inline epistle "${topic}" created above your selection!`
		);
	} catch (error: any) {
		telemetry('EPISTLE', 'ERROR', 'Failed to record inline epistle', {
			error: error.message,
		});
		vscode.window.showErrorMessage(`Failed to record inline epistle: ${error.message}`);
	}
}

/**
 * Create a dynamic persona from source file analysis
 *
 * User flow:
 * 1. Right-click file → "Create persona from file"
 * 2. Extension analyzes file (imports, error patterns, type safety, etc.)
 * 3. Generates persona that represents file's perspective
 * 4. Persona appears in persona picker for future epistles
 */
export async function createDynamicPersona(
	filepath: string,
	registry: EpistleRegistry,
	telemetry: TelemetryFn
): Promise<void> {
	telemetry('EPISTLE', 'START', 'Create dynamic persona from file', {
		file: path.basename(filepath),
	});

	try {
		// 1. Check if persona already exists for this file
		const existing = registry.getDynamicPersonaForFile(filepath);
		if (existing) {
			telemetry('EPISTLE', 'STEP', 'Dynamic persona already exists', {
				name: existing.name,
			});

			vscode.window.showInformationMessage(
				`Persona '${existing.name}' already exists for this file.`
			);
			return;
		}

		// 2. Analyze file
		const analysis = DynamicPersonaGenerator.analyzeFile(filepath);

		telemetry('EPISTLE', 'STEP', 'File analyzed', {
			language: analysis.language,
			errorPatterns: analysis.errorPatterns.length,
			mainConcerns: analysis.mainConcerns.length,
		});

		// 3. Generate persona
		const { name, philosophy, concerns } = DynamicPersonaGenerator.generatePersonaFromAnalysis(analysis);

		telemetry('EPISTLE', 'STEP', 'Persona synthesized', {
			name,
			concerns: concerns.length,
		});

		// 4. Register in registry
		const id = registry.generateId('dynamic_persona', name);
		const entry = DynamicPersonaGenerator.generateRegistryEntry(id, name, filepath);
		registry.addEntry(entry);

		telemetry('EPISTLE', 'SUCCESS', 'Dynamic persona created', {
			id,
			name,
			file: path.basename(filepath),
		});

		vscode.window.showInformationMessage(
			`✓ Persona '${name}' created!\n\nPhilosophy: ${philosophy}\n\nKey concerns: ${concerns.join(', ')}`
		);
	} catch (error: any) {
		telemetry('EPISTLE', 'ERROR', 'Failed to create dynamic persona', {
			error: error.message,
		});
		vscode.window.showErrorMessage(`Failed to create persona: ${error.message}`);
	}
}
