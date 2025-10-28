import assert from 'assert';
import { VoiceTranscriber, OutputChannelLike } from './voiceTranscriber';

class MockOutputChannel implements OutputChannelLike {
	public readonly messages: string[] = [];
	appendLine(value: string): void {
		this.messages.push(value);
	}
	show(): void {
		// no-op for tests
	}
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('VoiceTranscriber', () => {
	it('processes audio chunks sequentially', async () => {
		const output = new MockOutputChannel();
		const transcripts: string[] = [];
		let resolveDone: () => void;
		const done = new Promise<void>((resolve) => {
			resolveDone = resolve;
		});

		const transcriber = new VoiceTranscriber(
			{
				outputChannel: output,
				onTranscript: (text) => {
					transcripts.push(text);
					if (transcripts.length === 2) {
						resolveDone();
					}
				},
			},
			async (base64) => {
				if (base64 === 'first') {
					await delay(20);
				}
				return { text: base64 };
			}
		);

		transcriber.handleChunk('first');
		transcriber.handleChunk('second');

		await done;

		assert.deepStrictEqual(transcripts, ['first', 'second']);
		assert.ok(output.messages.some((line) => line.includes('Transcribing audio chunk…')));
	});
});

