# Revised Modularization Strategy

## Problem with Original Plan
- Risk of creating new monolithic "catch-all" modules (e.g., `actions.py`, `misc.py`)
- Moving 39 command handlers just relocates the problem
- Commands/ subpackage would have 8 files (exceeds 7-file limit)

## Better Approach: Thin Commands + Focused Modules

### Principle
**Command handlers should be thin wrappers around business logic modules.**

Keep `cmd_*()` functions in rhizome.py but extract their implementation details to focused modules.

### What to Extract

#### 1. Flight Plan CLI (BIGGEST WIN)
- **Problem**: 15+ flight subcommands in rhizome.py (~800+ lines)
- **Solution**: Extract to `flight_commands.py`
- **Why**: Well-bounded subsystem with clear interface
- **Result**: Removes ~30% of rhizome.py

#### 2. Persona System (WELL-DEFINED)
- **Problem**: Persona merge logic, adoption, initialization scattered
- **Solution**: Extract to `persona_system.py`
- **Why**: Clear subsystem with file I/O, merging logic
- **Result**: Removes ~200 lines from rhizome.py

#### 3. Action Recording (FOCUSED UTILITY)
- **Problem**: `write_action()` has complex logic (graph mirroring, hooks, flight log)
- **Solution**: Extract to `action_recorder.py`
- **Why**: Single focused responsibility, reusable
- **Result**: Cleaner command handlers

#### 4. Export System (FOCUSED UTILITY)
- **Problem**: Export logic handles multiple formats/types
- **Solution**: Extract to `exporters.py`
- **Why**: Well-defined I/O operations
- **Result**: ~100 lines removed

### What to KEEP in rhizome.py

- All `cmd_*()` function signatures (thin wrappers)
- Argparse setup and subparser definitions
- Main entry point
- Simple commands (brand, policy, etc.)

### Revised File Count

**Root (una/)**: 10 files (exceeds 7 by 3, but manageable)
- __init__.py
- config.py (existing)
- rhizome_lib.py (existing)
- ai.py (existing)
- flight.py (existing - data layer)
- web.py (existing)
- **NEW**: flight_commands.py (~500 lines)
- **NEW**: persona_system.py (~250 lines)
- **NEW**: action_recorder.py (~150 lines)
- **NEW**: exporters.py (~100 lines)

**scripts/**: 1 file
- rhizome.py (~700 lines after extraction, down from 2533)

### Benefits

1. ✅ rhizome.py reduced by ~70% (2533 → ~700 lines)
2. ✅ Each new module has single, clear purpose
3. ✅ No catch-all modules
4. ✅ Command signatures stay in rhizome.py (easy to find)
5. ✅ Business logic properly separated
6. ✅ Tests can target specific modules
7. ✅ Manageable violation of 7-file limit (10 vs 7)

### Implementation Order

1. Extract flight_commands.py (biggest impact)
2. Extract persona_system.py (second biggest)
3. Extract action_recorder.py (improves multiple commands)
4. Extract exporters.py (cleanup)
5. Verify all tests pass
6. Update CLAUDE.md

### Alternative: Stricter 7-File Adherence

If we must stay under 7 files, combine:
- Merge action_recorder.py + exporters.py → `io_operations.py`
- Result: 9 files (still over but closer)

Or use subpackage:
```
una/
├── core/  (config, rhizome_lib, ai, flight, web - 5 files)
├── commands/  (flight_commands, persona_system - 2 files)
├── io/  (action_recorder, exporters - 2 files)
```

But this adds complexity. Recommend accepting 10 files given they're all focused.
