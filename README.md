# Rodeo 🤠

[rodeo-quinnsprouses-projects.vercel.app](https://rodeo-quinnsprouses-projects.vercel.app)

Wrangle your agents. Steer your stack. Ship with confidence.

An opinionated starter kit for agentic workflows — built on Vite+, TanStack Start, React 19, shadcn/ui, and Tailwind v4. Comes with built-in guardrails so your AI agents write code that actually passes the gate.

Requires Node 24.11 or newer within the Node 24 release line, npm 11.12 or newer within npm 11, and Git 2.36 or newer.

## Quick Start

```bash
npx degit quinnsprouse/rodeo my-app
cd my-app
git init --initial-branch=main
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Git must exist before installation so Vite+ can install the repository hooks. If you install first, run `git init && npm run setup` once afterward.

Before the first push, install Chromium once with `npm run test:e2e:install`.

## Make It Yours

Update `src/config/site.ts` with the product identity and set `VITE_APP_URL` in production for canonical and social metadata. Leaving the URL unset safely omits origin-dependent tags.

## Daily Commands

```bash
npm run dev         # local dev server
npm run check       # format + lint + typecheck + unit tests
npm run check:push  # check + build + dead code + Playwright
npm run check:ci    # push + coverage + template journey + React Doctor + audit
npm run setup       # install hooks after a late git init
npm run lint        # lint only
npm run lint:fix    # auto-fix lint issues
npm run fmt         # format files
npm run fmt:check   # check formatting
npm run test        # unit tests
npm run test:watch  # test watch mode
npm run test:coverage # unit-test coverage report
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
3. `npm run check:ci` runs the **CI Profile**: Push plus coverage, the clean Starter Journey, React Doctor, and dependency audit.

Vite+ owns the Git hook seam:

- **pre-commit**: `vp staged` runs `vp check --fix` on staged files
- **commit-msg**: commitlint enforces Conventional Commits
- **pre-push**: `npm run check:push`

Cached tasks use explicit inputs so they work inside restricted agent sandboxes as well as normal terminals.

## Starter Contract

`npm run test:template` copies the Git index into a temporary Git-less directory, initializes Git, performs a lockfile-exact install, proves setup leaves the distributed tree clean, verifies hooks and commit messages, installs Chromium, executes the real pre-push hook, and boots the production Nitro server. Stage intended template changes first; unrelated untracked work is never copied.

Failures preserve the temporary app and write evidence to `test-results/starter-journey/`. Set `KEEP_TEMPLATE_TEST=1` to preserve successful runs too.

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
- Shareable Claude edit feedback lives in `.claude/settings.json`; personal permissions stay in ignored `.claude/settings.local.json`.

## License

MIT
