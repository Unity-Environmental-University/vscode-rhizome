const vscode = acquireVsCodeApi();

const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const statusEl = document.getElementById('status');
const transcriptEl = document.getElementById('transcript');
const usageEl = document.getElementById('usage');

let mediaRecorder;
let pendingChunks = [];

function setStatus(message) {
    statusEl.textContent = message;
    vscode.postMessage({ type: 'voiceStatus', value: message });
}

async function start() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

        mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data && event.data.size > 0) {
                pendingChunks.push(event.data);
            }
        });

        mediaRecorder.addEventListener('stop', handleStop);

        mediaRecorder.start(1000);

        setStatus('Recording…');
        startButton.disabled = true;
        stopButton.disabled = false;
    } catch (err) {
        vscode.postMessage({ type: 'error', value: err.message || String(err) });
        setStatus('Microphone permission denied');
    }
}

function stop() {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        return;
    }

    mediaRecorder.stop();
    startButton.disabled = false;
    stopButton.disabled = true;
}

async function handleStop() {
    if (pendingChunks.length === 0) {
        setStatus('No audio captured');
        return;
    }

    const blob = new Blob(pendingChunks, { type: 'audio/webm' });
    pendingChunks = [];

    transcriptEl.textContent = 'Audio captured (' + (blob.size / 1024).toFixed(1) + ' KB). Sending to Rhizome…';

    const arrayBuffer = await blob.arrayBuffer();
    const base64Audio = arrayBufferToBase64(arrayBuffer);

    vscode.postMessage({
        type: 'audioChunk',
        rawAudioBase64: base64Audio,
        size: blob.size,
    });

    setStatus('Processing audio…');
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

startButton.addEventListener('click', start);
stopButton.addEventListener('click', stop);

setStatus('Idle');

function appendTranscript(text) {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    transcriptEl.appendChild(paragraph);
}

function updateUsage(totals) {
    if (!totals) {
        return;
    }
    usageEl.textContent = `Usage: ${totals.chunks} chunk${totals.chunks === 1 ? '' : 's'} · ${Number(totals.totalDurationSec).toFixed(2)}s · $${Number(totals.estimatedCostUSD).toFixed(4)}`;
}

window.addEventListener('message', (event) => {
    const message = event.data;
    if (!message || typeof message.type !== 'string') {
        return;
    }
    switch (message.type) {
        case 'transcript':
            setStatus('Transcript ready');
            appendTranscript(message.text);
            break;
        case 'usageUpdate':
            updateUsage(message.totals);
            break;
        case 'error':
            setStatus(message.value || 'Error processing audio');
            break;
        default:
            break;
    }
});
