# Rhizome Voice Control Preview

This experimental path demonstrates how the VS Code extension can host a voice-control surface without bundling audio APIs into the main extension host.

## Overview

- Command: `Open Rhizome Voice Control` (`vscode-rhizome.openVoiceControl`).
- Loads a webview panel managed by `src/voice/voiceControlPanel.ts`.
- Webview UI (see `media/voicePanel.*`) requests microphone access via `getUserMedia`, records one-second chunks with `MediaRecorder`, and returns base64-encoded audio to the extension for further processing.

Currently the extension writes the simulated transcript payload to the `Rhizome Voice Preview` output channel. Wiring these chunks to an OpenAI streaming endpoint (or other STT service) is the next integration step.

## Next Steps

1. Implement a background worker in the extension that forwards `rawAudioBase64` chunks to the chosen speech-to-text service.
2. Parse streaming transcripts and hand them to existing persona flows (e.g., invoke `askPersonaAboutSelection`).
3. Tighten security/permissions messaging in the webview UI and document opt-in requirements for users.
4. Add unit tests around message handling and manual QA notes for macOS/Windows/Linux audio capture.
