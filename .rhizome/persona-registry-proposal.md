# Persona Registry System Proposal

**Status:** Proposed
**Context:** vscode-rhizome + 1cc course template need to share personas
**Recorded in:** rhizome repo (una/.rhizome/)

---

## Problem

When you clone a template (like 1cc course or vscode-rhizome extension), it has comments/guidance referencing specific personas (e.g., `don-socratic`).

But those personas don't travel with the clone. The new instance has no `.rhizome/personas.d/don-socratic.yml`.

**Result:** Questions reference a persona the user doesn't have. Context is lost.

---

## Solution: Decentralized Registry in Rhizome Repo

### Architecture

**1. Rhizome Repo Structure**
```
/Users/hallie/Documents/repos/tools/una/
├── personas/
│   └── registry/
│       ├── don-socratic.yml
│       ├── dev-guide.yml
│       ├── code-reviewer.yml
│       ├── ux-advocate.yml
│       └── README.md
├── README.md
└── ... (existing rhizome structure)
```

**2. Template Manifest**
Templates declare needed personas:
```json
// .rhizome/personas.required.json (in template)
{
  "required_personas": [
    "don-socratic",
    "dev-guide"
  ],
  "registry": "https://github.com/Unity-Environmental-University/una"
}
```

**3. Fetch Command**
```bash
# Pull a persona from the registry
rhizome persona-fetch --from-registry don-socratic

# Pull all required personas (reads manifest)
rhizome persona-fetch --from-manifest
```

**4. How It Works**

a) User clones template:
```bash
git clone https://github.com/Unity-Environmental-University/course-template-1credit.git
cd course-template-1credit
```

b) Init rhizome:
```bash
rhizome init
```

c) Fetch required personas:
```bash
rhizome persona-fetch --from-manifest
# Reads .rhizome/personas.required.json
# Clones/pulls from registry
# Installs don-socratic, dev-guide locally
```

d) Template questions are now contextualized!

---

## Contributing New Personas

**Anyone can propose a persona:**

1. Fork rhizome repo
2. Add `personas/registry/my-persona.yml` with:
   ```yaml
   name: my-persona
   role: <role>
   description: <description>
   modes:
     - <mode1>
     - <mode2>
   voice: <voice excerpt>
   ```
3. PR to rhizome
4. On merge, it's in the registry
5. Templates can now reference it

---

## Benefits

✅ **Decentralized**: Anyone contributes personas
✅ **Canonical**: Rhizome repo is source of truth
✅ **Portable**: Templates self-document dependencies
✅ **Discoverable**: Registry is public and browsable
✅ **No Duplication**: Don't re-define personas per template
✅ **Evolving**: Personas can be updated in registry; templates pick up improvements

---

## Open Questions

- [ ] Where should registry live? (personas/registry/ in una repo? Separate repo?)
- [ ] Versioning? Can templates pin to specific persona versions?
- [ ] Authentication for private personas?
- [ ] How to validate persona YAML schema?
- [ ] Cache strategy? (fetch once, or always latest?)
- [ ] Should `rhizome persona-list` show registry personas too?

---

## Implementation Phases

**Phase 1 (MVP):**
- Add `personas/registry/` to rhizome repo
- Implement `rhizome persona-fetch --from-registry <name>`
- Create `personas.required.json` format

**Phase 2:**
- `rhizome persona-fetch --from-manifest`
- Registry validation + schema
- Documentation + contribution guide

**Phase 3:**
- Versioning + pinning
- Integration with `rhizome init` (auto-fetch required personas)
- Web UI for browsing registry

---

## Example: vscode-rhizome Adoption

```json
// .rhizome/personas.required.json
{
  "required_personas": [
    "don-socratic",
    "dev-guide",
    "code-reviewer",
    "ux-advocate"
  ],
  "registry": "https://github.com/Unity-Environmental-University/una"
}
```

User clones vscode-rhizome:
```bash
git clone <vscode-rhizome-repo>
cd vscode-rhizome
rhizome init
rhizome persona-fetch --from-manifest
# ✅ All 4 personas installed
# ✅ Comments now make sense
# ✅ Chorus is ready to guide development
```

---

## Next Steps

1. ✅ Record proposal in rhizome repo (DONE)
2. [ ] Create `personas/registry/` directory structure in rhizome
3. [ ] Migrate existing personas to registry
4. [ ] Implement `persona-fetch` command
5. [ ] Create `personas.required.json` spec
6. [ ] Document contribution workflow
7. [ ] Update vscode-rhizome and 1cc templates to use it

