# Rodeo 🤠

[Live demo](https://userodeo.dev)

A React starter for working with coding agents. Built on Vite+, TanStack Start, React 19, and Tailwind v4, with shadcn/ui configured for Base UI components. Includes Git hooks, tests, and agent docs.

Requires Git 2.36 or newer, and the Node and npm versions `package.json` sets in `devEngines`.

## Quick start

```bash
npx degit quinnsprouse/rodeo my-app
cd my-app
git init --initial-branch=main
npm ci
npm run dev
```

Open the URL `npm run dev` prints.

Initialize Git before installation so Vite+ can install the hooks. If you install first, run `git init && npm run setup` afterward. Before the first push, install Chromium with `npm run test:e2e:install`.

## Customize

Update `src/config/site.ts` with the product identity and page defaults. The e2e tests check the site name, title, and author, so update their expectations in `e2e/` to match.

Each page declares its metadata beside its route, in `staticData.page`, and the sitemap and `llms.txt` list it from there.

Set `VITE_APP_URL` in production. The canonical links, social metadata, structured data, `sitemap.xml`, `robots.txt`, and `llms.txt` use it. Leaving the URL unset omits the origin-dependent tags, and the generated files fall back to the request's origin.

Agents can read every page as Markdown, at `/index.md` or the page path plus `.md`, or by sending `Accept: text/markdown`. `src/server.ts` converts the rendered page.

Add UI components with the configured shadcn CLI. Three motion packages are installed: [Torph](https://torph.lochie.me/) for text that morphs in place, [Skullet](https://skullet.lochie.me/) for loading skeletons drawn from the real component, and [Glimm](https://glimm.dev/) for a shader sweep on milestone moments. See [UI and motion](docs/agents/UI_MOTION.md) for component, styling, icon, and motion conventions.

### Remove the demo

The landing page and the philosophy page are a demo. To start from a blank app, run `node scripts/remove-demo.mjs`, then `npm run check:push`.

The script deletes `src/demo/`, `src/routes/(demo)/`, the `e2e/demo-*.spec.ts` specs, `public/stickers/`, `public/og-rationale.png`, and itself. It removes the demo's references from `src/styles/app.css` and `lint/exceptions.ts`, removes this section from the README, writes a starter home route, and regenerates the route tree. If anything is not where it expects, it changes nothing.

The starter home shows the site name, the tagline, `ThemeToggle`, and a `Snippet` with `npm run dev`. `knip.config.ts` keeps the kit modules the starter doesn't use yet.

## Commands

| Command              | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Development server                                |
| `npm run check`      | Fast checks to run while you work                 |
| `npm run check:push` | Pre-push checks, with the build and browser tests |
| `npm run check:ci`   | CI checks, with a clean template install          |
| `npm run fmt`        | Format files                                      |
| `npm run test:watch` | Guardrail tests in watch mode                     |
| `npm run build`      | Production build                                  |
| `npm run start`      | Run the built Nitro server                        |

`scripts/lib/tasks.mjs` defines each check as a `verify:*` task.

To ship the app to Node, Vercel, or Cloudflare Workers, follow [Deploy](docs/agents/DEPLOY.md).

See [package.json](package.json) for individual commands and [Testing](docs/agents/TESTING.md) for Git hooks, browser tests, and verification of a fresh starter copy.

## Working with agents

[AGENTS.md](AGENTS.md) is the entry point, with links to focused guides. Claude Code (v2.1.277 or newer) and Codex both read it directly. Some Claude Code sessions can't read `AGENTS.md`, for example on Amazon Bedrock. For those, add a `CLAUDE.md` that contains `@AGENTS.md`. [Lint rules](docs/agents/LINT_RULES.md) documents enforcement and how to handle false positives.

Agent hooks in `.agents/hooks/` check tool calls and provide formatting, lint, and type feedback after edits. Claude Code runs them through `.claude/settings.json`. Codex runs them through `.codex/hooks.json` after you trust the project. Keep personal permissions in the ignored `.claude/settings.local.json`.

Optional skills are listed in `skills-lock.json`; restore them with `npm run setup:skills`. The normal install does not fetch skills.

## Layout

- `src/routes/`: TanStack routes
- `src/components/`: application and UI components
- `src/config/`, `src/hooks/`, `src/lib/`, `src/styles/`: site config, hooks, shared logic, and theme
- `src/demo/`: the demo
- `lint/`, `e2e/`: lint rules and verification tests
- `docs/agents/`: implementation guides
- `scripts/`: setup and verification scripts
- `.scratch/`: ignored experiments

## License

[MIT](LICENSE)
