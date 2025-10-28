# Flight Planning System: Applied Learning

**Last Updated**: 2025-10-27
**Status**: Refactored using don-socratic testing philosophy
**Related Flight Plan**: fp-1761577750

## Context

This document describes how the vscode-rhizome testing philosophy and don-socratic approach have been applied directly to the rhizome flight planning system, creating an implicit foundation for all future tasks.

---

## What Changed

### Before

Flight planning code was embedded within larger modules:
- `flight_commands.py` (1,229 lines) - Mixed concerns: persistence, lifecycle, persona management
- `rhizome.py` (2,600 lines) - Global constants, scattered error handling
- Tests used subprocess invocation; no fixtures or semantic assertions

**Problems**:
- Hard to test individual flight operations
- Repeated patterns for JSON I/O, git operations, error handling
- Test intent unclear; implementation details in assertions
- Difficult to extend without understanding full module

### After

Extracted three core principles into production code and test infrastructure:

#### 1. **Implicit Systems Made Explicit**

Created three pure modules centralizing scattered patterns:

**`git_ops.py`** (Extracted 7 functions)
- Consolidates 15+ `subprocess.run(["git", ...])` calls
- Returns None or (bool, error_msg) instead of raising
- Provides graceful degradation when git unavailable
- Testable without subprocess overhead

**`file_io.py`** (Extracted 12 functions)
- Replaces 8+ duplicated JSON/text read patterns
- Consistent encoding (UTF-8) and error handling
- Auto-creates parent directories
- Returns None on error (caller decides severity)

**`constants.py`** (Extracted 6 Enums + validation lists)
- `FlightStatus`, `FlightPhase`, `StepStatus`, `PersonaMode`, `ApprovalState`, `LogEntryType`
- Replaces string literals scattered across code
- Enables IDE autocomplete and catches typos

#### 2. **Four Testing Patterns from vscode-rhizome**

Created `tests/test_fixtures.py` with:

**TestWorkspace**
- Isolated temp directory per test
- Guaranteed cleanup via context manager
- Methods: init_git(), init_rhizome(), write_json(), read_json(), etc.

**MockRhizome**
- Records commands without executing them
- Enables testing command sequences
- Methods: command(), command_count(), call_sequence(), etc.

**TestAssertions**
- Semantic checks instead of generic assertions
- Names describe intent: flight_is_active(), flight_has_steps(), phase_is()
- Failures include context (expected vs actual)

**TestSetup**
- Factory methods for test scenarios
- Sensible defaults with customization
- Methods: flight_plan(), flight_step(), log_entry()

#### 3. **User-Thinking Test Organization**

Replaced implementation-based test structure with user-thinking categories:

**Happy Path** (9 tests)
- Basic success: create flight, add steps, track phases
- State transitions: step status, phase movement
- Persistence: JSON roundtrip without loss

**Error Paths** (9 tests)
- Missing input: malformed JSON, non-existent files
- Invalid state: bad status values, invalid phases
- Graceful handling: None returns, clean assertions

**Integration** (7 tests)
- Full workflows: create → modify → persist → reload
- Multi-system interaction: personas + phases + steps
- Complex scenarios: approval gates, log entries, transitions

---

## How This Applies to Future Tasks

### For Any New Feature

1. **Understand the current pattern** by reading:
   - RHIZOME_ARCHITECTURE_CORE.md (what exists)
   - TESTING_FRAMEWORKS_AND_FIXTURES.md (how to test)

2. **Write tests first, organized as**:
   - Happy Path: What should work?
   - Error Paths: How should it fail?
   - Integration: How does it fit with existing systems?

3. **Use test fixtures to stay focused**:
   ```python
   def test_new_feature_happy_path(workspace, test_flight):
       # workspace provides isolated I/O
       # test_flight provides default data structure

       fp = test_flight
       # ... test logic ...
       TestAssertions.flight_has_steps(fp, count=3)  # semantic assertion
   ```

4. **Extract reusable patterns** before they scatter:
   - If you call read_json() twice, it's ready in file_io.py
   - If you repeat a git command, it's ready in git_ops.py
   - If you use the same status string 5 times, add it to constants.py

### For Refactoring Existing Code

1. **Apply Dependency Injection**:
   ```python
   # Before: global config
   def do_something():
       config = load_config()
       ...

   # After: passed parameter
   def do_something(config):
       ...
   ```

2. **Extract Pure Functions**:
   ```python
   # Before: mixed concerns
   def record_action():
       # validate, record, mirror, hook
       ...

   # After: separate
   def validate_action(action): ...
   def record_action(action, path): ...
   def mirror_to_graph(action, path): ...
   def run_hooks(action, hooks): ...
   ```

3. **Use Enums Instead of Strings**:
   ```python
   # Before
   if status == "pending" or status == "in_progress":

   # After
   if status in [StepStatus.PENDING, StepStatus.IN_PROGRESS]:
   ```

### For Testing Existing Code

1. **Add Happy Path tests first** - verify success cases work
2. **Add Error Path tests** - ensure graceful degradation
3. **Add Integration tests** - verify multi-system interactions

Example for `cmd_fp_init`:
```python
class TestFlightInitHappyPath:
    def test_init_creates_active_flight(self):
        """flight init should create and activate plan."""
        fp = cmd_fp_init(title="Test")
        TestAssertions.flight_is_active(fp)

class TestFlightInitErrorPaths:
    def test_init_without_title_fails(self):
        """flight init requires title."""
        with pytest.raises(ValueError):
            cmd_fp_init(title=None)

class TestFlightInitIntegration:
    def test_init_sets_active_pointer(self, workspace):
        """flight init should set active.json pointer."""
        fp = cmd_fp_init(title="Test")
        active_id = read_json(ACTIVE_FP_PATH)
        assert active_id == fp["id"]
```

---

## Concrete Example: Flight Phase Transition

### The Old Way (Scattered)

Feature lived in `flight_commands.py` lines 232-320:
- `_transition_phase()` function mixed persistence and state
- Manual JSON reading/writing (duplicated pattern)
- String literals for phase names
- No clear error handling
- No tests (tested via subprocess)

### The New Way (Cohesive)

```python
# 1. Define phases in constants.py
class FlightPhase(str, Enum):
    KITCHEN_TABLE = "kitchen_table"
    GARDEN = "garden"
    LIBRARY = "library"

PHASE_DESCRIPTIONS = {
    FlightPhase.KITCHEN_TABLE: "Strategy & Planning...",
    FlightPhase.GARDEN: "Execution & Evidence...",
    FlightPhase.LIBRARY: "Learning & Synthesis...",
}

# 2. Implement transition function (pure logic)
def transition_phase(plan: dict, new_phase: str) -> dict:
    """Transition flight plan to new phase.

    Returns: Updated plan (no side effects)
    """
    if new_phase not in [p.value for p in FlightPhase]:
        raise ValueError(f"Invalid phase: {new_phase}")

    old_phase = plan["phase"]["current"]
    plan["phase"]["current"] = new_phase
    plan["phase"]["transitions"].append({
        "from": old_phase,
        "to": new_phase,
        "at": now()
    })
    return plan

# 3. Test it three ways
class TestFlightPhaseTransitionHappyPath:
    def test_transition_to_garden(self):
        """Moving from kitchen_table to garden should work."""
        fp = TestSetup.flight_plan(phase="kitchen_table")
        result = transition_phase(fp, "garden")
        TestAssertions.phase_is(result, "garden")
        assert len(result["phase"]["transitions"]) == 1

class TestFlightPhaseTransitionErrorPaths:
    def test_invalid_phase_rejected(self):
        """Invalid phase should raise ValueError."""
        fp = TestSetup.flight_plan()
        with pytest.raises(ValueError):
            transition_phase(fp, "invalid_phase")

class TestFlightPhaseTransitionIntegration:
    def test_full_progression(self):
        """Flight should move through all phases."""
        fp = TestSetup.flight_plan()
        for phase in [FlightPhase.GARDEN, FlightPhase.LIBRARY]:
            fp = transition_phase(fp, phase.value)
        TestAssertions.phase_is(fp, "library")
        assert len(fp["phase"]["transitions"]) == 2
```

**Benefits**:
- Clearer intent (constants, not strings)
- Testable in isolation (pure function)
- Easy to reuse (no side effects)
- Well-documented (docstring matches test)

---

## What's Now Implicit

These patterns are now baked into the system and don't need rediscovery:

### 1. Module Extraction
- **Pattern**: If a pattern repeats 3+ times, extract to pure module
- **Examples**: git operations, file I/O, constant definitions
- **Modules ready**: git_ops.py, file_io.py, constants.py

### 2. Error Handling
- **Pattern**: Return None or (bool, msg) instead of raising
- **Used by**: git_ops, file_io, config loading
- **Benefit**: Caller decides severity (is missing config an error or normal?)

### 3. Dependency Injection
- **Pattern**: Pass context/config as parameters
- **Examples**: ai.py (all params), flight.py (context-free), web.py (deps dict)
- **Benefit**: Enables testing without global state mutation

### 4. Testing Organization
- **Pattern**: Happy → Error → Integration (user thinking, not implementation)
- **Count**: ~50% happy path, ~30% error, ~20% integration
- **Fixtures**: TestWorkspace, MockRhizome, TestAssertions, TestSetup

### 5. Semantic Vocabulary
- **Pattern**: Use Enums for domain terms, not strings
- **Examples**: FlightStatus, FlightPhase, StepStatus, PersonaMode
- **Benefit**: IDE autocomplete, typo detection, clear intent

---

## Files Created/Modified

### New Core Modules
- **git_ops.py** - Git operations (7 functions)
- **file_io.py** - File I/O utilities (12 functions)
- **constants.py** - Enumerations and defaults

### New Test Infrastructure
- **tests/test_fixtures.py** - Four testing patterns (300+ lines)
- **tests/conftest.py** - Pytest configuration
- **tests/test_flight_plan_core.py** - 25 comprehensive tests

### New Documentation
- **RHIZOME_ARCHITECTURE_CORE.md** - System design and principles
- **TESTING_FRAMEWORKS_AND_FIXTURES.md** - How to use test patterns
- **FLIGHT_PLANNING_SYSTEM_APPLIED_LEARNING.md** - This document

---

## Next Steps

### Immediate (Weeks 1-2)
1. Run existing tests with new fixtures; add gaps
2. Refactor flight_commands.py to use git_ops, file_io, constants
3. Extract remaining scattered patterns

### Short-term (Weeks 3-4)
1. Apply testing patterns to other command families
2. Create semantic assertions for personas, config, registry
3. Document common error paths across all commands

### Medium-term (Months 1-3)
1. Implement local REST service architecture (proposed_decision_local_service.md)
2. Convert personas to MCP servers
3. Enable inter-rhizome communication

---

## Key Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Test count | 6 test files | 8 files (6 + 2 new) | +2 |
| Test coverage | Subprocess-based | Unit + integration | Better |
| Extractable patterns | Scattered | Centralized | 3 modules |
| Constants | String literals | Enums | Type-safe |
| Error handling | Vary | Consistent | Predictable |
| Test organization | Implementation-based | User-thinking | Clearer |

---

## References

External documents in `.rhizome/`:
- **TESTING_PHILOSOPHY.md** - Philosophy from vscode-rhizome
- **DON_SOCRATIC_IN_PRACTICE.md** - How don-socratic guided development
- **TESTING_AND_DONQUESTION_REFERENCE.md** - Real code examples
- **persona_stewardship_review_don-socratic.md** - Critical evaluation

Code examples:
- **tests/test_flight_plan_core.py** - Reference implementation
- **git_ops.py** - Git extraction example
- **file_io.py** - File I/O extraction example
- **constants.py** - Enum centralization example
