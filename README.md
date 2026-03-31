# Rodeo 🤠

[viteplus-shadcn-starter.vercel.app](https://viteplus-shadcn-starter.vercel.app)

Wrangle your agents. Steer your stack. Ship with confidence.

An opinionated starter kit for agentic workflows — built on Vite+, TanStack Start, React 19, shadcn/ui, and Tailwind v4. Comes with built-in guardrails so your AI agents write code that actually passes the gate.

## Quick Start

```bash
npx degit quinnsprouse/rodeo my-app
cd my-app
cp .npmrc.example .npmrc
# add your HugeIcons Pro token to .npmrc
npm install
vp dev
```

Open [http://localhost:3000](http://localhost:3000).

## Daily Commands

```bash
vp dev              # local dev server
vp check            # format + lint + typecheck (one command)
vp check --fix      # auto-fix format + lint issues
vp test run         # unit tests
vp test watch       # test watch mode
npm run test:e2e    # Playwright smoke tests
npm run check       # vp check + tests
npm run check:push  # check + e2e (same as pre-push hook)
npm run knip        # dead code detection
npm run build       # production build
```

## Feedback Loop

For every non-trivial change:

1. `vp check` (format + lint + typecheck)
2. `vp test run` (unit tests)
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
- [Paper Shaders](https://shaders.paper.design) (background effects)
- Vitest + Testing Library + Playwright

## Key Conventions

- **No direct `useEffect`** — enforced by lint rule. Use `useMountEffect` from `@/hooks` for mount-only sync. See `docs/agents/REACT_PATTERNS.md`.
- **Derive state inline** — don't sync state with effects.
- **Use route loaders** — don't fetch in effects.

## HugeIcons Pro Setup

This repo uses `@hugeicons-pro/core-stroke-rounded`.

1. Get a token from [hugeicons.com](https://hugeicons.com).
2. `cp .npmrc.example .npmrc`
3. Replace `YOUR_TOKEN_HERE` in `.npmrc`.
4. `npm install`

`.npmrc` is gitignored. Never commit tokens.

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
```

## AI Agent Docs

- `AGENTS.md` is the entry point (minimal, links to detailed docs).
- `CLAUDE.md` is symlinked to `AGENTS.md`.
- Detailed guidance lives in `docs/agents/` (Vite+, TanStack, UI/Motion, React patterns, Testing).

## License

MIT
