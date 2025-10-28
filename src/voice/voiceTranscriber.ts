import type * as vscode from 'vscode';
import { transcribeAudioChunk, TranscriptionResult } from './openaiSpeechClient';

export interface OutputChannelLike {
	appendLine(value: string): void;
	show(preserveFocus?: boolean): void;
}

export interface TranscriptHandlerOptions {
	outputChannel?: OutputChannelLike;
	onTranscript?: (transcript: string) => void;
	onResult?: (result: TranscriptionResult & { sizeBytes?: number }) => void;
}

type TranscribeFn = (base64: string) => Promise<TranscriptionResult>;

export class VoiceTranscriber {
	private readonly outputChannel: OutputChannelLike;
	private readonly onTranscript: (transcript: string) => void;
	private readonly onResult?: (result: TranscriptionResult & { sizeBytes?: number }) => void;
	private pending: Promise<void> = Promise.resolve();

	constructor(options: TranscriptHandlerOptions = {}, private readonly transcribe: TranscribeFn = transcribeAudioChunk) {
		this.outputChannel = options.outputChannel ?? createOutputChannel();
		this.onTranscript = options.onTranscript ?? (() => {});
		this.onResult = options.onResult;
	}

	public handleChunk(base64Audio: string, metadata: { sizeBytes?: number } = {}): void {
		this.pending = this.pending.then(async () => {
			await this.processChunk(base64Audio, metadata);
		}).catch((error) => {
			this.reportError(error as Error);
		});
	}

	private async processChunk(base64Audio: string, metadata: { sizeBytes?: number }): Promise<void> {
		this.outputChannel.appendLine('Transcribing audio chunk…');
		const result = await this.transcribe(base64Audio);
		const transcript = result.text;
		if (!transcript || transcript.trim().length === 0) {
			this.outputChannel.appendLine('Received empty transcript');
			return;
		}
		this.outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${transcript.trim()}`);
		this.outputChannel.show(true);
		this.onTranscript(transcript.trim());
		if (this.onResult) {
			this.onResult({ ...result, ...metadata });
		}
	}

	private reportError(error: Error): void {
		const message = `Voice transcription error: ${error.message}`;
		this.outputChannel.appendLine(message);
		if (vscodeApi) {
			vscodeApi.window.showErrorMessage(message);
		}
	}
}

let vscodeApi: typeof import('vscode') | undefined;
try {
	vscodeApi = require('vscode');
} catch {
	vscodeApi = undefined;
}

function createOutputChannel(): OutputChannelLike {
	if (vscodeApi) {
		return vscodeApi.window.createOutputChannel('Rhizome Voice Preview');
	}
	throw new Error('VS Code API unavailable: provide an OutputChannel in TranscriptHandlerOptions');
}
