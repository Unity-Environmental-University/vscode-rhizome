# Rhizome Voice Control Preview

This experimental path demonstrates how the VS Code extension can host a voice-control surface without bundling audio APIs into the main extension host.

## Overview

- Command: `Open Rhizome Voice Control` (`vscode-rhizome.openVoiceControl`).
- Loads a webview panel managed by `src/voice/voiceControlPanel.ts`.
- Webview UI (see `media/voicePanel.*`) requests microphone access via `getUserMedia`, records one-second chunks with `MediaRecorder`, and streams base64-encoded audio to the extension.
- The extension serialises those chunks, posts them to the OpenAI audio transcription endpoint via `src/voice/openaiSpeechClient.ts`, and surfaces the resulting transcript in the `Rhizome Voice Preview` output channel.

If OpenAI rejects the request (missing key, network error, etc.) the extension surfaces the error in both the output channel and VS Code notifications.

## Next Steps

1. Feed completed transcripts into persona workflows (e.g., automatically trigger `askPersonaAboutSelection`).
2. Tighten security/permissions messaging in the webview UI and document opt-in requirements for users.
3. Add manual QA notes for macOS/Windows/Linux audio capture nuances.
