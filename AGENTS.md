Agent-ready starter kit: Vite+ + TanStack Start + React 19, with shadcn/ui (Base UI), Tailwind v4, and Nitro.

- Toolchain: `vp` (Vite+ CLI) — wraps Vite 8, oxlint, oxfmt, vitest, Rolldown
- Quality gate: `npm run check` (fmt + lint + typecheck + tests)
- Push gate: `npm run check:push` (check + build + dead code + Playwright e2e)
- CI gate: `npm run check:ci` (push + clean template journey + React Doctor + audit)
- React health: `npm run doctor` (react-doctor scan — security, performance, correctness, architecture; also runs on staged files at commit and in CI)
- React policy: use effects for external synchronization with complete dependencies and cleanup; derive values during render and handle user actions in handlers. Standard React lint rules enforce this where static analysis can.
- Lint policy: warnings fail, inline `oxlint-disable` / `eslint-disable` comments are errors; exceptions go in `lint.overrides` in `vite.config.ts` with a reason
- Fix the cause of a diagnostic; demonstrate a false positive with a minimal example before changing a rule or adding an exception. Prefer built-in rules and compiler checks over custom lint code.
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

- [Architecture decisions](docs/adr/README.md) — load-bearing decisions and the concise ADR format
- [Vite+ Toolchain](docs/agents/VITE_PLUS.md) — `vp` commands, common pitfalls, import conventions
- [TanStack Start Patterns](docs/agents/TANSTACK_START.md) — routing, server functions, and the full-stack example
- [UI and Motion](docs/agents/UI_MOTION.md) — Tailwind tokens, Motion library, icon imports
- [React Patterns](docs/agents/REACT_PATTERNS.md) — effects, derived state, component design
- [Lint Rules](docs/agents/LINT_RULES.md) — what the gate bans, the project `rodeo/*` rules, how to add one
- [Testing](docs/agents/TESTING.md) — feedback loop, test scope policy, pre-commit guardrails
- [Deploy](docs/agents/DEPLOY.md) — Node, Vercel, and Cloudflare Workers targets
