# VSCode Extension UI Framework Examples

For vscode-rhizome webviews. These are minimal, wired examples—not tutorials. Copy, adapt, learn by doing.

## Pattern: Extension ↔ Webview Message Flow

VSCode extensions communicate with webviews via:
```typescript
// Extension side
panel.webview.postMessage({ type: 'persona-loaded', data: personaName });

// Webview side
window.addEventListener('message', (event) => {
  const { type, data } = event.data;
  // handle it
});

// Webview back to extension
const vscode = acquireVsCodeApi();
vscode.postMessage({ type: 'user-clicked-something', data: value });
```

---

## 1. Svelte Example

**Why:** Compiles tiny, no runtime, excellent DX. Industry standard for VSCode extensions.

**File: `webview/src/App.svelte`**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  let personas: string[] = [];
  let selectedPersona: string | null = null;
  let loading = true;

  const vscode = acquireVsCodeApi();

  onMount(() => {
    // Listen for messages from extension
    window.addEventListener('message', (event) => {
      const { type, data } = event.data;

      if (type === 'personas-loaded') {
        personas = data;
        loading = false;
      }

      if (type === 'error') {
        console.error('Extension error:', data);
        loading = false;
      }
    });

    // Ask extension to send personas
    vscode.postMessage({ type: 'request-personas' });
  });

  function handlePersonaClick(persona: string) {
    selectedPersona = persona;
    vscode.postMessage({ type: 'persona-selected', data: persona });
  }
</script>

<div class="container">
  <h1>Rhizome Personas</h1>

  {#if loading}
    <p>Loading...</p>
  {:else if personas.length === 0}
    <p>No personas found</p>
  {:else}
    <ul>
      {#each personas as persona (persona)}
        <li>
          <button
            on:click={() => handlePersonaClick(persona)}
            class:active={selectedPersona === persona}
          >
            {persona}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .container {
    padding: 1rem;
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
  }

  button {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 2px;
    cursor: pointer;
    margin: 0.25rem;
  }

  button:hover {
    background: var(--vscode-button-hoverBackground);
  }

  button.active {
    background: var(--vscode-inputValidation-infoBorder);
  }
</style>
```

**Why this pattern:**
- Uses VSCode CSS variables (respects theme automatically)
- Reactive updates (`let personas` triggers re-render)
- Message passing is explicit (no magic)
- Svelte compiles this to ~10KB vanilla JS

---

## 2. Solid.js Example

**Why:** Better performance than Svelte, smaller footprint, very fine-grained reactivity.

**File: `webview/src/App.tsx`**

```tsx
import { createSignal, For, Show } from 'solid-js';

export function App() {
  const [personas, setPersonas] = createSignal<string[]>([]);
  const [selectedPersona, setSelectedPersona] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(true);

  const vscode = acquireVsCodeApi();

  // Setup message listener
  const setupListener = () => {
    window.addEventListener('message', (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'personas-loaded':
          setPersonas(data);
          setLoading(false);
          break;
        case 'error':
          console.error('Extension error:', data);
          setLoading(false);
          break;
      }
    });

    // Request personas on mount
    vscode.postMessage({ type: 'request-personas' });
  };

  // Setup once
  if (typeof window !== 'undefined') {
    setupListener();
  }

  const handlePersonaClick = (persona: string) => {
    setSelectedPersona(persona);
    vscode.postMessage({ type: 'persona-selected', data: persona });
  };

  return (
    <div class="container">
      <h1>Rhizome Personas</h1>

      <Show when={loading()}>
        <p>Loading...</p>
      </Show>

      <Show when={!loading() && personas().length === 0}>
        <p>No personas found</p>
      </Show>

      <Show when={!loading() && personas().length > 0}>
        <ul>
          <For each={personas()}>
            {(persona) => (
              <li>
                <button
                  onClick={() => handlePersonaClick(persona)}
                  class={selectedPersona() === persona ? 'active' : ''}
                >
                  {persona}
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}
```

**Why this pattern:**
- `createSignal` is fine-grained reactivity (only re-renders what changed)
- `<Show>` instead of `{#if}` (Solid's conditional)
- `<For>` instead of `.map()` (preserves component state across renders)
- Final JS bundle slightly smaller than Svelte

---

## 3. HTMX (Zero-Framework) Example

**Why:** If you want to avoid framework overhead entirely. Server-driven HTML updates.

**File: `webview/index.html`**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/htmx.org"></script>
  <style>
    body {
      font-family: var(--vscode-font-family, sans-serif);
      color: var(--vscode-foreground);
      padding: 1rem;
    }

    button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 2px;
      cursor: pointer;
      margin: 0.25rem;
    }

    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
  </style>
</head>
<body>
  <h1>Rhizome Personas</h1>

  <!-- htmx handles loading/refresh -->
  <div
    id="personas-list"
    hx-get="/api/personas"
    hx-trigger="load"
    hx-swap="innerHTML"
  >
    <p>Loading...</p>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    // Listen for extension messages
    window.addEventListener('message', (event) => {
      const { type, data } = event.data;

      if (type === 'personas-updated') {
        // Trigger htmx refresh
        htmx.ajax('GET', '/api/personas', '#personas-list');
      }
    });

    // Send selection back
    document.addEventListener('click', (e) => {
      if (e.target.dataset.persona) {
        vscode.postMessage({
          type: 'persona-selected',
          data: e.target.dataset.persona
        });
      }
    });
  </script>
</body>
</html>
```

**Corresponding Extension Code (Node backend for webview):**

```typescript
import express from 'express';

app.get('/api/personas', (req, res) => {
  const personas = ['dev-guide', 'code-reviewer', 'don-socratic'];

  res.send(`
    <ul>
      ${personas
        .map(
          (p) => `
        <li>
          <button data-persona="${p}">${p}</button>
        </li>
      `
        )
        .join('')}
    </ul>
  `);
});
```

**Why this pattern:**
- Zero JavaScript framework deps (just htmx for interactivity)
- HTML-driven (server generates structure)
- Good for forms and simple state
- Minimal bundle size

---

## Comparison for vscode-rhizome

| Aspect | Svelte | Solid | HTMX |
|--------|--------|-------|------|
| **Bundle size** | ~10KB | ~8KB | ~15KB (htmx) |
| **DX** | Excellent | Very good | Basic (HTML-driven) |
| **Reactivity** | Fine-grained | Fine-grained | Server-driven |
| **Learning curve** | Moderate | Moderate | Low |
| **VSCode plugin standard** | ✓ Well-tested | ✓ Growing | ○ Uncommon |
| **Best for extension UI?** | **Svelte** | **Solid** | **Simple UX** |

---

## Recommendation for vscode-rhizome

**Start with Svelte.** It's the path of least resistance for VSCode extensions, tons of examples online, and the DX is excellent for rapid iteration.

If bundle size becomes a concern later, Solid is a drop-in replacement (same message-passing pattern).

HTMX is overkill unless you're building a complex server-backed UI.

---

## Next: Hook up the Backend

Once you choose, the wiring is the same:

1. Extension spawns webview
2. Webview requests `personas-list` (via `vscode.postMessage`)
3. Extension calls `cliBackend.personaList()` (your soon-to-be-built lib)
4. Extension returns personas to webview
5. Webview renders them

The framework doesn't matter. The message flow does.
