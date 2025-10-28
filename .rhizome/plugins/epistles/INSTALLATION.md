# Epistles Plugin: Installation Guide

## For This Repo (Already Done)

Epistles is already set up in `.rhizome/plugins/epistles/`. To enable:

### Step 1: Wire into rhizome.py

Edit `scripts/rhizome.py` and add after the flight_commands registration:

```python
# =====================
# Epistles plugin (portable)
# =====================
try:
    # Add plugin dir to path
    epistle_plugin_path = os.path.join(CTX_DIR, 'plugins', 'epistles')
    if os.path.isdir(epistle_plugin_path) and epistle_plugin_path not in sys.path:
        sys.path.insert(0, epistle_plugin_path)

    from epistles_commands import register_epistle_commands
    register_epistle_commands(sub)
except ImportError as e:
    pass  # Plugin not found; that's OK
```

### Step 2: Test

```bash
python3 scripts/rhizome.py epistle list
# Should show empty list or existing epistles
```

### Step 3: Create your first epistle

```bash
python3 scripts/rhizome.py epistle new \
  --with "PersonaA,PersonaB" \
  --topic "Your conversation topic"
```

---

## For Another Repo (Lift & Drop)

### Step 1: Copy the plugin

```bash
# In source repo
cp -r .rhizome/plugins/epistles /target/repo/.rhizome/plugins/epistles
```

### Step 2: Wire into target's rhizome.py

Same as above — add the plugin registration code.

### Step 3: Test

```bash
cd /target/repo
python3 scripts/rhizome.py epistle list
```

---

## For a Brand New Rhizome (No Existing Plugins)

### Step 1: Create plugin directory structure

```bash
mkdir -p .rhizome/plugins/epistles
```

### Step 2: Copy plugin files

```bash
cp plugin.yaml epistles_commands.py README.md registry.ndjson .rhizome/plugins/epistles/
```

### Step 3: Wire into rhizome.py

Same registration code as above.

### Step 4: Verify

```bash
python3 scripts/rhizome.py epistle list
```

---

## Minimal Install (No Plugin Infrastructure)

If your rhizome doesn't have `plugins/` directory support yet:

### Option A: Copy epistles_commands.py directly into scripts/

```bash
cp .rhizome/plugins/epistles/epistles_commands.py scripts/
```

Then in `scripts/rhizome.py`:

```python
from epistles_commands import register_epistle_commands
register_epistle_commands(sub)
```

### Option B: Inline registration

Copy the `register_epistle_commands()` function directly into rhizome.py.

---

## Troubleshooting

### "epistle: command not found"

**Cause**: `register_epistle_commands()` not called in rhizome.py

**Fix**: Make sure the registration code is before the argument parser runs, and `sys.path` includes the epistles module.

### "registry.ndjson not found"

**Cause**: Registry file missing or in wrong location

**Fix**: Ensure `registry.ndjson` is in `.rhizome/plugins/epistles/` (or wherever you copied the plugin)

### "No module named epistles_commands"

**Cause**: Python can't find the module

**Fix**: Check that sys.path includes the epistles plugin directory:

```python
sys.path.insert(0, os.path.join(CTX_DIR, 'plugins', 'epistles'))
```

### Import path issues across repos

If lifting to another repo and getting import errors, check that:

1. `.rhizome/plugins/epistles/` exists and is readable
2. `epistles_commands.py` is in that directory
3. The sys.path insertion happens **before** the import
4. No conflicting `epistles_commands` module elsewhere in Python path

---

## What Gets Copied

**Core files** (always copy):
- `epistles_commands.py` — CLI logic
- `registry.ndjson` — Epistle index
- `plugin.yaml` — Metadata

**Documentation** (recommended):
- `README.md`
- `INSTALLATION.md` (this file)

**Optional**:
- `context/` — Context docs (can build as you go)
- `templates/` — Epistle templates (future)

---

## Plugin Discovery

The rhizome CLI can auto-discover plugins by:

1. Looking in `.rhizome/plugins/*/plugin.yaml`
2. Reading `name` and `cli_entry_point` fields
3. Dynamically loading and registering

(Future enhancement — not yet implemented)

---

## Uninstall

To remove epistles:

1. Delete `.rhizome/plugins/epistles/` (or just the directory)
2. Remove registration code from `scripts/rhizome.py`
3. Done — no other dependencies

You can always restore it later:

```bash
git checkout .rhizome/plugins/epistles/  # If tracked in git
```
