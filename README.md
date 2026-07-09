# Rodeo 🤠

[rodeo-quinnsprouses-projects.vercel.app](https://rodeo-quinnsprouses-projects.vercel.app)

Wrangle your agents. Steer your stack. Ship with confidence.

An opinionated starter kit for agentic workflows — built on Vite+, TanStack Start, React 19, shadcn/ui, and Tailwind v4. Comes with built-in guardrails so your AI agents write code that actually passes the gate.

## Quick Start

```bash
npx degit quinnsprouse/rodeo my-app
cd my-app
git init
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Git must exist before installation so Vite+ can install the repository hooks. If you install first, run `git init && npm run setup` once afterward.

## Daily Commands

```bash
npm run dev         # local dev server
npm run check       # format + lint + typecheck + unit tests
npm run check:push  # check + build + dead code + Playwright
npm run check:ci    # push + template journey + React Doctor + audit
npm run setup       # install hooks after a late git init
npm run lint        # lint only
npm run lint:fix    # auto-fix lint issues
npm run fmt         # format files
npm run fmt:check   # check formatting
npm run test        # unit tests
npm run test:watch  # test watch mode
npm run test:coverage # coverage without Vite+ version-noise
npm run test:template # verify the staged template in a clean copy
npm run setup:skills # optional: install recommended agent skills
npm run test:e2e    # Playwright smoke tests
npm run knip        # dead code detection
npm run doctor      # React security, performance, and architecture
npm run build       # production build
```

## Feedback Loop

Verification is defined once as a cached Vite Task graph:

1. `npm run check` runs the **Fast Profile**: format, lint, types, and unit tests.
2. `npm run check:push` runs the **Push Profile**: Fast plus build, Knip, and Playwright.
3. `npm run check:ci` runs the **CI Profile**: Push plus the clean Starter Journey, React Doctor, and dependency audit.

Vite+ owns the Git hook seam:

- **pre-commit**: `vp staged` runs `vp check --fix` on staged files
- **commit-msg**: commitlint enforces Conventional Commits
- **pre-push**: `npm run check:push`

Cached tasks use explicit inputs so they work inside restricted agent sandboxes as well as normal terminals.

## Starter Contract

`npm run test:template` copies the Git index into a temporary Git-less directory, initializes Git, performs a real install, verifies hooks and commit messages, then executes the real pre-push hook. Stage intended template changes first; unrelated untracked work is never copied.

Set `KEEP_TEMPLATE_TEST=1` to preserve the temporary app for investigation.

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
docs/adr/       # concise load-bearing decisions
scripts/         # local setup scripts
.scratch/        # ignored disposable experiments
```

## AI Agent Docs

- `AGENTS.md` is the entry point (minimal, links to detailed docs).
- `CLAUDE.md` is symlinked to `AGENTS.md`.
- `CONTEXT.md` defines the Starter Journey, Starter Contract, Feedback Loop, and Verification Profiles.
- Detailed guidance lives in `docs/agents/`; load-bearing decisions live in `docs/adr/`.

## License

MIT
