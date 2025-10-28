import * as https from 'https';
import { Buffer } from 'buffer';
import { randomBytes } from 'crypto';

export interface TranscriptionOptions {
	model?: string;
}

export interface TranscriptionResult {
	text: string;
	durationSec?: number;
	model?: string;
}

export async function transcribeAudioChunk(
	base64Audio: string,
	options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error('OpenAI API key not configured. Run the Rhizome init flow or set OPENAI_API_KEY.');
	}

	if (!base64Audio || base64Audio.length === 0) {
		throw new Error('Empty audio payload received');
	}

	const audioBuffer = Buffer.from(base64Audio, 'base64');
	const boundary = `----rhizome-voice-${randomBytes(8).toString('hex')}`;
	const model = options.model ?? 'gpt-4o-transcribe';

	const parts: Buffer[] = [];
	const push = (content: string) => {
		parts.push(Buffer.from(content, 'utf-8'));
	};

	push(`--${boundary}\r\n`);
	push('Content-Disposition: form-data; name="model"\r\n\r\n');
	push(`${model}\r\n`);

	push(`--${boundary}\r\n`);
	push('Content-Disposition: form-data; name="response_format"\r\n\r\n');
	push('json\r\n');

	push(`--${boundary}\r\n`);
	push('Content-Disposition: form-data; name="file"; filename="chunk.webm"\r\n');
	push('Content-Type: audio/webm\r\n\r\n');
	parts.push(audioBuffer);
	push('\r\n');
	push(`--${boundary}--\r\n`);

	const body = Buffer.concat(parts);

	const requestOptions: https.RequestOptions = {
		hostname: 'api.openai.com',
		path: '/v1/audio/transcriptions',
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': `multipart/form-data; boundary=${boundary}`,
			'Content-Length': body.length,
		},
	};

	const responseBody = await new Promise<string>((resolve, reject) => {
		const req = https.request(requestOptions, (res) => {
			const chunks: Buffer[] = [];

			res.on('data', (chunk: Buffer) => chunks.push(chunk));
			res.on('error', reject);
			res.on('end', () => {
				const payload = Buffer.concat(chunks).toString('utf-8');
				if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
					resolve(payload);
				} else {
					reject(new Error(`OpenAI transcription failed (${res.statusCode ?? 'unknown'}): ${payload}`));
				}
			});
		});

		req.on('error', reject);
		req.write(body);
		req.end();
	});

	try {
		const parsed = JSON.parse(responseBody);
		const text = typeof parsed.text === 'string' ? parsed.text : String(responseBody).trim();
		const duration = typeof parsed.duration === 'number' ? parsed.duration : undefined;
		return {
			text: text.trim(),
			durationSec: duration,
			model: parsed.model ?? model,
		};
	} catch {
		return {
			text: responseBody.trim(),
			model,
		};
	}
}
