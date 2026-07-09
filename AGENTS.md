Agent-ready starter kit: Vite+ + TanStack Start + React 19, with shadcn/ui (Base UI), Tailwind v4, and Nitro.

- Toolchain: `vp` (Vite+ CLI) — wraps Vite 8, oxlint, oxfmt, vitest, Rolldown
- Quality gate: `npm run check` (fmt + lint + typecheck + tests)
- Push gate: `npm run check:push` (check + build + dead code + Playwright e2e)
- CI gate: `npm run check:ci` (push + clean template journey + React Doctor + audit)
- React health: `npm run doctor` (react-doctor scan — security, performance, correctness, architecture; also runs on staged files at commit and in CI)
- Dev: `npm run dev` (localhost:3000)
- Build: `npm run build`
- Hook recovery: `npm run setup` (after `git init`)

## Workflow

1. Plan — 2. Execute — 3. Test — 4. Commit

Put disposable experiments and generated inspection output in `.scratch/` or the OS temp directory, never the repository root.

## Commits

Conventional Commits enforced by commitlint. `type(scope): description`. No Co-Authored-By trailers.

## Progressive Disclosure

Open these only when relevant:

- [Domain language](CONTEXT.md) — Starter Journey, Starter Contract, Feedback Loop, and Verification Profiles
- [Architecture decisions](docs/adr/README.md) — load-bearing decisions and the concise ADR format
- [Vite+ Toolchain](docs/agents/VITE_PLUS.md) — `vp` commands, common pitfalls, import conventions
- [TanStack Start Patterns](docs/agents/TANSTACK_START.md) — routing, server functions, type safety
- [Full-stack Example](docs/agents/FULL_STACK_EXAMPLE.md) — executable loader → server function → UI → error flow
- [UI and Motion](docs/agents/UI_MOTION.md) — Tailwind tokens, Motion library, icon imports
- [React Patterns](docs/agents/REACT_PATTERNS.md) — no useEffect, derived state, component design
- [Testing](docs/agents/TESTING.md) — feedback loop, test scope policy, pre-commit guardrails
