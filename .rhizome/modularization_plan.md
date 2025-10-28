# RHIZOME Modularization Plan

## Current State

### Root Directory Python Files (6 files - at threshold)
- `__init__.py` (config)
- `ai.py` (145 lines)
- `config.py` (47 lines)
- `flight.py` (86 lines)
- `rhizome_lib.py` (37 lines)
- `web.py` (195 lines)

### scripts/rhizome.py Analysis
- **Total lines**: 2,533
- **Target**: < 100 lines (entry point only)
- **Command functions**: 39 (counted via `grep "^def cmd_"`)

### Command Categories (from analysis)
1. **Action/Recording**: record, link-commit (2 cmds)
2. **Persona**: persona, persona-adopt, persona-init, persona-merge (4 cmds)
3. **Memory**: mem-load, mem-append (2 cmds)
4. **Brand/Display**: brand (1 cmd)
5. **Init/Setup**: init, discovery (2 cmds)
6. **Graph**: graph-config, graph-mirror (2 cmds)
7. **Export**: export (1 cmd)
8. **Watch**: watch, infer (2 cmds)
9. **Flight Plans**: ~15+ flight subcommands (init, propose, add-story, add, start, done, approve, etc.)
10. **Policy**: policy (1 cmd)
11. **Context**: context (1 cmd)
12. **Web**: web (1 cmd - already modularized in web.py)

## Directory Organization Heuristic

**Rule**: Max 7 non-config .py files per directory

### Current Status
- Root has 6 files ✅ (at threshold)
- After adding new modules, will exceed threshold ❌

### Proposed Structure

```
una/                          # Root package
├── __init__.py              # Package init (keep)
├── config.py                # Config/paths (keep)
├── rhizome_lib.py               # Pure helpers (keep)
├── ai.py                    # AI integration (keep)
├── flight.py                # Flight plan data layer (keep)
├── web.py                   # Web UI (keep)
└── commands/                # NEW: Command handlers subpackage
    ├── __init__.py          # Command registry
    ├── actions.py           # record, link-commit
    ├── persona.py           # persona, persona-init, persona-merge, persona-adopt
    ├── memory.py            # mem-load, mem-append
    ├── graph.py             # graph-config, graph-mirror, export
    ├── init.py              # init, discovery
    ├── flight_cli.py        # All flight subcommands
    └── misc.py              # brand, policy, context, watch

scripts/
└── rhizome.py                   # NEW: Lightweight entry point (<100 lines)
                             # Imports from rhizome.commands and delegates
```

## Module Extraction Plan

### Phase 1: Create una/commands/ package structure
1. Create `una/commands/__init__.py` with command registry
2. Define standard command interface/signature

### Phase 2: Extract command functions (preserve order for safety)
1. `una/commands/actions.py` - Extract: write_action, cmd_record, cmd_link_commit
2. `una/commands/persona.py` - Extract: cmd_persona, cmd_persona_adopt, cmd_persona_init, cmd_persona_merge
3. `una/commands/memory.py` - Extract: cmd_mem_load, cmd_mem_append
4. `una/commands/graph.py` - Extract: cmd_graph_config, cmd_graph_mirror, cmd_export
5. `una/commands/init.py` - Extract: cmd_init, cmd_discovery
6. `una/commands/flight_cli.py` - Extract: All cmd_fp_* and flight plan helpers
7. `una/commands/misc.py` - Extract: cmd_brand, cmd_policy, cmd_context, cmd_watch

### Phase 3: Create CLI orchestrator
1. Create `una/cli.py` - Argparse setup and subcommand registration
2. Refactor `scripts/rhizome.py` to be minimal entry point that:
   - Handles path/import setup
   - Calls una.cli.main()
   - Target: < 100 lines

## File Count Verification

### After Refactoring
**Root (una/)**: 6 files ✅
- __init__.py
- config.py
- rhizome_lib.py
- ai.py
- flight.py
- web.py

**una/commands/**: 8 files ⚠️ (exceeds 7 by 1)
- __init__.py (config)
- actions.py
- persona.py
- memory.py
- graph.py
- init.py
- flight_cli.py
- misc.py

### Optimization Option
If strict adherence to 7-file limit is required, combine:
- Merge `memory.py` into `misc.py` (both are small, 2 commands each)
- Result: **7 files** in una/commands/ ✅

## Benefits

1. ✅ scripts/rhizome.py reduced from 2,533 → <100 lines
2. ✅ Clear separation of concerns by command category
3. ✅ Each module is focused and testable
4. ✅ Maintains existing architecture (config, flight, ai, web remain separate)
5. ✅ Follows 7-file directory heuristic (with minor adjustment)
6. ✅ Easy to locate and modify specific commands
7. ✅ Prepares for future MCP server/API extraction

## Testing Strategy

1. ✅ Comprehensive test scaffolding already created (29 tests passing)
2. During refactoring: Run tests after each module extraction
3. After refactoring: Add integration tests for una/commands/ package
4. Verify: All 29+ tests still pass with new structure

## Implementation Notes

- Each extracted module should import only what it needs
- Preserve function signatures and behavior exactly
- Move helper functions with their command handlers
- Update imports in scripts/rhizome.py progressively
- Keep commits small and focused per module
