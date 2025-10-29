/**
 * helpers.ts
 *
 * @rhizome: What belongs in helpers?
 * Small, reusable utilities that don't warrant a full service.
 * Language detection, selection validation, etc.
 */

import * as vscode from 'vscode';

/**
 * Get active selection, validate it exists
 */
export function getActiveSelection(): { editor: vscode.TextEditor; selectedText: string } | null {
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
 * Detect language from VSCode languageId
 */
export function detectLanguage(languageId: string): 'typescript' | 'javascript' | 'python' | null {
	if (languageId === 'typescript' || languageId === 'javascript') {
		return 'typescript';
	}
	if (languageId === 'python') {
		return 'python';
	}
	return null;
}

/**
 * Perform health check for rhizome integration
 */
export async function performHealthCheck(workspaceRoot: string): Promise<{ healthy: boolean; details: string[] }> {
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
