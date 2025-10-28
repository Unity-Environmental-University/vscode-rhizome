
import * as vscode from 'vscode';
import { generateStub, findStubComments, insertStub } from './stubGenerator';
import { registerVoiceControlCommand, VoiceTranscriptPayload, VoicePanelHandlerTools } from './voice/voiceControlPanel';
import { ensureLocalBinOnPath, getCandidateLocations, isRhizomeInstalled } from './utils/rhizomePath';

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
	timeoutMs: number = 30000,
	workspaceRoot?: string
): Promise<string> {
	const { execSync } = require('child_process');
	const cwd = workspaceRoot || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

	console.log(`[queryPersona] ========== QUERY START ==========`);
	console.log(`[queryPersona] Persona: ${persona}`);
	console.log(`[queryPersona] Timeout: ${timeoutMs}ms`);
	console.log(`[queryPersona] Workspace: ${cwd}`);
	console.log(`[queryPersona] Input length: ${text.length} chars`);

	// Check for API key BEFORE attempting query
	console.log(`[queryPersona] Checking API key availability...`);
	const hasApiKey = await checkApiKeyAvailable(cwd);
	if (!hasApiKey) {
		console.log(`[queryPersona] WARNING: No API key found. Query may fail or hang if persona requires API.`);
	}

	try {
		console.log(`[queryPersona] Executing: rhizome query --persona ${persona}`);
		console.log(`[queryPersona] CWD: ${cwd}`);

		// Wrap execSync in a promise with explicit timeout to handle hanging better
		const queryPromise = new Promise<string>((resolve, reject) => {
			try {
				const response = execSync(`rhizome query --persona ${persona}`, {
					input: text,
					encoding: 'utf-8',
					timeout: timeoutMs,
					cwd: cwd, // Ensure rhizome runs in workspace to find .rhizome folder
					stdio: ['pipe', 'pipe', 'pipe'], // Capture both stdout and stderr
					maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large responses
				});
				console.log(`[queryPersona] SUCCESS: Got response from ${persona}`);
				console.log(`[queryPersona] Response length: ${response.length} chars`);
				console.log(`[queryPersona] Response preview: ${response.substring(0, 200)}...`);
				resolve(response);
			} catch (error: any) {
				const errorMsg = (error as Error).message;
				const stderrMsg = error.stderr?.toString() || '';
				const stdoutMsg = error.stdout?.toString() || '';

				console.log(`[queryPersona] ERROR in execSync:`, errorMsg);
				if (stderrMsg) {
					console.log(`[queryPersona] stderr:`, stderrMsg);
				}
				if (stdoutMsg) {
					console.log(`[queryPersona] stdout:`, stdoutMsg);
				}

				// Detect rhizome dependency issues
				if (stderrMsg.includes('No module named') || stderrMsg.includes('ModuleNotFoundError')) {
					console.log(`[queryPersona] ❌ RHIZOME DEPENDENCY ISSUE`);
					console.log(`[queryPersona] Rhizome is missing Python dependencies`);
					console.log(`[queryPersona] This is a rhizome installation issue, not an extension bug`);
					console.log(`[queryPersona] Try: pip install pyyaml (or reinstall rhizome)`);
				}

				reject(error);
			}
		});

		// Set a JS-level timeout as backup (execSync timeout might not work reliably)
		const timeoutPromise = new Promise<string>((_, reject) => {
			setTimeout(() => {
				console.log(`[queryPersona] TIMEOUT: Query to ${persona} exceeded ${timeoutMs}ms`);
				reject(new Error(`Query to ${persona} timed out after ${timeoutMs}ms. Persona may be slow or API key may be missing/invalid.`));
			}, timeoutMs + 1000); // Give execSync a chance to timeout first
		});

		const result = await Promise.race([queryPromise, timeoutPromise]);
		console.log(`[queryPersona] ========== QUERY END (SUCCESS) ==========`);
		return result;
	} catch (error: any) {
		console.log(`[queryPersona] ========== QUERY END (ERROR) ==========`);
		// Extract actual error details from the exception
		let errorDetail = (error as Error).message;
		if (error.stderr) {
			errorDetail = error.stderr.toString();
		} else if (error.stdout) {
			errorDetail = error.stdout.toString();
		}
		console.log(`[queryPersona] Final error detail: ${errorDetail}`);
		throw new Error(`Rhizome query failed:\n${errorDetail}`);
	}
}

/**
 * Helper: Check if API key is configured
 *
 * Checks environment variables and rhizome config for API key.
 * Returns true if any API key is found (OpenAI, Anthropic, etc.)
 */
async function checkApiKeyAvailable(workspaceRoot?: string): Promise<boolean> {
	const { execSync } = require('child_process');
	const fs = require('fs');
	const path = require('path');

	const cwd = workspaceRoot || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	console.log(`[checkApiKeyAvailable] Checking API key in workspace: ${cwd}`);

	// Check 1: Environment variables
	const envKeys = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'RHIZOME_API_KEY'];
	for (const key of envKeys) {
		if (process.env[key]) {
			console.log(`[checkApiKeyAvailable] Found ${key} in environment`);
			return true;
		}
	}
	console.log(`[checkApiKeyAvailable] No API keys in environment variables`);

	// Check 2: Rhizome config file
	try {
		const configPath = path.join(cwd, '.rhizome', 'config.json');
		console.log(`[checkApiKeyAvailable] Checking config at: ${configPath}`);

		if (fs.existsSync(configPath)) {
			const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
			console.log(`[checkApiKeyAvailable] Config exists. Checking for API keys...`);
			console.log(`[checkApiKeyAvailable] Config structure:`, JSON.stringify(config, null, 2).substring(0, 500));

			// Check various possible keys
			if (config.ai?.openai_key) {
				console.log(`[checkApiKeyAvailable] Found ai.openai_key in config`);
				return true;
			}
			if (config.ai?.key) {
				console.log(`[checkApiKeyAvailable] Found ai.key in config`);
				return true;
			}
			if (config.openai_api_key) {
				console.log(`[checkApiKeyAvailable] Found openai_api_key in config`);
				return true;
			}
			console.log(`[checkApiKeyAvailable] Config found but no API key field detected`);
		} else {
			console.log(`[checkApiKeyAvailable] No config file found at ${configPath}`);
		}
	} catch (error) {
		console.log(`[checkApiKeyAvailable] Error reading config:`, (error as Error).message);
	}

	// Check 3: Try rhizome config command
	try {
		console.log(`[checkApiKeyAvailable] Attempting to read rhizome config via CLI...`);
		const configOutput = execSync('rhizome config get ai', {
			encoding: 'utf-8',
			cwd: cwd,
			stdio: ['pipe', 'pipe', 'pipe'],
			timeout: 5000,
		});
		console.log(`[checkApiKeyAvailable] rhizome config output:`, configOutput.substring(0, 200));
		if (configOutput && configOutput.includes('key')) {
			console.log(`[checkApiKeyAvailable] Found key reference in rhizome config`);
			return true;
		}
	} catch (error) {
		console.log(`[checkApiKeyAvailable] Could not read rhizome config:`, (error as Error).message);
	}

	console.log(`[checkApiKeyAvailable] RESULT: No API key found`);
	return false;
}

/**
 * Helper: Get list of available personas from rhizome
 *
 * Queries rhizome for available personas (both system and custom).
 * Returns a map of persona name to description for quick picker.
 */
async function getAvailablePersonas(): Promise<Map<string, string>> {
	console.log(`[getAvailablePersonas] ========== FETCH PERSONAS START ==========`);
	const { execSync } = require('child_process');
	const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

	console.log(`[getAvailablePersonas] Workspace: ${cwd}`);
	console.log(`[getAvailablePersonas] Executing: rhizome persona list`);

	try {
		const output = execSync('rhizome persona list', {
			encoding: 'utf-8',
			timeout: 5000,
			stdio: 'pipe',
			cwd: cwd, // Run in workspace context
		});

		console.log(`[getAvailablePersonas] Raw output length: ${output.length} chars`);
		console.log(`[getAvailablePersonas] Raw output:\n${output}`);

		const personas = new Map<string, string>();

		// Parse rhizome persona list output
		// Format: "persona_name | role: description | source: ..."
		const lines = output.split('\n');
		console.log(`[getAvailablePersonas] Total lines in output: ${lines.length}`);

		let parsedCount = 0;
		for (const line of lines) {
			if (!line.trim()) continue;
			const match = line.match(/^(\S+)\s+\|\s+role:\s+(.+?)\s+\|\s+source:/);
			if (match) {
				const name = match[1].trim();
				const role = match[2].trim();
				personas.set(name, role);
				console.log(`[getAvailablePersonas] Parsed: ${name} => ${role.substring(0, 50)}`);
				parsedCount++;
			} else {
				console.log(`[getAvailablePersonas] Could not parse line: ${line.substring(0, 100)}`);
			}
		}

		console.log(`[getAvailablePersonas] ========== FETCH PERSONAS END (SUCCESS) ==========`);
		console.log(`[getAvailablePersonas] Total personas found: ${personas.size}`);
		console.log(`[getAvailablePersonas] Personas list:`, Array.from(personas.keys()).join(', '));

		return personas;
	} catch (error: any) {
		const errorMsg = (error as Error).message;
		const stderrMsg = error.stderr?.toString() || '';
		console.log(`[getAvailablePersonas] ERROR fetching personas:`, errorMsg);
		if (stderrMsg) {
			console.log(`[getAvailablePersonas] stderr:`, stderrMsg);
		}

		// Check for common rhizome dependency issues
		if (stderrMsg.includes('No module named')) {
			console.log(`[getAvailablePersonas] ❌ RHIZOME DEPENDENCY ISSUE DETECTED`);
			console.log(`[getAvailablePersonas] Rhizome is missing a Python module`);
			console.log(`[getAvailablePersonas] Try: pip install pyyaml`);
		}
		if (stderrMsg.includes('ModuleNotFoundError')) {
			console.log(`[getAvailablePersonas] ❌ PYTHON MODULE NOT FOUND`);
			console.log(`[getAvailablePersonas] This is a rhizome environment issue, not an extension issue`);
		}

		console.log(`[getAvailablePersonas] Falling back to hardcoded personas`);

		// If rhizome persona list fails, return curated set of main personas
		const fallback = new Map([
			['don-socratic', 'Socratic questioning'],
			['dev-guide', 'Mentor: What were you trying to accomplish?'],
			['code-reviewer', 'Skeptic: What\'s your evidence?'],
			['ux-advocate', 'Curator: Have we watched someone use this?'],
			['dev-advocate', 'Strategist: What trade-off are we making?'],
		]);

		console.log(`[getAvailablePersonas] ========== FETCH PERSONAS END (FALLBACK) ==========`);
		console.log(`[getAvailablePersonas] Fallback personas: ${Array.from(fallback.keys()).join(', ')}`);

		return fallback;
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
	const fs = require('fs');
	const diagnostics: string[] = [];

	// Check installation paths that we probe proactively (see getCandidateLocations)
	for (const candidate of getCandidateLocations()) {
		if (fs.existsSync(candidate)) {
			diagnostics.push(`Found rhizome at: ${candidate}`);
		} else {
			diagnostics.push(`Checked path (missing): ${candidate}`);
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
		// NOTE: --force flag auto-resolves conflicts from epistles plugin context sync
		try {
			vscode.window.showInformationMessage('Initializing rhizome in workspace...');
			const { execSync } = require('child_process');
			execSync('rhizome init --force', {
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
		const response = await queryPersona(selectedText, persona, 30000, workspaceRoot);
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
 * Helper: Health check for rhizome integration
 *
 * Verifies:
 * 1. rhizome CLI is installed and in PATH
 * 2. Workspace has .rhizome directory
 * 3. At least one persona is available
 * 4. A simple query works
 */
async function performHealthCheck(workspaceRoot: string): Promise<{ healthy: boolean; details: string[] }> {
	const details: string[] = [];
	const { execSync } = require('child_process');
	const fs = require('fs');

	try {
		// Check 1: rhizome installed
		try {
			const version = execSync('rhizome --version', {
				encoding: 'utf-8',
				timeout: 5000,
				stdio: 'pipe',
			}).trim();
			details.push(`✓ rhizome installed: ${version}`);
		} catch {
			details.push(`✗ rhizome not found in PATH`);
			return { healthy: false, details };
		}

		// Check 2: workspace has .rhizome
		const rhizomeDir = `${workspaceRoot}/.rhizome`;
		if (fs.existsSync(rhizomeDir)) {
			details.push(`✓ .rhizome directory exists at ${rhizomeDir}`);
		} else {
			details.push(`⚠ .rhizome directory not found. Run: vscode-rhizome.init`);
		}

		// Check 3: personas available
		try {
			const personaOutput = execSync('rhizome persona list', {
				encoding: 'utf-8',
				timeout: 5000,
				stdio: 'pipe',
				cwd: workspaceRoot,
			});
			const personaCount = personaOutput.split('\n').filter((line: string) => line.includes('|')).length;
			details.push(`✓ ${personaCount} personas available`);
		} catch {
			details.push(`✗ Could not list personas`);
			return { healthy: false, details };
		}

		// Check 4: test a simple query
		try {
			execSync('rhizome query --persona don-socratic', {
				input: 'hello',
				encoding: 'utf-8',
				timeout: 10000,
				stdio: ['pipe', 'pipe', 'pipe'],
				cwd: workspaceRoot,
			});
			details.push(`✓ test query succeeded`);
		} catch (error: any) {
			const errorMsg = error.stderr?.toString() || error.message;
			details.push(`✗ test query failed: ${errorMsg.split('\n')[0]}`);
			return { healthy: false, details };
		}

		return { healthy: true, details };
	} catch (error: any) {
		details.push(`✗ Health check error: ${(error as Error).message}`);
		return { healthy: false, details };
	}
}

/**
 * Activate extension on startup
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('[vscode-rhizome] ========== ACTIVATION START ==========');
	console.log('[vscode-rhizome] Activation starting');
	ensureLocalBinOnPath();
	console.log('[vscode-rhizome] Local bin path ensured');

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
	let healthCheckDisposable = vscode.commands.registerCommand('vscode-rhizome.healthCheck', async () => {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (!workspaceRoot) {
			vscode.window.showErrorMessage('No workspace folder open');
			return;
		}

		const outputChannel = vscode.window.createOutputChannel('vscode-rhizome: Health Check');
		outputChannel.show(true);

		outputChannel.appendLine('='.repeat(60));
		outputChannel.appendLine('vscode-rhizome Health Check');
		outputChannel.appendLine('='.repeat(60));
		outputChannel.appendLine('');

		const check = await performHealthCheck(workspaceRoot);
		for (const detail of check.details) {
			outputChannel.appendLine(detail);
		}

		outputChannel.appendLine('');
		if (check.healthy) {
			outputChannel.appendLine('✓ All checks passed. Extension is ready to use.');
		} else {
			outputChannel.appendLine('✗ Some checks failed. See above for details.');
		}
	});

	context.subscriptions.push(healthCheckDisposable);

	// ======================================
	// COMMAND: initialize rhizome in workspace
	// ======================================
	let initDisposable = vscode.commands.registerCommand('vscode-rhizome.init', async () => {
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
	});

	context.subscriptions.push(initDisposable);

	// ======================================
	// AUTOCOMPLETE: @rhizome ask <persona>
	// ======================================
	// Register a completion provider for @rhizome ask
	const completionProvider = vscode.languages.registerCompletionItemProvider(
		{ scheme: 'file' }, // Apply to all files
		{
			async provideCompletionItems(document, position) {
				console.log('[autocomplete] Triggered at line', position.line);
				// Get the line text up to the cursor
				const lineText = document.lineAt(position).text.substring(0, position.character);
				console.log('[autocomplete] Line text:', lineText);

				// Check if we're in a @rhizome ask context
				if (!lineText.includes('@rhizome ask')) {
					console.log('[autocomplete] Not in @rhizome ask context');
					return [];
				}

				console.log('[autocomplete] Found @rhizome ask context');
				// Get available personas
				const personas = await getAvailablePersonas();
				console.log('[autocomplete] Personas available:', Array.from(personas.keys()));
				const items: vscode.CompletionItem[] = [];

				for (const [name, role] of personas.entries()) {
					const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.User);
					item.detail = role;
					item.documentation = new vscode.MarkdownString(`**${name}**: ${role}`);
					item.insertText = name;
					items.push(item);
				}

				console.log('[autocomplete] Returning', items.length, 'completion items');
				return items;
			}
		},
		' ' // Trigger on space (after "@rhizome ask ")
	);

	context.subscriptions.push(completionProvider);

	// ======================================
	// COMMAND: ask any persona (dynamic picker)
	// ======================================
	let askPersonaDisposable = vscode.commands.registerCommand('vscode-rhizome.askPersona', async () => {
		console.log('[askPersona] Command invoked');
		const selection = getActiveSelection();
		if (!selection) {
			console.log('[askPersona] No selection found');
			return;
		}

		console.log('[askPersona] Got selection, fetching personas');
		// Get available personas
		const personas = await getAvailablePersonas();
		console.log('[askPersona] Available personas:', Array.from(personas.keys()));
		const personaOptions = Array.from(personas.entries()).map(([name, role]) => ({
			label: name,
			description: role,
		}));

		// Show quick picker
		console.log('[askPersona] Showing quick picker');
		const picked = await vscode.window.showQuickPick(personaOptions, {
			placeHolder: 'Choose a persona to question your code',
			matchOnDescription: true,
		});
		console.log('[askPersona] User picked:', picked?.label);

		if (!picked) return;

		await askPersonaAboutSelection(picked.label, picked.label);
	});

	context.subscriptions.push(askPersonaDisposable);

	// ======================================
	// COMMAND: voice control preview webview
	// ======================================
	const voiceControlDisposable = registerVoiceControlCommand(context);
	context.subscriptions.push(voiceControlDisposable);

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

	/**
	 * Command: documentWithPersona
	 *
	 * don-socratic asks:
	 * When we ask a persona to document code, what should the output look like?
	 * Should it be a block comment before the selection? After? Inline?
	 * Who decides the placement—the persona or the user?
	 *
	 * ANSWER:
	 * We insert persona's response as a comment block ABOVE the selection.
	 * This follows the pattern of JSDoc/docstring conventions.
	 * The persona suggests documentation; the user integrates it.
	 */
	let documentWithPersonaDisposable = vscode.commands.registerCommand(
		'vscode-rhizome.documentWithPersona',
		async () => {
			console.log('[documentWithPersona] Command invoked');
			const selection = getActiveSelection();
			if (!selection) {
				console.log('[documentWithPersona] No selection found');
				return;
			}

			const { editor, selectedText } = selection;
			const document = editor.document;
			console.log('[documentWithPersona] Selected text:', selectedText.substring(0, 50) + '...');

			// Get available personas
			const personasMap = await getAvailablePersonas();
			console.log('[documentWithPersona] Available personas:', Array.from(personasMap.keys()));
			if (personasMap.size === 0) {
				console.log('[documentWithPersona] No personas available');
				vscode.window.showErrorMessage('No personas available. Check rhizome installation.');
				return;
			}

			// Show quick pick to choose persona
			const personaOptions = Array.from(personasMap.entries()).map(([name, role]) => ({
				label: name,
				description: role || `Ask ${name} to document this`,
			}));
			const picked = await vscode.window.showQuickPick(personaOptions, {
				placeHolder: 'Which persona should document this code?',
			});

			if (!picked) {
				console.log('[documentWithPersona] User cancelled persona selection');
				return;
			}
			console.log('[documentWithPersona] Selected persona:', picked.label);

			// Ensure rhizome is initialized
			const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
			if (!workspaceRoot) {
				console.log('[documentWithPersona] No workspace folder');
				vscode.window.showErrorMessage('No workspace folder open');
				return;
			}

			const initialized = await initializeRhizomeIfNeeded(workspaceRoot);
			if (!initialized) {
				console.log('[documentWithPersona] Rhizome initialization failed');
				vscode.window.showErrorMessage('Could not initialize rhizome.');
				return;
			}

			// Build prompt: ask persona to document the code
			const prompt = `Please provide clear documentation/comments for this code:\n\n${selectedText}`;
			console.log('[documentWithPersona] Querying persona with prompt length:', prompt.length);

			try {
				const response = await queryPersona(prompt, picked.label, 30000, workspaceRoot);
				console.log('[documentWithPersona] Got response from persona:', response.substring(0, 100) + '...');

				// Detect language and format comment
				const language = detectLanguage(document.languageId);
				const commentPrefix = language === 'python' ? '#' : '//';
				console.log('[documentWithPersona] Language:', document.languageId, 'Prefix:', commentPrefix);

				const commentLines = response.split('\n').map((line) => `${commentPrefix} ${line}`);
				const comment = commentLines.join('\n');
				console.log('[documentWithPersona] Formatted comment:', comment.substring(0, 100) + '...');

				// Get insertion position (above selection)
				const insertPos = editor.selection.start;
				console.log('[documentWithPersona] Insert position:', insertPos);

				// Insert comment
				const edit = new vscode.TextEdit(
					new vscode.Range(insertPos, insertPos),
					`${comment}\n`
				);
				const workspaceEdit = new vscode.WorkspaceEdit();
				workspaceEdit.set(document.uri, [edit]);
				console.log('[documentWithPersona] Applying edit...');
				await vscode.workspace.applyEdit(workspaceEdit);
				console.log('[documentWithPersona] Edit applied successfully');

				vscode.window.showInformationMessage(`${picked.label} documentation added above selection`);
			} catch (error: any) {
				console.log('[documentWithPersona] Error:', (error as Error).message);
				vscode.window.showErrorMessage(
					`Failed to get documentation from ${picked.label}: ${(error as Error).message}`
				);
			}
		}
	);

	context.subscriptions.push(documentWithPersonaDisposable);

	console.log('[vscode-rhizome] ========== ACTIVATION COMPLETE ==========');
	console.log('[vscode-rhizome] Commands registered:');
	console.log('[vscode-rhizome]   - vscode-rhizome.healthCheck');
	console.log('[vscode-rhizome]   - vscode-rhizome.init');
	console.log('[vscode-rhizome]   - vscode-rhizome.askPersona');
	console.log('[vscode-rhizome]   - vscode-rhizome.documentWithPersona');
	console.log('[vscode-rhizome]   - @rhizome ask <persona> autocomplete');
	console.log('[vscode-rhizome] Ready to use! Open Debug Console (Cmd+Shift+U) to see activity logs.');
	console.log('[vscode-rhizome] ========== ACTIVATION END ==========');
}

export function deactivate() {}
