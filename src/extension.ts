
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
 * Helper: Get list of available personas from rhizome
 *
 * Queries rhizome for available personas (both system and custom).
 * Returns a map of persona name to description for quick picker.
 */
async function getAvailablePersonas(): Promise<Map<string, string>> {
	try {
		const { execSync } = require('child_process');
		const output = execSync('rhizome persona list', {
			encoding: 'utf-8',
			timeout: 5000,
			stdio: 'pipe',
		});

		const personas = new Map<string, string>();

		// Parse rhizome persona list output
		// Format: "persona_name | role: description | source: ..."
		const lines = output.split('\n');
		for (const line of lines) {
			const match = line.match(/^(\S+)\s+\|\s+role:\s+(.+?)\s+\|\s+source:/);
			if (match) {
				const name = match[1].trim();
				const role = match[2].trim();
				personas.set(name, role);
			}
		}

		return personas;
	} catch {
		// If rhizome persona list fails, return curated set of main personas
		return new Map([
			['don-socratic', 'Socratic questioning'],
			['dev-guide', 'Mentor: What were you trying to accomplish?'],
			['code-reviewer', 'Skeptic: What\'s your evidence?'],
			['ux-advocate', 'Curator: Have we watched someone use this?'],
			['dev-advocate', 'Strategist: What trade-off are we making?'],
		]);
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
 * Helper: Check if rhizome CLI is available
 */
function isRhizomeInstalled(): boolean {
	try {
		const { execSync } = require('child_process');
		execSync('rhizome --version', {
			encoding: 'utf-8',
			timeout: 2000,
			stdio: 'pipe',
		});
		return true;
	} catch {
		return false;
	}
}

/**
 * Helper: Check if user is member of Unity-Environmental-University
 *
 * don-socratic asks:
 * How do you know who a user is? What signals indicate org membership?
 * GitHub auth + git config are stronger signals than assumptions.
 *
 * Checks:
 * 1. `gh auth status` to confirm logged in
 * 2. `git config user.organization` for explicit org setting
 * 3. Falls back to checking GitHub orgs if gh CLI available
 */
async function isUEUMember(): Promise<boolean> {
	const { execSync } = require('child_process');

	try {
		// First, check if user is authenticated with GitHub CLI
		try {
			execSync('gh auth status', {
				encoding: 'utf-8',
				timeout: 2000,
				stdio: 'pipe',
			});
		} catch {
			// Not authenticated with gh, can't verify org membership
			return false;
		}

		// Check git config for explicit org setting
		try {
			const org = execSync('git config user.organization', {
				encoding: 'utf-8',
				timeout: 2000,
				stdio: 'pipe',
			})
				.trim();
			if (org === 'Unity-Environmental-University') {
				return true;
			}
		} catch {
			// Config value not set, continue to check GitHub orgs
		}

		// Check GitHub orgs via gh CLI
		try {
			const orgs = execSync('gh org list', {
				encoding: 'utf-8',
				timeout: 5000,
			})
				.split('\n')
				.map((line: string) => line.trim())
				.filter((line: string) => line.length > 0);

			return orgs.includes('Unity-Environmental-University');
		} catch {
			// gh org list failed or not available
			return false;
		}
	} catch {
		return false;
	}
}

/**
 * Helper: Run diagnostics when rhizome not found
 *
 * don-socratic asks:
 * When a tool is missing, what should you check?
 * - Is it in PATH?
 * - Did the installation fail silently?
 * - Is it on the disk but not in PATH?
 *
 * Gather evidence before offering help.
 */
async function diagnosticRhizomeMissing(): Promise<string[]> {
	const { execSync } = require('child_process');
	const diagnostics: string[] = [];

	// Check common installation paths
	const commonPaths = [
		'/usr/local/bin/rhizome',
		'/usr/bin/rhizome',
		`${process.env.HOME}/.local/bin/rhizome`,
		`${process.env.HOME}/.rhizome/bin/rhizome`,
	];

	for (const path of commonPaths) {
		try {
			execSync(`test -f ${path}`, { stdio: 'pipe' });
			diagnostics.push(`Found rhizome at: ${path}`);
		} catch {
			// Not found, continue
		}
	}

	// Check PATH environment variable
	diagnostics.push(`Current PATH: ${process.env.PATH}`);

	// Check if installation tools are available
	try {
		execSync('which npm', { stdio: 'pipe', timeout: 2000 });
		diagnostics.push('npm is available');
	} catch {
		diagnostics.push('npm NOT found (required for rhizome installation)');
	}

	try {
		execSync('which brew', { stdio: 'pipe', timeout: 2000 });
		diagnostics.push('brew is available (macOS)');
	} catch {
		// brew not required on all systems
	}

	return diagnostics;
}

/**
 * Helper: Offer to collect and store OpenAI key
 *
 * don-socratic asks:
 * Where should secrets live? In code? In env? In config files?
 * How do you keep them secure while making them accessible?
 * What happens the first time a tool needs a secret?
 */
async function ensureOpenAIKeyConfigured(workspaceRoot: string): Promise<boolean> {
	const configPath = vscode.Uri.joinPath(vscode.Uri.file(workspaceRoot), '.rhizome', 'config.json');

	try {
		// Check if key is already configured (env var or config file)
		if (process.env.OPENAI_API_KEY) {
			return true;
		}

		const configExists = await vscode.workspace.fs.stat(configPath);
		if (configExists) {
			const configContent = await vscode.workspace.fs.readFile(configPath);
			const config = JSON.parse(new TextDecoder().decode(configContent));
			if (config.ai?.openai_key) {
				// Load key from config into env for this session
				process.env.OPENAI_API_KEY = config.ai.openai_key;
				return true;
			}
		}
	} catch {
		// Config file doesn't exist or can't be read, that's fine
	}

	// No key found, ask user
	const key = await vscode.window.showInputBox({
		prompt: 'Enter your OpenAI API key (stored locally in .rhizome/config.json)',
		password: true,
		ignoreFocusOut: true,
	});

	if (!key) {
		vscode.window.showWarningMessage('OpenAI API key is required for don-socratic');
		return false;
	}

	// Save key to local config
	try {
		const rhizomePath = vscode.Uri.joinPath(vscode.Uri.file(workspaceRoot), '.rhizome');
		const configPath = vscode.Uri.joinPath(rhizomePath, 'config.json');

		let config: any = {};
		try {
			const existing = await vscode.workspace.fs.readFile(configPath);
			config = JSON.parse(new TextDecoder().decode(existing));
		} catch {
			// File doesn't exist, start fresh
		}

		// Ensure nested structure exists
		if (!config.ai) config.ai = {};
		config.ai.openai_key = key;

		// Write config
		const configContent = new TextEncoder().encode(JSON.stringify(config, null, 2));
		await vscode.workspace.fs.writeFile(configPath, configContent);

		// Set env var for this session
		process.env.OPENAI_API_KEY = key;

		// Add .rhizome/config.json to .gitignore
		await addToGitignore(workspaceRoot, '.rhizome/config.json');

		vscode.window.showInformationMessage('OpenAI API key configured and stored securely');
		return true;
	} catch (error: any) {
		vscode.window.showErrorMessage(`Failed to save API key: ${(error as Error).message}`);
		return false;
	}
}

/**
 * Helper: Add entry to .gitignore if not already there
 */
async function addToGitignore(workspaceRoot: string, entry: string): Promise<void> {
	const gitignorePath = vscode.Uri.joinPath(vscode.Uri.file(workspaceRoot), '.gitignore');

	let content = '';
	try {
		const existing = await vscode.workspace.fs.readFile(gitignorePath);
		content = new TextDecoder().decode(existing);
	} catch {
		// .gitignore doesn't exist, we'll create it
	}

	if (!content.includes(entry)) {
		content += (content.endsWith('\n') ? '' : '\n') + entry + '\n';
		const encoded = new TextEncoder().encode(content);
		await vscode.workspace.fs.writeFile(gitignorePath, encoded);
	}
}

/**
 * Helper: Initialize rhizome context in workspace root
 *
 * don-socratic asks:
 * What does it mean for a tool to be "initialized"?
 * What state needs to exist before it can work?
 * How should the tool handle missing initialization?
 *
 * If .rhizome doesn't exist in workspace root, run `rhizome init`
 * to set up the local context directory.
 */
async function initializeRhizomeIfNeeded(workspaceRoot: string): Promise<boolean> {
	// Check if rhizome is installed
	if (!isRhizomeInstalled()) {
		// Run initial diagnostics to understand why
		const diagnosticsBefore = await diagnosticRhizomeMissing();
		const isMember = await isUEUMember();

		if (isMember) {
			// User is UEU member, offer to install with diagnostics
			vscode.window.showInformationMessage('Diagnostics before installation:\n' + diagnosticsBefore.join('\n'));

			const response = await vscode.window.showErrorMessage(
				'rhizome CLI not found. You are a member of Unity-Environmental-University. Install rhizome now?',
				'Install rhizome',
				'View Guide'
			);

			if (response === 'Install rhizome') {
				try {
					vscode.window.showInformationMessage('Installing rhizome...');
					const { execSync } = require('child_process');

					// Try npm install globally
					execSync('npm install -g @rhizome/cli', {
						encoding: 'utf-8',
						timeout: 60000,
						stdio: 'inherit',
					});

					vscode.window.showInformationMessage('rhizome installed successfully!');

					// Run diagnostics after installation
					const diagnosticsAfter = await diagnosticRhizomeMissing();
					vscode.window.showInformationMessage(
						'Diagnostics after installation:\n' + diagnosticsAfter.join('\n')
					);

					// Verify installation
					if (!isRhizomeInstalled()) {
						vscode.window.showWarningMessage(
							'Installation completed but rhizome still not found in PATH. You may need to restart VSCode.'
						);
						return false;
					}

					// Continue with workspace initialization
					return await initializeRhizomeIfNeeded(workspaceRoot);
				} catch (error: any) {
					vscode.window.showErrorMessage(`Failed to install rhizome: ${(error as Error).message}`);
					const diagnosticsFailure = await diagnosticRhizomeMissing();
					vscode.window.showInformationMessage(
						'Diagnostics after failed installation:\n' + diagnosticsFailure.join('\n')
					);
					return false;
				}
			} else if (response === 'View Guide') {
				vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-rhizome-repo#installation'));
			}
			return false;
		} else {
			// Not a UEU member, direct them to install themselves
			const response = await vscode.window.showWarningMessage(
				'rhizome CLI not found. Please install it to use vscode-rhizome.',
				'View Installation Guide'
			);
			if (response === 'View Installation Guide') {
				vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-rhizome-repo#installation'));
			}
			return false;
		}
	}

	const rhizomePath = vscode.Uri.joinPath(vscode.Uri.file(workspaceRoot), '.rhizome');
	try {
		await vscode.workspace.fs.stat(rhizomePath);
		// .rhizome exists, check for key config
		const keyConfigured = await ensureOpenAIKeyConfigured(workspaceRoot);
		return keyConfigured;
	} catch {
		// .rhizome doesn't exist, try to initialize
		try {
			vscode.window.showInformationMessage('Initializing rhizome in workspace...');
			const { execSync } = require('child_process');
			execSync('rhizome init', {
				cwd: workspaceRoot,
				encoding: 'utf-8',
				timeout: 10000,
			});
			vscode.window.showInformationMessage('Rhizome initialized in workspace');

			// Now ask for key
			const keyConfigured = await ensureOpenAIKeyConfigured(workspaceRoot);
			return keyConfigured;
		} catch (error: any) {
			vscode.window.showErrorMessage(`Failed to initialize rhizome: ${(error as Error).message}`);
			return false;
		}
	}
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

	// Ensure rhizome is initialized before querying
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (!workspaceRoot) {
		vscode.window.showErrorMessage('No workspace folder open');
		return;
	}

	const initialized = await initializeRhizomeIfNeeded(workspaceRoot);
	if (!initialized) {
		vscode.window.showErrorMessage('Could not initialize rhizome. Check workspace permissions.');
		return;
	}

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
	// COMMAND: initialize rhizome in workspace
	// ======================================
	let initDisposable = vscode.commands.registerCommand('vscode-rhizome.init', async () => {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (!workspaceRoot) {
			vscode.window.showErrorMessage('No workspace folder open');
			return;
		}

		const initialized = await initializeRhizomeIfNeeded(workspaceRoot);
		if (initialized) {
			vscode.window.showInformationMessage('Rhizome is ready in this workspace');
		}
	});

	context.subscriptions.push(initDisposable);

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
	// COMMAND: ask any persona (dynamic picker)
	// ======================================
	let askPersonaDisposable = vscode.commands.registerCommand('vscode-rhizome.askPersona', async () => {
		const selection = getActiveSelection();
		if (!selection) return;

		// Get available personas
		const personas = await getAvailablePersonas();
		const personaOptions = Array.from(personas.entries()).map(([name, role]) => ({
			label: name,
			description: role,
		}));

		// Show quick picker
		const picked = await vscode.window.showQuickPick(personaOptions, {
			placeHolder: 'Choose a persona to question your code',
			matchOnDescription: true,
		});

		if (!picked) return;

		await askPersonaAboutSelection(picked.label, picked.label);
	});

	context.subscriptions.push(askPersonaDisposable);

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

