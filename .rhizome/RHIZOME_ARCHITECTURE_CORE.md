# Rhizome Core Architecture

**Last Updated**: 2025-10-27
**Status**: Refined from analysis of implicit patterns (don-socratic testing philosophy applied)

## Overview

Rhizome consists of three architectural layers:

1. **Pure Modules** - Dependency-free, reusable utilities
2. **Core Services** - Configuration, flight planning, persona management
3. **CLI Layer** - User-facing commands and workflows

Each layer is designed to be testable, replaceable, and composable.

## Layer 1: Pure Modules

Extracted from implicit patterns in the codebase; zero repo dependencies.

### `git_ops.py` - Git Operations

Centralizes all git interactions with graceful error handling and timeouts.

**Functions** (extracted to replace scattered `subprocess.run(["git", ...])` calls):
- `git_root(path)` - Find repository root
- `git_user(path)` - Get configured user name
- `git_branch(path)` - Current branch
- `git_current_commit(path)` - Short commit hash
- `git_add_files(paths, cwd)` - Stage files
- `git_commit(message, cwd)` - Create commit
- `git_status_porcelain(cwd)` - Machine-readable status
- `is_in_git_repo(path)` - Check git availability

**Design Pattern**: Return `None` or `(bool, error_msg)` instead of raising; allows callers to handle gracefully.

### `file_io.py` - File I/O Utilities

Consolidates JSON, text, and line-based file operations.

**Functions** (extracted to replace 8+ duplicated read/write patterns):
- `read_json(path)` - Parse JSON with fallback
- `write_json(path, data)` - Serialize with auto-mkdir
- `read_text(path)` - Read entire file
- `write_text(path, content, append=False)` - Write with auto-mkdir
- `read_lines(path)` - Read as list, trailing newlines removed
- `append_line(path, line)` - Append line safely
- `read_ndjson(path)` - Read newline-delimited JSON
- `append_ndjson(path, obj)` - Append JSON line
- `file_exists(path)`, `dir_exists(path)`, `ensure_dir(path)` - Path checks

**Design Pattern**: Return `None` on missing/malformed files; no exceptions for normal failure paths.

### `constants.py` - Enumerations and Defaults

Central definitions for semantic constants (replacing string duplications).

**Classes**:
- `FlightStatus` - proposed, active, completed, done, archived
- `FlightPhase` - kitchen_table, garden, library
- `StepStatus` - pending, in_progress, done
- `PersonaMode` - guide, advocate, witness, executor, challenger, balance, reasoner, skeptic
- `ApprovalState` - pending, approved, rejected
- `LogEntryType` - note, action, commit, revision, phase_transition, etc.
- `AIProvider` - openai, ollama, auto

**Dictionaries**:
- `PHASE_DESCRIPTIONS` - Human-readable phase meanings
- `DEFAULT_PERSONAS` - Standard persona list
- `DEFAULT_CONFIG` - Configuration defaults
- Validation lists: `VALID_FLIGHT_STATUSES`, `VALID_PHASES`, etc.

**Design Pattern**: Enums enable IDE autocomplete; validation lists catch typos early.

---

## Layer 2: Core Services

Built on pure modules; encapsulate domain logic.

### `config.py` - Configuration Management

**Hierarchy** (highest to lowest priority):
1. CLI flags (`--provider`, `--model`)
2. Environment variables (`OPENAI_API_KEY`, `RHIZOME_OLLAMA_BASE_URL`)
3. `.env` file (auto-loaded at startup)
4. Local repo config (`.rhizome/config.json`)
5. Global user config (`~/.rhizome/config.json`)

**Key Functions**:
- `load_config()` - Merge hierarchy into single dict
- `get_config_value(key)` - Query with fallback
- `set_config_value(key, value, global=False)` - Persist to file
- `unset_config_value(key, global=False)` - Remove key

**Paths** (all computed from git root or `RHIZOME_CTX_DIR` env var):
- `CTX_DIR` - Context directory (`.rhizome/` or legacy `.rhizome/`)
- `RHIZOME_FLIGHT_DIR` - `CTX_DIR/flight_plans/`
- `ARCHIVE_DIR` - `CTX_DIR/flight_plans/archive/`
- `ACTIVE_FP_PATH` - Pointer to active flight plan
- `PERSONA_*` paths - Persona fragment directories
- `CONFIG` paths - Global and local config files

### `flight.py` - Flight Plan Persistence

**Core Data Structure**:
```json
{
  "id": "fp-1693456789",
  "title": "Add Authentication",
  "requester": "hallie",
  "status": "active|proposed|completed",
  "steps": [{"id": 1, "title": "...", "status": "..."}],
  "phase": {"current": "kitchen_table|garden|library", ...},
  "personas": {"active": [...], "conducting": "...", "voices": {...}},
  "approval": {"state": "pending|approved", "by": "...", "at": "..."},
  "log": [{"ts": "...", "type": "note|action|commit|...", "data": {...}}],
  "sprouts": [...]
}
```

**Key Functions**:
- `new_id()` - Generate timestamp-based ID
- `path_for(id)` / `archive_path(id)` - Compute file paths
- `load(id)` / `save(plan)` - JSON persistence
- `set_active(id)` / `load_active()` - Track active plan pointer
- `step_by_id(plan, step_id)` - Query step
- `list_summaries()` - All plans with metadata

### `ai.py` - Provider-Agnostic AI Integration

Supports OpenAI and Ollama with auto-detection and fallback.

**Key Functions**:
- `ollama_available(base_url)` - Health check
- `ai_suggest(query, context, config, provider="auto")` - Get suggestions
- `ai_query(query, config, provider="auto")` - Direct queries

**Design Pattern**: All config passed as parameter; no global state. Enables injection for testing.

### `personas.py` - Hierarchical Persona Loading

Three-level cascade:
1. Flight plan level (`.rhizome/flight_plans/*/personas.d/`)
2. Repo level (`.rhizome/personas.d/`)
3. User level (`~/.rhizome/personas.d/`)

**Key Class**: `PersonaRegistry`
- Loads YAML persona definitions
- Cascades with later levels overriding earlier
- Provides persona text with fallback

### `registry.py` - Inter-Rhizome Discovery

Central registry at `~/.rhizome/registry.json` for filesystem-wide rhizome discovery.

**Key Functions**:
- `discover_rhizomes()` - Scan filesystem for `.rhizome/` dirs
- `register_rhizome()` - Add to central registry
- `load_registry()` / `save_registry()` - Persistence

---

## Layer 3: CLI Layer

User-facing commands; delegates to core services.

### `scripts/rhizome.py` - Main Entrypoint

**Structure**:
- Argparse setup for 40+ commands
- `cmd_*` handler functions
- Global state initialization (loaded once at startup)

**Command Categories**:
- Lifecycle: `init`, `export`, `help`
- Recording: `record` (with 20+ arguments)
- Personas: `persona`, `persona-commands`
- Queries: `query`, `run`
- Configuration: `config get/set/unset`
- Registry: `registry init/refresh/list`

**Rough Edges** (identified from code review):
- Global constants (CTX_DIR, ACTIONS_PATH, etc.) at module level
- Record command argument explosion (20+ orthogonal options)
- Silent error handling in action recording

### `scripts/flight_commands.py` - Flight Plan Commands

**Structure**:
- 40+ `_fp_*` helper functions
- 30+ `cmd_fp_*` handler functions
- `register_flight_commands()` - Argparse registration

**Command Groups**:
- Lifecycle: init, propose, approve, finish, archive, unshelve
- Steps: add, add-batch, start, done
- Display: list, show, render, scaffold
- Advanced: commit, revise, note, compress
- Persona/Phase: phase, sprout, personas

**Data Flow**:
1. Parse CLI arguments
2. Load active flight plan (or create new)
3. Modify plan state in memory
4. Save to JSON
5. Mirror to graph, log, and hooks
6. Return JSON output to stdout

---

## Implicit Systems (Now Explicit)

### 1. Action Recording Pipeline

Actions flow through multiple channels:
```
write_action()
  → actions.ndjson (local)
  → docs/una_graph/edges.ndjson (graph mirror)
  → Active flight plan log (if one exists)
  → Hook scripts (if defined)
```

**Non-blocking**: Failures in any channel don't stop others.

### 2. Dependency Injection Pattern

Core modules accept config/context as parameters:

```python
# Good: testable
ai_suggest(query, context, config)
attach_web_subcommand(subparsers, deps={...})

# Bad: uses global state
ai_suggest(query, context)  # reads config internally
```

**Benefit**: Enables testing without global state mutation.

### 3. Error Handling Strategy

Pattern varies by context:

| Context | Pattern | Rationale |
|---------|---------|-----------|
| Config loading | Return None | Missing config is normal |
| Git operations | Return (bool, error_msg) | Graceful degradation |
| File I/O | Return None | Fallback or skip available |
| CLI handlers | Raise + exit code | User sees clear error |

### 4. JSON-First Output

All commands output JSON on success:
```python
print(json.dumps({"ok": True, ...}, ensure_ascii=False))
```

**Benefits**:
- Agent/script consumption
- Deterministic testing
- Piping to `jq` for filtering

---

## Testing Architecture

### Pure Module Testing

Use `tests/test_fixtures.py` patterns:
- `TestWorkspace` - Isolated temp directories
- `TestAssertions` - Semantic checks (what, not how)
- `TestSetup` - Factory builders

### Integration Testing

Three categories per feature:
1. **Happy Path** - Everything works correctly
2. **Error Paths** - Invalid inputs fail gracefully
3. **Integration** - Multiple components work together

### Behavioral Testing

Run actual CLI via subprocess (no mocking):
```python
result = subprocess.run(
    ["python3", "scripts/rhizome.py", "flight", "list"],
    capture_output=True,
    text=True
)
```

**Benefit**: Tests actual user experience, not implementation.

---

## Design Principles

### 1. Small, Clear, Reversible Steps

Each function does one thing; easy to reason about and test.

### 2. Dependency Injection Over Globals

Pass context/config as parameters; easier to test, compose, and mock.

### 3. Graceful Degradation

Return None/empty on failure rather than raising; caller decides severity.

### 4. Semantic Vocabulary

Use enums and constants for domain terms; prevents typos and enables IDE support.

### 5. Explicit Over Implicit

Extract patterns into modules; don't hide complexity in helper functions.

### 6. Data Flow Clarity

Show how data flows through pipeline: parse → load → modify → save → output.

---

## Future Directions

### Phase 1: Service Architecture
Convert to local REST service (proposed in rhizome_architecture_decision_local_service.md):
- HTTP server at localhost:XXXX
- Personas as request handlers
- CLI becomes client
- Enable VSCode extension integration

### Phase 2: MCP Federation
Personas become MCP servers; enable inter-rhizome communication and distributed agents.

### Phase 3: Enhanced Testing
Extend test fixtures to cover all command categories; add performance benchmarks.

---

## Quick Reference

| Need | Location | Pattern |
|------|----------|---------|
| Git operations | `git_ops.py` | Returns None or (bool, msg) |
| File I/O | `file_io.py` | Returns None on error |
| Status/phase values | `constants.py` | Use Enums |
| Flight persistence | `flight.py` | JSON with helper functions |
| Configuration | `config.py` | Hierarchical merge |
| AI queries | `ai.py` | Injection pattern |
| Test isolation | `test_fixtures.py` | TestWorkspace context manager |
| Semantic tests | `test_fixtures.py` | TestAssertions static methods |
| Test data | `test_fixtures.py` | TestSetup factories |