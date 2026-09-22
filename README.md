# Rodeo 🤠

[Live demo](https://rodeo-quinnsprouses-projects.vercel.app)

A React starter for working with coding agents. Built on Vite+, TanStack Start, React 19, and Tailwind v4, with shadcn/ui configured for Base UI components. Includes Git hooks, tests, and agent docs.

Requires Node 24.11 or newer within Node 24, npm 11.12 or newer within npm 11, and Git 2.36 or newer.

## Quick start

```bash
npx degit quinnsprouse/rodeo my-app
cd my-app
git init --initial-branch=main
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Initialize Git before installation so Vite+ can install the hooks. If you install first, run `git init && npm run setup` afterward. Before the first push, install Chromium with `npm run test:e2e:install`.

## Customize

Update `src/config/site.ts` with the product identity and set `VITE_APP_URL` in production for canonical and social metadata. Leaving the URL unset omits origin-dependent tags.

Add UI components with the configured shadcn CLI. See [UI and motion](docs/agents/UI_MOTION.md) for component, styling, and icon conventions.

### Remove the demo

The landing page is a demo. To start from a blank app:

1. Replace `src/routes/index.tsx` with your home route. To keep a server-function example, keep `src/lib/starter-status.ts`. Otherwise, delete it and its test.
2. Delete `src/components/rotating-word.tsx`, `terminal-demo.tsx`, and `wordmark.tsx`, plus `public/fonts/Yellowtail-Regular.ttf`.
3. In `src/styles/app.css`, remove the Yellowtail `@font-face`, `--font-script`, the `--color-terminal*` and `--shadow-terminal` tokens, and the shimmer styles. In `src/routes/__root.tsx`, remove the Yellowtail preload.
4. Uninstall the demo packages: `npm uninstall penflow calligraph`.
5. Update `src/config/site.ts`, `public/og-image.png`, and the demo assertions in `e2e/smoke.spec.ts`.

Then run `npm run check:push`. Knip reports any file, export, or package that only the demo used.

## Commands

| Command              | Purpose                                                                     |
| -------------------- | --------------------------------------------------------------------------- |
| `npm run dev`        | Development server on port 3000                                             |
| `npm run check`      | Toolchain alignment, formatting, lint, types, and unit tests                |
| `npm run check:push` | Check, production build, dead code, and browser tests                       |
| `npm run check:ci`   | Push checks, coverage, clean template installation, React Doctor, and audit |
| `npm run fmt`        | Format files                                                                |
| `npm run test:watch` | Unit tests in watch mode                                                    |
| `npm run build`      | Production build                                                            |
| `npm run start`      | Run the built Nitro server                                                  |

To ship the app to Node, Vercel, or Cloudflare Workers, follow [Deploy](docs/agents/DEPLOY.md).

See [package.json](package.json) for individual commands and [Testing](docs/agents/TESTING.md) for Git hooks, browser tests, and verification of a fresh starter copy.

## Working with agents

[AGENTS.md](AGENTS.md) is the entry point, with links to focused guides. Claude Code (v2.1.277 or newer) and Codex both read it directly. Some Claude Code sessions can't read `AGENTS.md`, for example on Amazon Bedrock. For those, add a `CLAUDE.md` that contains `@AGENTS.md`. [Lint rules](docs/agents/LINT_RULES.md) documents enforcement and how to handle false positives.

Agent hooks in `.agents/hooks/` check tool calls and provide formatting, lint, and type feedback after edits. Claude Code runs them through `.claude/settings.json`. Codex runs them through `.codex/hooks.json` after you trust the project. Keep personal permissions in the ignored `.claude/settings.local.json`.

Optional skills are listed in `skills-lock.json`; restore them with `npm run setup:skills`. The normal install does not fetch skills.

## Layout

- `src/routes/`: TanStack routes and the full-stack example
- `src/components/`: application and UI components
- `src/hooks/`, `src/lib/`, `src/styles/`: hooks, shared logic, and theme
- `lint/`, `e2e/`: custom rules and verification tests
- `docs/agents/`: implementation guides
- `docs/adr/`: architecture decisions
- `scripts/`: setup and verification scripts
- `.scratch/`: ignored experiments

## License

[MIT](LICENSE)
