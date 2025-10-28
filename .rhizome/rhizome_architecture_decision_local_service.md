# Architecture Decision: Local Service + REST for Agent Communication

**Date:** 2025-10-23
**Status:** Proposed
**Decision Owner:** hallie
**Affected Projects:** rhizome (core), vscode-rhizome, future agent integrations

---

## The Problem We're Solving

Multiple agents (VSCode extension, future MCPs, distant tools) need to invoke rhizome personae and get structured responses. The current CLI-first design doesn't support:
- Agent-to-agent communication within a project
- Extension-to-rhizome without shelling out
- Future cross-project persona queries
- Long-running persona context (session state)

## The Decision

**Rhizome becomes a local REST service as primary interface.**

Each `.rhizome` project runs a lightweight HTTP server (`localhost:XXXX`) that:
1. Loads personae from the project's `.rhizome/personas.d/` and overlays
2. Exposes REST endpoints for persona invocation
3. Serves as the authority for that project's decisions, memories, flight plans
4. Eventually enables cross-project agent communication (future)

**The CLI becomes a consumer** of this service (not the source of truth).

---

## MVP Contract

### Endpoints (First Pass)

```
POST /invoke-persona
{
  "persona": "don-socratic",
  "mode": "reasoner",  // optional, defaults to first mode
  "context": {
    "file": "/path/to/file",
    "selection": "...",
    "flight_plan": "fp-123",
    // ... whatever the caller needs the persona to see
  },
  "prompt": "What do you see in this code?"
}

Response:
{
  "persona": "don-socratic",
  "mode": "reasoner",
  "response": "...",
  "reasoning": "...",  // optional, for transparency
  "timestamp": "2025-10-23T...",
  "logged": true  // whether this was recorded to actions.ndjson
}
```

### Discovery & Startup

**How does the extension find the service?**
- Lock file at `.rhizome/service.lock` containing `PORT` + `PID`
- Extension checks on startup; if missing, runs `rhizome serve` in background
- Port defaults to 8888 (configurable via env var `RHIZOME_SERVICE_PORT`)

**When does the server start?**
- Explicit: `rhizome serve` (foreground or daemonized)
- Implicit: Auto-start on first extension activation if `.rhizome` exists
- Shutdown: Graceful on SIGTERM or explicit `rhizome stop`

---

## Why This Works

1. **Decouples interface from logic** — CLI, VSCode, web UI, MCPs all talk the same protocol
2. **Scales to agent communication** — Future agents invoke personae the same way
3. **Preserves memories** — Responses can be logged to `actions.ndjson` automatically
4. **Lightweight for MVP** — Just HTTP, no complex RPC layer
5. **CLI still works** — `rhizome persona ...` shells out to `localhost:8888` under the hood

## On Not Refactoring Now: The Mulch Strategy

The current `scripts/rhizome.py` (2078 lines, 21 command handlers) has accumulated technical debt: too many module-level globals, startup-time side effects, mixed concerns (user CLI + programmatic API). We acknowledge this.

**We do not refactor it yet.**

Instead, we grow the service *around* the existing code. The service extracts only what agents need—a clean persona invocation function—and leaves the rest as-is. The wreck becomes mulch:

- The globals stay. They work.
- The startup side effects stay. They're documented.
- The tangled constants stay. They rot in place.

Why? Because **refactoring the whole thing now wastes effort.** We don't yet know what the service's actual needs are. Design the contract first. Extract minimally. Then, when the service has stabilized and other tools depend on it, we can refactor the CLI to match.

This is graceful extraction in practice: build tight now (service wraps the mess), separate cleanly later (when we know the shape of what's clean).

The mulch feeds future growth.

---

## What's NOT in MVP

- Cross-project persona queries (future)
- WebSocket subscriptions (future)
- Rate limiting or auth (assume localhost-only trust)
- Persona caching or optimization
- Load balancing (single instance per project)

---

## Implementation Path

1. **Phase 1:** Create `rhizome_service.py` with Flask/urllib server
   - Single endpoint: `/invoke-persona`
   - Load personae from `.rhizome/personas.d/`
   - Call `ai.py` with persona context
   - Return JSON

2. **Phase 2:** Wire into `scripts/rhizome.py`
   - `rhizome serve` command
   - Lock file management
   - Graceful shutdown

3. **Phase 3:** Update CLI to use service
   - `rhizome persona ...` now shells out to `localhost:8888`
   - Maintains backward compatibility

4. **Phase 4:** VSCode extension connects
   - Discover service via lock file
   - POST to `/invoke-persona`
   - Display response in webview

---

## Open Questions

- [ ] Should the service auto-start or require explicit `rhizome serve`?
- [ ] Where does persona response get logged? Always to `actions.ndjson`? Conditional?
- [ ] How do we handle multiple `.rhizome` projects in a monorepo? (Separate service per root?)
- [ ] What's the shutdown story? Manual? On extension unload?
- [ ] Should `/invoke-persona` be idempotent for logging purposes?

---

## Trade-offs

**Pro:**
- Single clean interface for all consumers
- Sets foundation for distributed agent work
- Persona context stays in one place
- Easy to test (curl the endpoint)

**Con:**
- Additional long-running process
- Port management complexity (though simple with lock file)
- CLI users need service running (mitigated with auto-start)
- Initial overhead vs. direct function calls

---

## Next Steps

1. Clarify auto-start vs. explicit behavior
2. Design `/invoke-persona` schema fully
3. Sketch `rhizome_service.py` scaffold
4. Wire lock file management into startup/shutdown
