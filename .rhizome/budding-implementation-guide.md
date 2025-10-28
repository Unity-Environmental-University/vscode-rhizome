# Budding Implementation Guide

**From the rhizome conductor:** Once a component is decided for budding, follow this pattern.

## Phase 1: Monorepo-Live (Growth)

```
tools/rhizome/
├── src/
│   └── lib/
│       ├── rhizomeBackend.ts      (abstract interface)
│       ├── cliBackend.ts          (implementation)
│       ├── mcpBackend.ts          (future implementation)
│       └── types.ts               (shared types)
├── tsconfig.json
│   "paths": {
│     "@rhizome/lib/*": ["./src/lib/*"]
│   }
└── .rhizome/
```

All tools import via alias:
```typescript
import { RhizomeBackend } from '@rhizome/lib/rhizomeBackend';
```

## Phase 2: At Critical Mass

When the library is:
- ✓ Stable (API not changing every week)
- ✓ Tested (unit tests passing)
- ✓ Used by multiple projects (vscode-rhizome + future tools)
- ✓ Documented (README, API docs)

Then bud it:

```
@rhizome/lib/
├── src/
│   ├── rhizomeBackend.ts
│   ├── cliBackend.ts
│   ├── mcpBackend.ts
│   ├── types.ts
│   └── index.ts (barrel export)
├── dist/ (built JS)
├── package.json ("name": "@rhizome/lib", "version": "1.0.0")
├── tsconfig.json
└── README.md
```

## Phase 3: Post-Bud

Importing tool updates package.json:
```json
{
  "dependencies": {
    "@rhizome/lib": "^1.0.0"
  }
}
```

But **the import path stays the same:**
```typescript
import { RhizomeBackend } from '@rhizome/lib/rhizomeBackend';
```

tsconfig.json path alias can be removed (but doesn't have to be).

## Budding Checklist

- [ ] Isolate component in `src/lib/` with clear boundaries
- [ ] All imports use `@rhizome/lib/*` alias
- [ ] Zero imports from outside the component (except types)
- [ ] Unit tests exist and pass
- [ ] API is stable (no planned breaking changes)
- [ ] Used by at least 2 projects
- [ ] Document: why this component? What problem does it solve?
- [ ] Extract to separate repo
- [ ] Publish to npm (or private registry)
- [ ] Update all downstream projects to `npm install @rhizome/lib`
- [ ] Delete `src/lib/` from monorepo, verify imports still work

## This Is Rhizome's Metabolism

**Budding is how rhizome grows.** Components that prove themselves stable and useful separate cleanly. Components that are experimental stay together. The framework doesn't ossify—it evolves.

The network beneath—unchanged.
