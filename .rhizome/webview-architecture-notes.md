# Webview Architecture: Why Message Passing Matters

**From code-reviewer:** You have three framework options. Pick one. But here's what matters—and what doesn't.

## What Matters: The Contract

Extension and webview talk via **messages only**. No shared state, no DOM access from extension, no globals.

```typescript
// Extension → Webview
panel.webview.postMessage({
  type: 'personas-loaded',
  data: ['dev-guide', 'code-reviewer', ...]
});

// Webview → Extension
vscode.postMessage({
  type: 'persona-selected',
  data: 'dev-guide'
});
```

**Why?** Webviews run in iframe sandbox. Extension can't access DOM. Messages are the safe bridge.

## What Doesn't Matter (Yet)

- Framework choice. Svelte, Solid, vanilla JS—all use the same message contract.
- Build tooling. We'll figure that out once you have code to build.
- Bundling strategy. Defer until there's actual bundle to optimize.

## Critical Detail: acquireVsCodeApi()

Every webview script needs this global (provided by VSCode at runtime):

```typescript
const vscode = acquireVsCodeApi();
vscode.postMessage({ type: 'hello', data: 'world' });
```

Don't call it twice. Don't destructure it. Just use it.

## Webview Lifecycle

1. Extension creates panel
2. Extension sets `panel.webview.html` (loads HTML into iframe)
3. HTML loads framework (Svelte compiled JS, etc.)
4. Framework code calls `acquireVsCodeApi()`
5. Framework ready to send/receive messages
6. User interaction → message to extension → extension action → message back to webview

## One More Thing: CSP (Content Security Policy)

VSCode sandboxes webviews. Your HTML needs:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-{{nonce}}';"
>

<!-- And your script needs the nonce -->
<script nonce="{{nonce}}">
  const vscode = acquireVsCodeApi();
  // ...
</script>
```

The extension sets the nonce at runtime. Don't skip this—it's a security requirement.

## Testing the Message Flow

Before you build anything fancy, test:

```typescript
// Extension
panel.webview.onDidReceiveMessage((message) => {
  console.log('Received:', message);
  if (message.type === 'persona-selected') {
    // do something
    panel.webview.postMessage({ type: 'ack', data: 'got it' });
  }
});

// Webview
const vscode = acquireVsCodeApi();
vscode.postMessage({ type: 'persona-selected', data: 'test' });
window.addEventListener('message', (e) => {
  console.log('Webview received:', e.data);
});
```

If you see both logs, the bridge works. Build from there.

## Summary

- Messages are the contract. Get that right, everything else flows.
- Framework is decoration (very good decoration, but decoration).
- CSP is not optional.
- Test the bridge before adding UI complexity.

Pick Svelte. Build the backend. Wire it up. Ship it.

Then optimize.
