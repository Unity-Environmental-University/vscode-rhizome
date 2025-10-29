/**
 * extension.ts — vscode-rhizome entry point
 *
 * @rhizome: What belongs in the entry point?
 * ONLY:
 * 1. activate() - register commands with services
 * 2. deactivate() - cleanup
 *
 * All business logic lives in services/ or commands/.
 * This file should be instantly readable.
 *
 * See services/ for persona queries, initialization, etc.
 * See commands/ for command handlers.
 * See ui/ for output formatting.
 */

import * as vscode from 'vscode';
import { generateStub, findStubComments, insertStub } from './stubGenerator';
import { registerVoiceControlCommand, VoiceTranscriptPayload, VoicePanelHandlerTools } from './voice/voiceControlPanel';
import { ensureLocalBinOnPath, getCandidateLocations, isRhizomeInstalled } from './utils/rhizomePath';
import { createEpistleRegistry, EpistleRegistry } from './epistleRegistry';
import { recordLetterEpistle, recordInlineEpistle, createDynamicPersona, recordFileAdvocateEpistle, addFileAdvocateComment } from './epistleCommands';
import { registerEpistleSidebar, EpistleSidebarProvider } from './epistleSidebarProvider';
import { activateMcpBridge } from './mcpBridge';
import { askPersonaCommand, documentWithPersonaCommand, disposeCommands } from './commands/personaCommands';
import { getAvailablePersonas } from './services/rhizomeService';
import { initializeRhizomeIfNeeded } from './services/initService';
import { performHealthCheck, detectLanguage } from './utils/helpers';
import { formatPersonaOutput, formatHealthCheck } from './ui/outputFormatter';

/**
 * Telemetry: structured logging for debugging
 */
function telemetry(component: string, phase: string, message: string, data?: Record<string, any>) {
	const isDebug = process.env.RHIZOME_DEBUG === 'true';
	const isError = phase === 'ERROR';
	const prefix = isError ? '❌' : '✓';
	const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
	const logLine = `[${component}] ${phase}: ${message}${dataStr}`;

	if (isError) {
		console.error(`${prefix} ${logLine}`);
	} else {
		console.log(`${logLine}`);
	}
}

/**
 * Activate extension on startup
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('[vscode-rhizome] ========== ACTIVATION START ==========');
	ensureLocalBinOnPath();

	const initialWorkspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (initialWorkspaceRoot) {
		activateMcpBridge(context, initialWorkspaceRoot).catch((error) => {
			console.error('[vscode-rhizome] Failed to start MCP bridge:', (error as Error).message);
		});
	}

	// Cleanup agentic terminal on deactivation
	context.subscriptions.push(
		new vscode.Disposable(() => {
			disposeCommands();
		})
	);

	// Log available personas on startup
	(async () => {
		console.log('[vscode-rhizome] Fetching available personas on startup...');
		try {
			const personas = await getAvailablePersonas();
			console.log('[vscode-rhizome] ========== AVAILABLE PERSONAS AT STARTUP ==========');
			console.log(`[vscode-rhizome] Total: ${personas.size} personas`);
			for (const [name, role] of personas) {
				console.log(`[vscode-rhizome]   - ${name}: ${role}`);
			}
			console.log('[vscode-rhizome] ========== END PERSONAS LIST ==========');
		} catch (error) {
			console.log('[vscode-rhizome] ERROR fetching personas on startup:', (error as Error).message);
		}
	})();

	// ======================================
	// COMMAND: health check for rhizome
	// ======================================
	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.healthCheck', async () => {
			const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
			if (!workspaceRoot) {
				vscode.window.showErrorMessage('No workspace folder open');
				return;
			}

			const outputChannel = vscode.window.createOutputChannel('vscode-rhizome: Health Check');
			outputChannel.show(true);

			const check = await performHealthCheck(workspaceRoot);
			formatHealthCheck(outputChannel, check.details, check.healthy);
		})
	);

	// ======================================
	// COMMAND: initialize rhizome in workspace
	// ======================================
	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.init', async () => {
			console.log('[vscode-rhizome.init] Command invoked');
			const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
			if (!workspaceRoot) {
				console.log('[vscode-rhizome.init] No workspace folder');
				vscode.window.showErrorMessage('No workspace folder open');
				return;
			}

			console.log('[vscode-rhizome.init] Initializing at:', workspaceRoot);
			const initialized = await initializeRhizomeIfNeeded(workspaceRoot);
			if (initialized) {
				console.log('[vscode-rhizome.init] Initialization successful');
				vscode.window.showInformationMessage('Rhizome is ready in this workspace');
			} else {
				console.log('[vscode-rhizome.init] Initialization failed');
			}
		})
	);

	// ======================================
	// COMMAND: Diagnose rhizome environment
	// ======================================
	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.diagnoseEnvironment', async () => {
			console.log('[diagnoseEnvironment] Starting rhizome environment diagnosis');

			const { execSync } = require('child_process');
			const outputChannel = vscode.window.createOutputChannel('vscode-rhizome: Environment Diagnosis');
			outputChannel.show(true);

			outputChannel.appendLine('='.repeat(70));
			outputChannel.appendLine('RHIZOME ENVIRONMENT DIAGNOSIS');
			outputChannel.appendLine('='.repeat(70));
			outputChannel.appendLine('');

			try {
				// 1. Find rhizome installation
				outputChannel.appendLine('1. RHIZOME INSTALLATION');
				const rhizomeWhich = execSync('which rhizome', { encoding: 'utf-8' }).trim();
				outputChannel.appendLine(`   Location: ${rhizomeWhich}`);

				// 2. Find Python being used
				outputChannel.appendLine('');
				outputChannel.appendLine('2. PYTHON ENVIRONMENT');
				const pythonPath = execSync('which python3', { encoding: 'utf-8' }).trim();
				const pythonVersion = execSync('python3 --version', { encoding: 'utf-8' }).trim();
				outputChannel.appendLine(`   Python: ${pythonPath}`);
				outputChannel.appendLine(`   Version: ${pythonVersion}`);

				// 3. Check for pyyaml
				outputChannel.appendLine('');
				outputChannel.appendLine('3. REQUIRED PYTHON MODULES');
				try {
					execSync('python3 -c "import yaml; print(yaml.__version__)"', { stdio: 'pipe', encoding: 'utf-8' });
					outputChannel.appendLine('   ✓ pyyaml: INSTALLED');
				} catch {
					outputChannel.appendLine('   ✗ pyyaml: MISSING');
				}

				// 4. Check sys.path
				outputChannel.appendLine('');
				outputChannel.appendLine('4. PYTHON MODULE SEARCH PATHS (sys.path)');
				const sysPath = execSync('python3 -c "import sys; print(\'\\n\'.join(sys.path))"', { encoding: 'utf-8' });
				sysPath.split('\n').filter((p: string) => p.trim()).forEach((p: string) => {
					outputChannel.appendLine(`   - ${p}`);
				});

				// 5. Show pip info
				outputChannel.appendLine('');
				outputChannel.appendLine('5. PIP INFORMATION');
				const pipVersion = execSync('python3 -m pip --version', { encoding: 'utf-8' }).trim();
				outputChannel.appendLine(`   ${pipVersion}`);

				// 6. List installed packages
				outputChannel.appendLine('');
				outputChannel.appendLine('6. INSTALLED PACKAGES (yaml-related)');
				try {
					const pipList = execSync('python3 -m pip list | grep -i yaml', { encoding: 'utf-8', stdio: 'pipe' });
					if (pipList.trim()) {
						outputChannel.appendLine(`   ${pipList}`);
					} else {
						outputChannel.appendLine('   (none found)');
					}
				} catch {
					outputChannel.appendLine('   (none found)');
				}

				// 7. Recommendations
				outputChannel.appendLine('');
				outputChannel.appendLine('='.repeat(70));
				outputChannel.appendLine('RECOMMENDATIONS');
				outputChannel.appendLine('='.repeat(70));
				outputChannel.appendLine('');
				outputChannel.appendLine('This is a RHIZOME INSTALLATION ISSUE, not an extension bug.');
				outputChannel.appendLine('For now, try:');
				outputChannel.appendLine('  python3 -m pip install pyyaml');
				outputChannel.appendLine('');
				outputChannel.appendLine('Then reload VSCode.');

			} catch (error) {
				outputChannel.appendLine(`ERROR: ${(error as Error).message}`);
			}

			vscode.window.showInformationMessage('Diagnosis complete. See output panel for details.');
		})
	);

	// ======================================
	// COMMAND: Install rhizome dependencies
	// ======================================
	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.installDeps', async () => {
			console.log('[vscode-rhizome.installDeps] Command invoked');

			const { execSync } = require('child_process');

			const option = await vscode.window.showQuickPick(
				[
					{
						label: 'python3 -m pip install pyyaml',
						description: '📦 Install pyyaml to the system Python (MOST COMMON FIX)',
					},
					{
						label: 'python3 -m pip install pyyaml && rhizome version',
						description: '✓ Install pyyaml AND verify rhizome works',
					},
					{
						label: 'cd /Users/hallie/Documents/repos/tools/rhizome && pip install -e .',
						description: '🔧 Install rhizome in development mode (installs all deps)',
					},
					{
						label: 'Show me the full terminal command to copy',
						description: '💻 I\'ll copy and run it myself',
					},
				],
				{
					placeHolder: 'Rhizome is missing pyyaml. Choose how to fix:',
					title: 'Rhizome Dependency Issue - No module named "yaml"'
				}
			);

			if (!option) {
				console.log('[vscode-rhizome.installDeps] User cancelled');
				return;
			}

			console.log('[vscode-rhizome.installDeps] User selected:', option.label);

			if (option.label.includes('Show me')) {
				vscode.window.showInformationMessage(
					'Copy and paste this into your terminal:\n\npython3 -m pip install pyyaml\n\nThen reload VSCode (Cmd+Shift+P → Reload Window)'
				);
				return;
			}

			const terminal = vscode.window.createTerminal('rhizome: Install Dependencies');
			terminal.show();
			terminal.sendText(option.label, true);

			vscode.window.showInformationMessage(
				'Running in terminal. When you see "Successfully installed", close the terminal and reload VSCode (Cmd+Shift+P → Reload Window).'
			);
		})
	);

	// ======================================
	// AUTOCOMPLETE: @rhizome ask <persona>
	// ======================================
	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			{ scheme: 'file' },
			{
				async provideCompletionItems(document, position) {
					const lineText = document.lineAt(position).text.substring(0, position.character);
					if (!lineText.includes('@rhizome ask')) {
						return [];
					}

					const personas = await getAvailablePersonas();
					const items: vscode.CompletionItem[] = [];

					for (const [name, role] of personas.entries()) {
						const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.User);
						item.detail = role;
						item.documentation = new vscode.MarkdownString(`**${name}**: ${role}`);
						item.insertText = name;
						items.push(item);
					}

					return items;
				}
			},
			' '
		)
	);

	// ======================================
	// COMMAND: ask any persona (dynamic picker)
	// ======================================
	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.askPersona', askPersonaCommand)
	);

	// ======================================
	// COMMAND: voice control preview webview
	// ======================================
	context.subscriptions.push(registerVoiceControlCommand(context));

	// ======================================
	// COMMAND: stub generation
	// ======================================
	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.stub', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}

			const document = editor.document;
			const code = document.getText();
			const language = detectLanguage(document.languageId);

			if (!language) {
				vscode.window.showErrorMessage(
					`Unsupported language: ${document.languageId}. Use TypeScript, JavaScript, or Python.`
				);
				return;
			}

			const stubs = findStubComments(code, language);

			if (stubs.length === 0) {
				vscode.window.showWarningMessage('No @rhizome stub comments found in this file');
				return;
			}

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

			const stub = generateStub(targetStub.functionName, targetStub.params, targetStub.returnType, language);
			const modifiedCode = insertStub(code, targetStub.line, stub, language);

			const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(code.length));
			const edit = new vscode.TextEdit(fullRange, modifiedCode);

			const workspaceEdit = new vscode.WorkspaceEdit();
			workspaceEdit.set(document.uri, [edit]);
			await vscode.workspace.applyEdit(workspaceEdit);

			vscode.window.showInformationMessage(`Stub created for ${targetStub.functionName}`);
		})
	);

	// ======================================
	// COMMAND: Document with persona
	// ======================================
	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.documentWithPersona', documentWithPersonaCommand)
	);

	// ===== Epistle Commands =====
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
	const epistleRegistry = createEpistleRegistry(workspaceRoot);
	const epistlesDir = require('path').join(workspaceRoot, '.rhizome', 'plugins', 'epistles');

	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.recordLetterEpistle', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('Please open a file and select code before recording an epistle');
				return;
			}
			if (editor.selection.isEmpty) {
				vscode.window.showErrorMessage('Please select some code before recording an epistle');
				return;
			}
			await recordLetterEpistle(editor, epistleRegistry, telemetry, epistlesDir, workspaceRoot);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.recordInlineEpistle', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('Please open a file and select code before recording an inline epistle');
				return;
			}
			if (editor.selection.isEmpty) {
				vscode.window.showErrorMessage('Please select some code before recording an inline epistle');
				return;
			}
			await recordInlineEpistle(editor, epistleRegistry, telemetry);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.createDynamicPersona', async (file?: vscode.Uri) => {
			let filepath: string;
			if (file) {
				filepath = file.fsPath;
			} else {
				const editor = vscode.window.activeTextEditor;
				if (!editor) {
					vscode.window.showErrorMessage('Please open a file to create a dynamic persona');
					return;
				}
				filepath = editor.document.fileName;
			}
			await createDynamicPersona(filepath, epistleRegistry, telemetry);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.recordFileAdvocateEpistle', async (file?: vscode.Uri) => {
			let filepath: string;
			if (file) {
				filepath = file.fsPath;
			} else {
				const editor = vscode.window.activeTextEditor;
				if (!editor) {
					vscode.window.showErrorMessage('Please open a file to create an advocate epistle');
					return;
				}
				filepath = editor.document.fileName;
			}
			await recordFileAdvocateEpistle(filepath, workspaceRoot, epistleRegistry, telemetry);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.addFileAdvocateComment', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('Please open a file to add an advocate comment');
				return;
			}
			await addFileAdvocateComment(editor, telemetry);
		})
	);

	// ===== Epistle Sidebar =====
	let sidebarProvider: EpistleSidebarProvider | undefined;
	try {
		sidebarProvider = registerEpistleSidebar(context, epistleRegistry, workspaceRoot);
		telemetry('EPISTLE_SIDEBAR', 'SUCCESS', 'Sidebar provider registered');
	} catch (error: any) {
		telemetry('EPISTLE_SIDEBAR', 'ERROR', 'Failed to register sidebar provider', {
			error: (error as Error).message,
		});
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.openEpistle', async (entry: any, workspaceRootPath: string) => {
			telemetry('EPISTLE_SIDEBAR', 'START', 'Open epistle from sidebar', {
				id: entry.id,
				type: entry.type,
			});

			try {
				switch (entry.type) {
					case 'letter': {
						const filepath = require('path').join(
							workspaceRootPath,
							'.rhizome',
							'plugins',
							'epistles',
							entry.file
						);
						const doc = await vscode.workspace.openTextDocument(filepath);
						await vscode.window.showTextDocument(doc);
						telemetry('EPISTLE_SIDEBAR', 'SUCCESS', 'Opened letter epistle', {
							id: entry.id,
							file: entry.file,
						});
						break;
					}

					case 'inline': {
						const doc = await vscode.workspace.openTextDocument(entry.inline_file);
						const editor = await vscode.window.showTextDocument(doc);

						const [startLine, endLine] = entry.lines.split('-').map((s: string) => parseInt(s, 10));
						const range = new vscode.Range(
							new vscode.Position(startLine - 1, 0),
							new vscode.Position(endLine - 1, 0)
						);

						editor.selection = new vscode.Selection(range.start, range.end);
						editor.revealRange(range, vscode.TextEditorRevealType.InCenter);

						telemetry('EPISTLE_SIDEBAR', 'SUCCESS', 'Opened inline epistle', {
							id: entry.id,
							file: entry.inline_file,
							lines: entry.lines,
						});
						break;
					}

					case 'dynamic_persona': {
						vscode.window.showInformationMessage(
							`Dynamic Persona: ${entry.name}\n\nSource: ${entry.source_file}\nCreated: ${entry.created_at}`
						);
						telemetry('EPISTLE_SIDEBAR', 'SUCCESS', 'Showed dynamic persona info', {
							id: entry.id,
							name: entry.name,
						});
						break;
					}
				}
			} catch (error: any) {
				telemetry('EPISTLE_SIDEBAR', 'ERROR', 'Failed to open epistle', {
					id: entry.id,
					type: entry.type,
					error: (error as Error).message,
				});
				vscode.window.showErrorMessage(`Failed to open epistle: ${(error as Error).message}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.refreshEpistleSidebar', async () => {
			telemetry('EPISTLE_SIDEBAR', 'START', 'Manual refresh triggered');

			try {
				if (sidebarProvider) {
					sidebarProvider.refresh();
					telemetry('EPISTLE_SIDEBAR', 'SUCCESS', 'Sidebar refreshed');
					vscode.window.showInformationMessage('Epistle registry refreshed');
				}
			} catch (error: any) {
				telemetry('EPISTLE_SIDEBAR', 'ERROR', 'Failed to refresh sidebar', {
					error: (error as Error).message,
				});
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.changeEpistleFilter', async () => {
			telemetry('EPISTLE_SIDEBAR', 'START', 'Filter mode change requested');

			const selected = await vscode.window.showQuickPick(
				[
					{ label: 'By Type', description: 'Letters, Inline epistles, Dynamic personas' },
					{ label: 'By Persona', description: 'dev-guide, code-reviewer, etc.' },
					{ label: 'By Date', description: 'Today, This week, Older' },
					{ label: 'By Flight Plan', description: 'Linked to active work' },
				],
				{
					placeHolder: 'How would you like to view epistles?',
					title: 'Epistle View Filter',
				}
			);

			if (!selected) {
				telemetry('EPISTLE_SIDEBAR', 'STEP', 'Filter mode change cancelled');
				return;
			}

			const modeMap: Record<string, 'type' | 'persona' | 'date' | 'flight-plan'> = {
				'By Type': 'type',
				'By Persona': 'persona',
				'By Date': 'date',
				'By Flight Plan': 'flight-plan',
			};

			const mode = modeMap[selected.label];
			if (sidebarProvider && mode) {
				sidebarProvider.setFilterMode(mode);
				telemetry('EPISTLE_SIDEBAR', 'SUCCESS', 'Filter mode changed', { mode });
				vscode.window.showInformationMessage(`Epistle view now filtered by ${selected.label.toLowerCase()}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-rhizome.showFlightPlanEpistles', async () => {
			const { getActiveFlightPlan, getEpistlesForFlightPlan, getEpistleCountsByType, formatFlightPlanInfo, formatEpistleSummary } = await import('./flightPlanIntegration');

			telemetry('FLIGHT_PLAN_EPISTLES', 'START', 'Show epistles for active flight plan');

			try {
				const activeFlightPlan = getActiveFlightPlan(workspaceRoot);

				if (!activeFlightPlan) {
					telemetry('FLIGHT_PLAN_EPISTLES', 'STEP', 'No active flight plan');
					vscode.window.showInformationMessage(
						'No active flight plan. Set an active flight plan via the rhizome CLI and try again.'
					);
					return;
				}

				const epistles = getEpistlesForFlightPlan(epistleRegistry, activeFlightPlan.id);
				const counts = getEpistleCountsByType(epistleRegistry, activeFlightPlan.id);

				telemetry('FLIGHT_PLAN_EPISTLES', 'SUCCESS', 'Loaded epistles for flight plan', {
					flightPlan: activeFlightPlan.id,
					count: epistles.length,
					counts,
				});

				if (epistles.length === 0) {
					vscode.window.showInformationMessage(
						`${formatFlightPlanInfo(activeFlightPlan)}\n\nNo epistles yet. Create one to start recording design decisions!`
					);
				} else {
					const summary = formatEpistleSummary(counts.letters, counts.inline, counts.personas);
					vscode.window.showInformationMessage(
						`${formatFlightPlanInfo(activeFlightPlan)}\n\n${summary}`
					);
				}

				if (sidebarProvider) {
					sidebarProvider.setFilterMode('flight-plan');
					vscode.commands.executeCommand('epistle-registry-sidebar.focus');
				}
			} catch (error: any) {
				telemetry('FLIGHT_PLAN_EPISTLES', 'ERROR', 'Failed to show flight plan epistles', {
					error: (error as Error).message,
				});
				vscode.window.showErrorMessage(`Failed to load epistles: ${(error as Error).message}`);
			}
		})
	);

	console.log('[vscode-rhizome] ========== ACTIVATION COMPLETE ==========');
	console.log('[vscode-rhizome] Commands registered and ready to use');
	console.log('[vscode-rhizome] ========== ACTIVATION END ==========');
}

export function deactivate() {
	disposeCommands();
}
