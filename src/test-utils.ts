/**
 * vscode-rhizome Test Utilities Library
 *
 * don-socratic asks:
 * When you write multiple tests, what do they all need?
 * Setup, assertions, mocks, cleanup... isn't there a pattern there?
 * Could you extract it so each test is just the interesting parts?
 *
 * This library provides:
 * - Workspace setup/teardown
 * - Mock rhizome CLI responses
 * - Extension state management
 * - Common assertions
 * - Configuration helpers
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { randomBytes } from 'crypto';

/**
 * Test workspace: temporary directory for testing
 * Creates .rhizome context, test files, and utilities
 */
export class TestWorkspace {
	private workspaceDir: string;
	private rhizomeDir: string;

	constructor(baseDir: string = '/tmp') {
		const timestamp = Date.now();
		const random = randomBytes(8).toString('hex');
		this.workspaceDir = path.join(baseDir, `vscode-rhizome-test-${timestamp}-${random}`);
		this.rhizomeDir = path.join(this.workspaceDir, '.rhizome');
	}

	/**
	 * Create the workspace directory structure
	 */
	async setup(): Promise<string> {
		// Create workspace root
		if (!fs.existsSync(this.workspaceDir)) {
			fs.mkdirSync(this.workspaceDir, { recursive: true });
		}

		// Create .rhizome context
		if (!fs.existsSync(this.rhizomeDir)) {
			fs.mkdirSync(this.rhizomeDir, { recursive: true });
		}

		// Create .gitignore
		this.createGitignore();

		// Initialize rhizome config
		this.createRhizomeConfig();

		return this.workspaceDir;
	}

	/**
	 * Clean up workspace
	 */
	async teardown(): Promise<void> {
		if (fs.existsSync(this.workspaceDir)) {
			fs.rmSync(this.workspaceDir, { recursive: true, force: true });
		}
	}

	/**
	 * Create a test file with code
	 */
	createFile(filename: string, content: string): string {
		const filePath = path.join(this.workspaceDir, filename);
		const dir = path.dirname(filePath);

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		fs.writeFileSync(filePath, content, 'utf-8');
		return filePath;
	}

	/**
	 * Read a file from the workspace
	 */
	readFile(filename: string): string {
		const filePath = path.join(this.workspaceDir, filename);
		return fs.readFileSync(filePath, 'utf-8');
	}

	/**
	 * Create .gitignore with sensible defaults
	 */
	private createGitignore(): void {
		const gitignorePath = path.join(this.workspaceDir, '.gitignore');
		const content = '.rhizome/config.json\nnode_modules/\n.DS_Store\n';
		fs.writeFileSync(gitignorePath, content, 'utf-8');
	}

	/**
	 * Create minimal rhizome config
	 */
	private createRhizomeConfig(): void {
		const configPath = path.join(this.rhizomeDir, 'config.json');
		const config = {
			ai: {
				provider: 'openai',
				model: 'gpt-4o-mini',
			},
		};
		fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
	}

	/**
	 * Set OpenAI API key in config
	 */
	setOpenAIKey(apiKey: string): void {
		const configPath = path.join(this.rhizomeDir, 'config.json');
		const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		config.ai.openai_key = apiKey;
		fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

		// Also set env var
		process.env.OPENAI_API_KEY = apiKey;
	}

	get path(): string {
		return this.workspaceDir;
	}

	get rhizomePath(): string {
		return this.rhizomeDir;
	}
}

/**
 * Mock rhizome CLI responses
 *
 * don-socratic asks:
 * When testing code that calls external tools, do you want to:
 * a) Call the real tool (slow, requires setup)
 * b) Mock it (fast, controlled, but less realistic)
 * c) Both?
 *
 * This class lets you do both.
 */
export class MockRhizome {
	private responses: Map<string, string> = new Map();
	private callLog: Array<{ command: string; stdin: string }> = [];

	/**
	 * Register a response for a given persona query
	 */
	registerResponse(persona: string, input: string, response: string): void {
		const key = `${persona}:${input}`;
		this.responses.set(key, response);
	}

	/**
	 * Get recorded calls to rhizome
	 */
	getCalls(): Array<{ command: string; stdin: string }> {
		return [...this.callLog];
	}

	/**
	 * Reset all registered responses and logs
	 */
	clear(): void {
		this.responses.clear();
		this.callLog = [];
	}

	/**
	 * Simulate a rhizome query call
	 *
	 * In real tests, this would replace execSync in the extension
	 */
	simulateQuery(persona: string, input: string): string {
		this.callLog.push({ command: `rhizome query --persona ${persona}`, stdin: input });

		const key = `${persona}:${input}`;
		if (this.responses.has(key)) {
			return this.responses.get(key)!;
		}

		// Default response if no mock registered
		return `[Mock Response] don-socratic would question: "${input.substring(0, 50)}..."`;
	}
}

/**
 * Common test assertions for vscode-rhizome
 *
 * don-socratic asks:
 * Every test checks the same things: "did the file change correctly?"
 * "Is the error message helpful?" Could those assertions be standard?
 */
export class TestAssertions {
	/**
	 * Assert file contains expected content
	 */
	static fileContains(filePath: string, content: string, message?: string): void {
		const fileContent = fs.readFileSync(filePath, 'utf-8');
		if (!fileContent.includes(content)) {
			throw new Error(
				message || `File ${filePath} does not contain: "${content}"\n\nActual content:\n${fileContent}`
			);
		}
	}

	/**
	 * Assert file matches exactly (after trimming whitespace)
	 */
	static fileEquals(filePath: string, expectedContent: string, message?: string): void {
		const actual = fs.readFileSync(filePath, 'utf-8').trim();
		const expected = expectedContent.trim();
		if (actual !== expected) {
			throw new Error(
				message ||
					`File content mismatch:\n\nExpected:\n${expected}\n\nActual:\n${actual}`
			);
		}
	}

	/**
	 * Assert .gitignore contains entry
	 */
	static gitignoreContains(workspaceDir: string, entry: string, message?: string): void {
		const gitignorePath = path.join(workspaceDir, '.gitignore');
		const content = fs.readFileSync(gitignorePath, 'utf-8');
		if (!content.includes(entry)) {
			throw new Error(
				message ||
					`${entry} not found in .gitignore:\n\n${content}`
			);
		}
	}

	/**
	 * Assert config.json has expected value
	 */
	static configHasValue(configPath: string, key: string, expectedValue: string, message?: string): void {
		const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

		// Navigate nested keys like "ai.provider"
		const parts = key.split('.');
		let value = config;
		for (const part of parts) {
			value = value?.[part];
		}

		if (value !== expectedValue) {
			throw new Error(
				message ||
					`Config ${key} = "${value}", expected "${expectedValue}"`
			);
		}
	}

	/**
	 * Assert indentation is preserved in file
	 */
	static indentationMatches(filePath: string, lineNumber: number, expectedIndent: string, message?: string): void {
		const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
		const line = lines[lineNumber - 1];
		const actualIndent = line.match(/^\s*/)?.[0] || '';

		if (actualIndent !== expectedIndent) {
			throw new Error(
				message ||
					`Line ${lineNumber} indentation mismatch: expected "${expectedIndent}" (${expectedIndent.length} chars), got "${actualIndent}" (${actualIndent.length} chars)`
			);
		}
	}
}

/**
 * Helpers for common test setup patterns
 */
export class TestSetup {
	/**
	 * Create a workspace with a TypeScript file ready for stub generation
	 */
	static createStubGenerationTest(): { workspace: TestWorkspace; filePath: string } {
		const workspace = new TestWorkspace();
		workspace.setup();

		const testCode = `
// @rhizome stub
export function greet(name: string): string {
	// TODO: implement
}

export async function fetchData(id: number): Promise<any> {
	throw new Error('Not implemented');
}
`;

		const filePath = workspace.createFile('test.ts', testCode);

		return { workspace, filePath };
	}

	/**
	 * Create a workspace with code ready for don-socratic questioning
	 */
	static createQuestioningTest(): { workspace: TestWorkspace; filePath: string } {
		const workspace = new TestWorkspace();
		workspace.setup();

		const testCode = `
export function calculateTotal(items: Array<{price: number}>) {
	let total = 0;
	for (const item of items) {
		total += item.price;
	}
	return total;
}
`;

		const filePath = workspace.createFile('logic.ts', testCode);

		return { workspace, filePath };
	}

	/**
	 * Create workspace with key already configured
	 */
	static createWithOpenAIKey(apiKey: string = 'test-key-123'): TestWorkspace {
		const workspace = new TestWorkspace();
		workspace.setup();
		workspace.setOpenAIKey(apiKey);
		return workspace;
	}
}
