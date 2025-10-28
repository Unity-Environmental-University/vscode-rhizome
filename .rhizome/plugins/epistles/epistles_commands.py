"""
Epistles Plugin: Letter-based persona conversations with context & tooling

Commands available:
  rhizome epistle new --with persona1 persona2 --topic "..." [--prompted-by fp-123] [--context file.md file2.md]
  rhizome epistle list [--filter persona_name] [--since 2025-10-28]
  rhizome epistle show [epistle_id_or_name]
  rhizome epistle search [--topic keyword] [--personas p1,p2] [--date-range start-end]
  rhizome epistle add-context [epistle_id] [--context file.md] [--ref link_to_epistle]
"""

import os
import json
import sys
import time
from pathlib import Path

# Import persona advocate system for power-user commands
try:
    from epistolary.advocate import register_advocate_commands
except ImportError:
    register_advocate_commands = None


# Placeholder for context - these will be set by rhizome.py when loading the plugin
EPISTLE_ROOT = None
REPO_ROOT = None
CTX_DIR = None


def _epistle_path():
    """Get epistles directory"""
    if EPISTLE_ROOT:
        return EPISTLE_ROOT
    return os.path.join(os.path.dirname(__file__))


def _registry_path():
    """Get registry.ndjson path"""
    return os.path.join(_epistle_path(), 'registry.ndjson')


def _load_registry():
    """Load all epistles from registry"""
    registry_file = _registry_path()
    epistles = []
    if os.path.exists(registry_file):
        try:
            with open(registry_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        epistles.append(json.loads(line))
        except Exception as e:
            print(f"Error loading registry: {e}", file=sys.stderr)
    return epistles


def _save_registry(epistles):
    """Save epistles to registry"""
    registry_file = _registry_path()
    try:
        with open(registry_file, 'w', encoding='utf-8') as f:
            for ep in epistles:
                f.write(json.dumps(ep, ensure_ascii=False) + '\n')
    except Exception as e:
        print(f"Error saving registry: {e}", file=sys.stderr)


def cmd_epistle_new(args):
    """Create a new epistle"""
    personas = args.with_personas.split(',') if args.with_personas else []
    if len(personas) < 2:
        print("Error: Need at least 2 personas (--with persona1,persona2)", file=sys.stderr)
        sys.exit(1)

    timestamp = time.strftime("%Y%m%dT%H%M%S")
    epistle_id = f"epistle-{int(time.time())}"
    persona_slug = "_".join([p.lower().replace(" ", "-") for p in personas])
    filename = f"{persona_slug}_{timestamp}.md"
    epistle_dir = Path(_epistle_path())
    counter = 0
    unique_filename = filename
    while (epistle_dir / unique_filename).exists():
        counter += 1
        unique_filename = f"{persona_slug}_{timestamp}_{counter}.md"
    filename = unique_filename

    epistle = {
        "id": epistle_id,
        "date": time.strftime("%Y-%m-%d"),
        "personas": personas,
        "topic": args.topic or "Untitled",
        "prompted_by": args.prompted_by or None,
        "file": filename,
        "status": "draft",
        "references": [],
        "context": args.context or [],
        "keywords": args.keywords.split(',') if args.keywords else []
    }

    # Create epistle file with template
    epistle_file = os.path.join(_epistle_path(), filename)
    _write_epistle_template(epistle_file, epistle)

    # Add to registry
    epistles = _load_registry()
    epistles.append(epistle)
    _save_registry(epistles)

    print(json.dumps(epistle, indent=2, ensure_ascii=False))
    print(f"\nEpistle created: {epistle_file}")


def _write_epistle_template(path, epistle):
    """Write epistle template"""
    content = f"""# Epistle: {' ↔ '.join(epistle['personas'])}

**ID**: {epistle['id']}
**Date**: {epistle['date']}
**Topic**: {epistle['topic']}
**Prompted by**: {epistle['prompted_by'] or 'self-initiated'}
**Status**: {epistle['status']}

## Context

{_render_context(epistle.get('context', []))}

## Dialog

**{epistle['personas'][0]}:**
[Waiting for first message...]

**{epistle['personas'][1]}:**
[Response...]

## Outcome / Conclusions

[To be filled as conversation develops]

## Related Files & References

- Registry entry: {epistle['id']}
- Previous epistles: [add links here]
- Implementation: [if applicable]

"""
    try:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
    except Exception as e:
        print(f"Error writing epistle: {e}", file=sys.stderr)


def _render_context(context_files):
    """Render context section from file references"""
    if not context_files:
        return "[No context documents attached yet. Use `rhizome epistle add-context` to add them.]"

    lines = ["**Referenced documents:**\n"]
    for cf in context_files:
        lines.append(f"- {cf}")
    return "\n".join(lines)


def cmd_epistle_list(args):
    """List epistles"""
    epistles = _load_registry()

    # Filter by persona if requested
    if args.filter:
        epistles = [e for e in epistles if args.filter.lower() in [p.lower() for p in e.get('personas', [])]]

    # Filter by date if requested
    if args.since:
        epistles = [e for e in epistles if e.get('date', '0000-00-00') >= args.since]

    print(f"\n{len(epistles)} epistle(s):\n")
    for ep in sorted(epistles, key=lambda x: x.get('date', ''), reverse=True):
        personas = ', '.join(ep.get('personas', []))
        status = ep.get('status', 'unknown')
        print(f"  {ep['id']:20} | {ep['date']} | {personas:40} | {status:8} | {ep['topic'][:50]}")


def cmd_epistle_show(args):
    """Show a specific epistle"""
    epistles = _load_registry()
    target = args.epistle_id.lower()

    # Find by ID or filename
    epistle = None
    for ep in epistles:
        if ep['id'].lower() == target or ep['file'].lower().startswith(target):
            epistle = ep
            break

    if not epistle:
        print(f"Epistle '{args.epistle_id}' not found", file=sys.stderr)
        sys.exit(1)

    epistle_file = os.path.join(_epistle_path(), epistle['file'])
    if os.path.exists(epistle_file):
        try:
            with open(epistle_file, 'r', encoding='utf-8') as f:
                print(f.read())
        except Exception as e:
            print(f"Error reading epistle: {e}", file=sys.stderr)
    else:
        print(f"Epistle file not found: {epistle_file}", file=sys.stderr)


def cmd_epistle_search(args):
    """Search epistles"""
    epistles = _load_registry()

    # Filter by topic
    if args.topic:
        epistles = [e for e in epistles if args.topic.lower() in e.get('topic', '').lower()]

    # Filter by personas
    if args.personas:
        search_personas = [p.strip().lower() for p in args.personas.split(',')]
        epistles = [e for e in epistles if any(p.lower() in search_personas for p in e.get('personas', []))]

    # Filter by keywords
    if args.keywords:
        keywords = set(args.keywords.split(','))
        epistles = [e for e in epistles if any(k.lower() in [kw.lower() for kw in e.get('keywords', [])] for k in keywords)]

    print(f"\n{len(epistles)} epistle(s) found:\n")
    for ep in epistles:
        print(f"  {ep['id']} | {ep.get('topic', 'Untitled')[:60]}")


def cmd_epistle_add_context(args):
    """Add context documents to an epistle"""
    epistles = _load_registry()
    target = args.epistle_id.lower()

    epistle = None
    for ep in epistles:
        if ep['id'].lower() == target:
            epistle = ep
            break

    if not epistle:
        print(f"Epistle '{args.epistle_id}' not found", file=sys.stderr)
        sys.exit(1)

    # Add context files
    if args.context:
        for ctx_file in args.context:
            if ctx_file not in epistle.get('context', []):
                if 'context' not in epistle:
                    epistle['context'] = []
                epistle['context'].append(ctx_file)

    # Save updated registry
    _save_registry(epistles)
    print(json.dumps(epistle, indent=2, ensure_ascii=False))
    print(f"\nContext added to {epistle['id']}")


def register_epistle_commands(sub, ctx_dir=None, repo_root=None):
    """Register all epistle commands with rhizome's argument parser

    Args:
        sub: argparse subparsers object
        ctx_dir: Context directory path (optional, for persona_advocate)
        repo_root: Repository root path (optional, for persona_advocate)
    """
    global CTX_DIR, REPO_ROOT

    # Set context for advocate system
    if ctx_dir:
        CTX_DIR = ctx_dir
    if repo_root:
        REPO_ROOT = repo_root

    # Also set in persona_advocate module if available
    if 'persona_advocate' in sys.modules:
        sys.modules['persona_advocate'].CTX_DIR = CTX_DIR
        sys.modules['persona_advocate'].REPO_ROOT = REPO_ROOT

    p_epistle = sub.add_parser("epistle", help="Persona epistles: letters & conversations with reasoning preserved")
    epistle_sub = p_epistle.add_subparsers(dest="epistle_cmd", required=True)

    # epistle new
    ep_new = epistle_sub.add_parser("new", help="Create a new epistle between personas")
    ep_new.add_argument("--with", dest="with_personas", required=True, help="Personas (comma-separated)")
    ep_new.add_argument("--topic", required=True, help="Epistle topic")
    ep_new.add_argument("--prompted-by", help="Flight plan or event that prompted this")
    ep_new.add_argument("--context", action="append", help="Context files to attach (repeatable)")
    ep_new.add_argument("--keywords", help="Keywords (comma-separated)")
    ep_new.set_defaults(func=cmd_epistle_new)

    # epistle list
    ep_list = epistle_sub.add_parser("list", help="List all epistles in registry")
    ep_list.add_argument("--filter", help="Filter by persona name")
    ep_list.add_argument("--since", help="Only show epistles since date (YYYY-MM-DD)")
    ep_list.set_defaults(func=cmd_epistle_list)

    # epistle show
    ep_show = epistle_sub.add_parser("show", help="Display a specific epistle")
    ep_show.add_argument("epistle_id", help="Epistle ID or filename")
    ep_show.set_defaults(func=cmd_epistle_show)

    # epistle search
    ep_search = epistle_sub.add_parser("search", help="Search epistles")
    ep_search.add_argument("--topic", help="Search by topic keyword")
    ep_search.add_argument("--personas", help="Filter by personas (comma-separated)")
    ep_search.add_argument("--keywords", help="Filter by keywords (comma-separated)")
    ep_search.set_defaults(func=cmd_epistle_search)

    # epistle add-context
    ep_context = epistle_sub.add_parser("add-context", help="Add context documents to an epistle")
    ep_context.add_argument("epistle_id", help="Epistle ID")
    ep_context.add_argument("--context", action="append", help="Context file to attach (repeatable)")
    ep_context.set_defaults(func=cmd_epistle_add_context)

    # Register persona power-user (advocate) commands if available
    if register_advocate_commands:
        try:
            register_advocate_commands(epistle_sub)
        except Exception as e:
            print(f"Warning: Could not register persona advocate commands: {e}", file=sys.stderr)
