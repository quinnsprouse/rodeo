Agent-ready starter kit: Vite+ + TanStack Start + React 19, with shadcn/ui (Base UI), Tailwind v4, and Nitro.

- Toolchain: `vp` (Vite+ CLI) — wraps Vite 8, oxlint, oxfmt, vitest, Rolldown
- Quality gate: `npm run check` (fmt + lint + typecheck + tests)
- Push gate: `npm run check:push` (check + Playwright e2e)
- Dev: `vp dev` (localhost:3000)
- Build: `npm run build`

## Workflow

1. Plan — 2. Execute — 3. Test — 4. Commit

## Commits

Conventional Commits enforced by commitlint. `type(scope): description`

## Progressive Disclosure

Open these only when relevant:

- [Vite+ Toolchain](docs/agents/VITE_PLUS.md) — `vp` commands, common pitfalls, import conventions
- [TanStack Start Patterns](docs/agents/TANSTACK_START.md) — routing, server functions, type safety
- [UI and Motion](docs/agents/UI_MOTION.md) — Tailwind tokens, Motion library, icon imports
- [React Patterns](docs/agents/REACT_PATTERNS.md) — no useEffect, derived state, component design
- [Testing](docs/agents/TESTING.md) — feedback loop, test scope policy, pre-commit guardrails
