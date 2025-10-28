# Testing Frameworks and Fixtures

**Last Updated**: 2025-10-27
**Status**: Extracted from vscode-rhizome; applied to flight plan core

Reference documents:
- `.rhizome/TESTING_PHILOSOPHY.md` - Design principles
- `.rhizome/DON_SOCRATIC_IN_PRACTICE.md` - How don-socratic guided development
- `.rhizome/TESTING_AND_DONQUESTION_REFERENCE.md` - Real code examples

## Overview

Rhizome tests follow a **user-thinking model** rather than implementation structure:

1. **Happy Path** - What should happen when everything works?
2. **Error Paths** - How does it fail gracefully?
3. **Integration** - Do all pieces work together?

This mirrors how users actually experience the system.

---

## Four Core Patterns

### Pattern 1: TestWorkspace

Isolated temporary directories with guaranteed cleanup.

```python
from tests.test_fixtures import TestWorkspace

def test_flight_plan_persists():
    with TestWorkspace() as ws:
        # Unique temp dir automatically created
        config_path = ws.path / ".rhizome" / "config.json"

        ws.write_json(config_path, {"key": "value"})
        assert ws.read_json(config_path) == {"key": "value"}

        # Automatic cleanup when exiting context
```

**Key Methods**:
- `ws.path` - Path to workspace (pathlib.Path object)
- `ws.init_git()` - Initialize git repo with test user
- `ws.init_rhizome()` - Create .rhizome directory structure
- `ws.write_json(path, data)` - Write JSON with auto-mkdir
- `ws.read_json(path)` - Read JSON, return None if missing
- `ws.write_text(path, content)` - Write text file
- `ws.read_text(path)` - Read text file
- `ws.file_exists(path)`, `ws.dir_exists(path)` - Path checks

**Benefits**:
- Each test is isolated; temp dirs cleaned automatically
- No interference between tests
- No need for manual setup/teardown

### Pattern 2: MockRhizome

Record commands without actually executing them.

```python
from tests.test_fixtures import MockRhizome

def test_command_sequence():
    mock = MockRhizome()

    # Record commands that "would be" executed
    mock.command("flight init --title 'Test'")
    mock.command("flight add --title 'Step 1'")
    mock.command("flight done --step-id 1")

    # Verify sequence
    assert mock.command_count() == 3
    assert "flight init" in mock.last_command()
    assert mock.call_sequence([
        "flight init",
        "flight add",
        "flight done"
    ])
```

**Key Methods**:
- `mock.command(cmd, response="")` - Record command execution
- `mock.command_count()` - How many commands recorded
- `mock.last_command()` - Last command (or None)
- `mock.all_commands()` - List all commands in order
- `mock.was_called_with(pattern)` - Check substring match
- `mock.call_sequence(patterns)` - Verify order

**Benefits**:
- Tests logic without external dependencies
- Verify command sequences without I/O
- Fast execution (no subprocess overhead)

### Pattern 3: TestAssertions

Semantic assertions that explain what's being tested.

```python
from tests.test_fixtures import TestAssertions

def test_flight_state():
    fp = load_flight_plan()

    # Generic: unclear what matters
    assert fp["status"] == "active"
    assert len(fp["steps"]) == 3
    assert "una" in fp["personas"]["active"]

    # Semantic: explains user intent
    TestAssertions.flight_is_active(fp)
    TestAssertions.flight_has_steps(fp, count=3)
    TestAssertions.persona_active(fp, "una")
```

**Key Methods**:
- `flight_is_active(fp)` - Status is "active"
- `flight_has_steps(fp, count)` - Exact step count
- `step_status_is(fp, step_id, status)` - Step has status
- `all_steps_done(fp)` - All steps completed
- `phase_is(fp, phase)` - In expected phase
- `persona_active(fp, name)` - Persona in active list
- `approval_is(fp, state)` - Approval has state
- `has_log_entry_type(fp, type)` - Log contains type

**Benefits**:
- Tests read like specifications
- Failures include context (expected vs actual)
- Easy to scan test intent without implementation details

### Pattern 4: TestSetup

Factory methods for building test scenarios with sensible defaults.

```python
from tests.test_fixtures import TestSetup

def test_flight_workflow():
    # Simple: 3 steps, all defaults
    fp = TestSetup.flight_plan(
        title="Auth System",
        steps=3
    )

    # Complex: custom phase, personas, approval
    fp = TestSetup.flight_plan(
        title="Complex Work",
        requester="alice",
        phase="garden",
        personas=["una", "bro"],
        require_approval=True,
        steps=5
    )

    # Build log entry
    entry = TestSetup.log_entry(
        entry_type="note",
        data={"text": "Discovered edge case"}
    )
    fp["log"].append(entry)
```

**Key Methods**:
- `TestSetup.flight_plan(title, requester, status, steps, phase, personas, require_approval)` - Build flight plan
- `TestSetup.flight_step(step_id, title, status)` - Build single step
- `TestSetup.log_entry(entry_type, data)` - Build log entry

**Benefits**:
- Reduce boilerplate in tests
- Ensure consistent structure
- Support customization when needed

---

## Test Organization by User Thinking

### Happy Path Tests

"What should happen when everything works?"

```python
class TestFlightPlanHappyPath:
    """Tests where operations succeed with valid inputs."""

    def test_create_flight_with_default_structure(self):
        """A new flight plan should have all required fields."""
        fp = TestSetup.flight_plan(title="Add Auth")
        assert fp["title"] == "Add Auth"
        assert fp["status"] == "active"
        assert fp["id"].startswith("fp-")

    def test_flight_persists_to_json(self, workspace):
        """Flight plan should serialize to JSON without loss."""
        fp = TestSetup.flight_plan(title="Persist Test", steps=2)
        fp_path = workspace.path / ".rhizome" / "flight_plans" / "fp-test.json"

        assert write_json(fp_path, fp)
        loaded = read_json(fp_path)
        assert loaded == fp

    def test_steps_can_transition_to_done(self):
        """Step status should transition correctly."""
        fp = TestSetup.flight_plan(steps=1)
        step = fp["steps"][0]

        step["status"] = "in_progress"
        TestAssertions.step_status_is(fp, 1, "in_progress")
```

**Characteristics**:
- Valid inputs, expected outputs
- Focus on single responsibility
- Verify structure and relationships
- Use sensible defaults

**Count**: ~50% of test suite

### Error Path Tests

"How does it fail gracefully?"

```python
class TestFlightPlanErrorPaths:
    """Tests where operations fail or receive invalid inputs."""

    def test_missing_json_file_returns_none(self, workspace):
        """Reading non-existent JSON file should return None."""
        path = workspace.path / "missing.json"
        result = read_json(path)
        assert result is None

    def test_malformed_json_file_returns_none(self, workspace):
        """Reading malformed JSON should return None."""
        path = workspace.path / "bad.json"
        workspace.write_text(path, "{invalid json}")
        result = read_json(path)
        assert result is None

    def test_invalid_phase_rejected(self):
        """Setting invalid phase should not persist."""
        fp = TestSetup.flight_plan()
        original = fp["phase"]["current"]

        fp["phase"]["current"] = "invalid_phase"
        assert fp["phase"]["current"] != original

    def test_nonexistent_step_id_detected(self):
        """Querying non-existent step should fail cleanly."""
        fp = TestSetup.flight_plan(steps=1)

        with pytest.raises(AssertionError):
            TestAssertions.step_status_is(fp, step_id=999, status="done")
```

**Characteristics**:
- Invalid/missing inputs
- Boundary conditions
- Graceful degradation
- Error state validation

**Count**: ~30% of test suite

### Integration Tests

"Do all pieces work together?"

```python
class TestFlightPlanIntegration:
    """Tests where multiple components interact."""

    def test_complete_flight_lifecycle(self, workspace):
        """Full lifecycle: create → step → phase → log → persist."""
        fp = TestSetup.flight_plan(title="Complete", steps=2)

        # Add log entry
        entry = TestSetup.log_entry(
            entry_type="note",
            data={"text": "Started work"}
        )
        fp["log"].append(entry)

        # Transition step
        fp["steps"][0]["status"] = "in_progress"

        # Transition phase
        fp["phase"]["current"] = "garden"

        # Persist
        fp_path = workspace.path / ".rhizome" / "flight_plans" / "lifecycle.json"
        assert write_json(fp_path, fp)

        # Load and verify
        loaded = read_json(fp_path)
        TestAssertions.phase_is(loaded, "garden")
        TestAssertions.step_status_is(loaded, 1, "in_progress")
        TestAssertions.has_log_entry_type(loaded, "note")

    def test_phase_transitions_recorded(self):
        """Moving through phases should record transitions."""
        fp = TestSetup.flight_plan()

        # Kitchen Table → Garden
        fp["phase"]["current"] = "garden"
        fp["phase"]["transitions"].append({
            "from": "kitchen_table",
            "to": "garden",
            "at": "2025-10-27T12:05:00Z"
        })

        # Garden → Library
        fp["phase"]["current"] = "library"
        fp["phase"]["transitions"].append({
            "from": "garden",
            "to": "library",
            "at": "2025-10-27T13:00:00Z"
        })

        TestAssertions.phase_is(fp, "library")
        assert len(fp["phase"]["transitions"]) == 2
```

**Characteristics**:
- Multiple systems working together
- Multi-step workflows
- State persistence and recovery
- Full round-trip verification

**Count**: ~20% of test suite

---

## Using Fixtures in Tests

### Pytest Fixtures

Make fixtures available automatically via `conftest.py`:

```python
# tests/conftest.py
import pytest
from test_fixtures import TestWorkspace, MockRhizome, TestSetup

@pytest.fixture
def workspace():
    """Provide isolated test workspace."""
    with TestWorkspace() as ws:
        yield ws

@pytest.fixture
def mock_rhizome():
    """Provide mock Rhizome recorder."""
    return MockRhizome()

@pytest.fixture
def test_flight():
    """Provide default flight plan."""
    return TestSetup.flight_plan(steps=3)
```

### Using in Tests

```python
def test_flight_with_fixtures(workspace, mock_rhizome, test_flight):
    # workspace is TestWorkspace instance
    # mock_rhizome is MockRhizome instance
    # test_flight is flight plan dict with 3 steps

    fp_path = workspace.path / "fp.json"
    workspace.write_json(fp_path, test_flight)

    mock_rhizome.command("flight load --id fp-123")
    assert mock_rhizome.command_count() == 1
```

---

## Running Tests

### All tests
```bash
pytest tests/ -v
```

### Specific test class
```bash
pytest tests/test_flight_plan_core.py::TestFlightPlanHappyPath -v
```

### Specific test
```bash
pytest tests/test_flight_plan_core.py::TestFlightPlanHappyPath::test_create_flight_with_default_structure -v
```

### With coverage
```bash
pytest tests/ --cov=. --cov-report=html
```

---

## Adding Tests

### For a New Feature

1. Create test class in `tests/test_<feature>.py`
2. Organize by Happy/Error/Integration
3. Use TestSetup for defaults
4. Use TestAssertions for clarity
5. Use workspace fixture for I/O

**Example**:
```python
class TestNewFeatureHappyPath:
    def test_basic_success(self):
        """Feature should work with valid inputs."""
        ...

    def test_with_custom_options(self):
        """Feature should support customization."""
        ...

class TestNewFeatureErrorPaths:
    def test_missing_input_handled(self):
        """Feature should handle missing input gracefully."""
        ...

    def test_invalid_option_rejected(self):
        """Feature should reject invalid options."""
        ...

class TestNewFeatureIntegration:
    def test_with_other_features(self):
        """Feature should work with existing system."""
        ...
```

---

## Design Principles

### 1. Test User Experience, Not Implementation

❌ **Bad** - Tests implementation details
```python
def test_json_parsing():
    with open(path) as f:
        data = json.load(f)
    assert data["key"] == value
```

✅ **Good** - Tests user-facing behavior
```python
def test_flight_persists_correctly(workspace):
    fp = TestSetup.flight_plan(title="Test")
    save_flight(fp, workspace.path)
    loaded = load_flight(workspace.path)
    assert loaded == fp
```

### 2. Semantic > Generic Assertions

❌ **Bad** - Generic assertions; intent unclear
```python
assert fp["status"] == "active"
assert len(fp["steps"]) == 3
```

✅ **Good** - Semantic assertions; intent clear
```python
TestAssertions.flight_is_active(fp)
TestAssertions.flight_has_steps(fp, count=3)
```

### 3. Isolation > Shared Setup

❌ **Bad** - Shared test state
```python
@pytest.fixture(scope="module")
def shared_workspace():
    ws = TestWorkspace()
    yield ws
    # Cleanup might be skipped if test fails
```

✅ **Good** - Per-test isolation
```python
def test_something(workspace):  # fixture scope="function" (default)
    # Unique workspace created and cleaned up per test
```

### 4. Factories > Bare Objects

❌ **Bad** - Manual construction
```python
fp = {
    "id": "fp-123",
    "title": "Test",
    "status": "active",
    "steps": [],
    "log": [],
    "phase": {"current": "kitchen_table", ...},
    "personas": {...},
    # ... 10 more fields
}
```

✅ **Good** - Factory with defaults
```python
fp = TestSetup.flight_plan(title="Test")
```

---

## Common Test Patterns

### Pattern: Test Workflow

```python
def test_complete_workflow(workspace):
    """Test multi-step workflow."""
    # Setup
    fp = TestSetup.flight_plan(title="Workflow", steps=3)

    # Execute steps
    for i, step in enumerate(fp["steps"], 1):
        step["status"] = "in_progress"
        # ... do work ...
        step["status"] = "done"

    # Verify
    TestAssertions.all_steps_done(fp)
```

### Pattern: Test with Alternatives

```python
def test_flight_with_different_personas(self):
    """Test should work with any persona combination."""
    personas_to_test = [
        ["una"],
        ["una", "bro"],
        ["una", "bro", "root"]
    ]

    for personas in personas_to_test:
        fp = TestSetup.flight_plan(personas=personas)
        for p in personas:
            TestAssertions.persona_active(fp, p)
```

### Pattern: Test State Transitions

```python
def test_flight_phase_progression(self):
    """Flight should move through phases in order."""
    fp = TestSetup.flight_plan()

    phases = ["kitchen_table", "garden", "library"]
    for phase in phases:
        fp["phase"]["current"] = phase
        TestAssertions.phase_is(fp, phase)
```

---

## Debugging Tests

### Print fixture contents
```python
def test_something(workspace):
    print(f"Workspace path: {workspace.path}")
    print(f"Files: {list(workspace.path.glob('**/*'))}")
```

### Run single test with output
```bash
pytest tests/test_flight_plan_core.py::TestFlightPlanHappyPath::test_create_flight_with_default_structure -v -s
```

### Show fixtures available
```bash
pytest --fixtures tests/
```

---

## References

- **TESTING_PHILOSOPHY.md** - Why these patterns work
- **DON_SOCRATIC_IN_PRACTICE.md** - How questioning guides test design
- **test_fixtures.py** - Implementation of all four patterns
- **test_flight_plan_core.py** - Real examples of all three categories