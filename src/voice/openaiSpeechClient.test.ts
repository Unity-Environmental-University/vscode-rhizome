import assert from 'assert';
import { transcribeAudioChunk } from './openaiSpeechClient';

describe('openaiSpeechClient', () => {
	it('throws when OPENAI_API_KEY is missing', async () => {
		const previousKey = process.env.OPENAI_API_KEY;
		delete process.env.OPENAI_API_KEY;

		await assert.rejects(
			() => transcribeAudioChunk('ZmFrZS1hdWRpby1iYXNlNjQ='),
			(error: any) => {
				assert.ok(
					String(error.message).includes('OpenAI API key not configured'),
					`Unexpected error message: ${error.message}`
				);
				return true;
			}
		);

		if (previousKey) {
			process.env.OPENAI_API_KEY = previousKey;
		}
	});
});

