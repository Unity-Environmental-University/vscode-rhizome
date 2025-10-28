import * as vscode from 'vscode';
import { VoiceTranscriber } from './voiceTranscriber';
import { VoiceUsageTracker, UsageTotals } from './voiceUsageTracker';

export interface VoiceTranscriptPayload {
	text: string;
	durationSec?: number;
	sizeBytes?: number;
}

export interface VoicePanelHandlerTools {
	appendOutput(line: string): void;
	showOutput(): void;
}

export interface VoicePanelHandlers {
	onTranscript?: (payload: VoiceTranscriptPayload, tools: VoicePanelHandlerTools) => Promise<void> | void;
}

/**
 * VoiceControlPanel manages the lifecycle of the Rhizome voice webview.
 * The panel is responsible for presenting the UI and relaying messages
 * back to the extension host.
 */
export class VoiceControlPanel {
	private panel: vscode.WebviewPanel | undefined;
	private readonly outputChannel = vscode.window.createOutputChannel('Rhizome Voice Preview');
	private readonly usageTracker = new VoiceUsageTracker();
	private readonly transcriber: VoiceTranscriber;

	constructor(private readonly context: vscode.ExtensionContext, private readonly handlers: VoicePanelHandlers = {}) {
		this.transcriber = new VoiceTranscriber(
			{
				outputChannel: this.outputChannel,
				onTranscript: (transcript) => {
					vscode.window.setStatusBarMessage(`Voice transcript ready: ${truncate(transcript, 60)}`, 5000);
				},
				onResult: async (result) => {
					await this.handleTranscriptionResult(result);
				},
			}
		);
	}

    public show(): void {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'rhizomeVoiceControl',
            'Rhizome Voice Control (Preview)',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'media'),
                ],
            }
        );

        this.panel.webview.html = this.getHtmlForWebview(this.panel.webview);

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

		this.panel.webview.onDidReceiveMessage((message) => {
			switch (message.type) {
				case 'voiceStatus':
					vscode.window.setStatusBarMessage(message.value, 3000);
					break;
				case 'audioChunk':
					this.handleAudioChunk(message.rawAudioBase64, message.size);
					break;
				case 'error':
					vscode.window.showErrorMessage(message.value);
					break;
				default:
					break;
			}
		});
	}

	private handleAudioChunk(base64Audio: string, sizeBytes?: number) {
		if (!base64Audio) {
			vscode.window.showErrorMessage('Received empty audio payload from webview');
			return;
		}
		this.transcriber.handleChunk(base64Audio, { sizeBytes });
	}

	private async handleTranscriptionResult(result: { text: string; durationSec?: number; sizeBytes?: number }) {
		const transcript = result.text.trim();
		const totals = this.usageTracker.record({
			sizeBytes: result.sizeBytes,
			durationSec: result.durationSec,
		});
		this.outputChannel.appendLine(
			`[usage] chunks=${totals.chunks} bytes=${totals.totalBytes} duration=${totals.totalDurationSec.toFixed(2)}s cost=$${totals.estimatedCostUSD.toFixed(4)}`
		);
		this.postUsageUpdate(totals);
		this.postTranscriptToWebview(transcript);
		if (this.handlers.onTranscript) {
			await this.handlers.onTranscript(
				{
					text: transcript,
					durationSec: result.durationSec,
					sizeBytes: result.sizeBytes,
				},
				{
					appendOutput: (line) => {
						this.outputChannel.appendLine(line);
					},
					showOutput: () => this.outputChannel.show(true),
				}
			);
		}
	}

	private postUsageUpdate(totals: UsageTotals) {
		this.panel?.webview.postMessage({
			type: 'usageUpdate',
			totals: {
				chunks: totals.chunks,
				totalBytes: totals.totalBytes,
				totalDurationSec: totals.totalDurationSec,
				estimatedCostUSD: totals.estimatedCostUSD,
			},
		});
	}

	private postTranscriptToWebview(transcript: string) {
		this.panel?.webview.postMessage({
			type: 'transcript',
			text: transcript,
		});
	}

    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'voicePanel.js')
        );

        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'voicePanel.css')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; connect-src ${webview.cspSource} https://api.openai.com;" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="${styleUri}" />
    <title>Rhizome Voice Control</title>
</head>
<body>
    <main>
        <h1>Rhizome Voice Control (Preview)</h1>
        <p>Opt-in to microphone access to experiment with voice-driven Rhizome prompts.</p>
        <div class="controls">
            <button id="startButton">Start Listening</button>
            <button id="stopButton" disabled>Stop</button>
        </div>
        <section class="status" id="status">Idle</section>
        <section class="usage" id="usage">Usage: 0 chunks · 0.00s · $0.0000</section>
        <section class="transcript" id="transcript"></section>
    </main>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function getNonce(): string {
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	return Array.from({ length: 16 }, () => possible[Math.floor(Math.random() * possible.length)]).join('');
}

function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength - 1)}…`;
}

export function registerVoiceControlCommand(
	context: vscode.ExtensionContext,
	handlers: VoicePanelHandlers = {}
): vscode.Disposable {
	const panel = new VoiceControlPanel(context, handlers);
	return vscode.commands.registerCommand('vscode-rhizome.openVoiceControl', () => {
		panel.show();
	});
}
