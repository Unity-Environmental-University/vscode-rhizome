import * as vscode from 'vscode';

/**
 * VoiceControlPanel manages the lifecycle of the Rhizome voice webview.
 * The panel is responsible for presenting the UI and relaying messages
 * back to the extension host.
 */
export class VoiceControlPanel {
    private panel: vscode.WebviewPanel | undefined;
    private readonly outputChannel = vscode.window.createOutputChannel('Rhizome Voice Preview');

    constructor(private readonly context: vscode.ExtensionContext) {}

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
                case 'transcript':
                    this.handleTranscript(message.value);
                    break;
                case 'error':
                    vscode.window.showErrorMessage(message.value);
                    break;
                default:
                    break;
            }
        });
    }

    private handleTranscript(text: string) {
        this.outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${text}`);
        this.outputChannel.show(true);
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

export function registerVoiceControlCommand(context: vscode.ExtensionContext): vscode.Disposable {
    const panel = new VoiceControlPanel(context);
    return vscode.commands.registerCommand('vscode-rhizome.openVoiceControl', () => {
        panel.show();
    });
}
