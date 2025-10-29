/**
 * outputFormatter.ts
 *
 * @rhizome: How do you structure output for clarity?
 * This module answers: header + body + footer = readable output.
 * It doesn't decide WHAT to display, just HOW to display it.
 */

import * as vscode from 'vscode';

/**
 * Format persona response for output channel
 *
 * Shows: persona name, question (if provided), context snippet, response
 */
export function formatPersonaOutput(
	channel: vscode.OutputChannel,
	personaName: string,
	question: string,
	selectedCode: string,
	response: string
) {
	channel.appendLine('='.repeat(60));
	channel.appendLine(personaName);
	channel.appendLine('='.repeat(60));
	if (question) {
		channel.appendLine('Question:');
		channel.appendLine(question);
		channel.appendLine('');
	}
	if (selectedCode) {
		channel.appendLine('Context snippet:');
		channel.appendLine('');
		channel.appendLine(selectedCode);
		channel.appendLine('');
	}
	channel.appendLine(`Response from ${personaName}:`);
	channel.appendLine('');
	channel.appendLine(response);
}

/**
 * Format health check results for output channel
 */
export function formatHealthCheck(
	channel: vscode.OutputChannel,
	details: string[],
	healthy: boolean
) {
	channel.appendLine('='.repeat(60));
	channel.appendLine('vscode-rhizome Health Check');
	channel.appendLine('='.repeat(60));
	channel.appendLine('');

	for (const detail of details) {
		channel.appendLine(detail);
	}

	channel.appendLine('');
	if (healthy) {
		channel.appendLine('✓ All checks passed. Extension is ready to use.');
	} else {
		channel.appendLine('✗ Some checks failed. See above for details.');
	}
}

/**
 * Format diagnosis output for output channel
 */
export function formatDiagnosis(channel: vscode.OutputChannel) {
	channel.appendLine('='.repeat(70));
	channel.appendLine('RHIZOME ENVIRONMENT DIAGNOSIS');
	channel.appendLine('='.repeat(70));
	channel.appendLine('');
	return channel;
}
