# Rodeo 🤠

[rodeo-quinnsprouses-projects.vercel.app](https://rodeo-quinnsprouses-projects.vercel.app)

Wrangle your agents. Steer your stack. Ship with confidence.

An opinionated starter kit for agentic workflows — built on Vite+, TanStack Start, React 19, shadcn/ui, and Tailwind v4. Comes with built-in guardrails so your AI agents write code that actually passes the gate.

## Quick Start

```bash
npx degit quinnsprouse/rodeo my-app
cd my-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Daily Commands

```bash
npm run dev         # local dev server
npm run check       # format + lint + typecheck + unit tests
npm run lint        # lint only
npm run lint:fix    # auto-fix lint issues
npm run fmt         # format files
npm run fmt:check   # check formatting
npm run test        # unit tests
npm run test:watch  # test watch mode
npm run setup:skills # optional: install recommended agent skills
npm run test:e2e    # Playwright smoke tests
npm run check:push  # check + e2e (same as pre-push hook)
npm run knip        # dead code detection
npm run build       # production build
```

## Feedback Loop

For every non-trivial change:

1. `npm run check` (format + lint + typecheck + unit tests)
2. `npm run test:e2e` (Playwright smoke) for UI changes
3. `npm run build` (before release/push)

Git hooks enforce quality:

- **pre-commit**: `vp staged` runs `vp check --fix` on staged files
- **pre-push**: `npm run check:push` (full gate + Playwright smoke)

## Stack

- [Vite+](https://viteplus.dev) (unified toolchain: Vite 8, Rolldown, oxlint, oxfmt, vitest)
- [TanStack Start](https://tanstack.com/start) (SSR/full-stack React)
- [Nitro](https://nitro.build) (server engine)
- React 19 + TypeScript (strict mode)
- [shadcn/ui](https://ui.shadcn.com) on Base UI primitives
- Tailwind CSS v4
- [Motion](https://motion.dev) (`motion/react`)
- [Hugeicons Free](https://hugeicons.com) icons
- Vitest + Testing Library + Playwright

## Key Conventions

- **No direct `useEffect`** — enforced by lint rule. Use `useMountEffect` from `@/hooks` for mount-only sync. See `docs/agents/REACT_PATTERNS.md`.
- **Derive state inline** — don't sync state with effects.
- **Use route loaders** — don't fetch in effects.

## Optional Agent Skills

Run `npm run setup:skills` after install to restore the recommended skills from `skills-lock.json`.
The default install does not fetch skills automatically, so template installs and Vercel builds stay
fast and predictable.

## Project Layout

```
src/
  routes/       # file-based TanStack routes
  components/   # app + ui components
  hooks/        # custom hooks (useMountEffect, etc.)
  lib/          # shared utils
  styles/       # global styles + theme
e2e/            # Playwright smoke tests
docs/agents/    # progressive disclosure agent docs
scripts/         # local setup scripts
```

## AI Agent Docs

- `AGENTS.md` is the entry point (minimal, links to detailed docs).
- `CLAUDE.md` is symlinked to `AGENTS.md`.
- Detailed guidance lives in `docs/agents/` (Vite+, TanStack, UI/Motion, React patterns, Testing).

## License

MIT
