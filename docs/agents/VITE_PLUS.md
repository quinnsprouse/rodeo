# Vite+ Toolchain

`vp` is the global CLI wrapping Vite 8, Rolldown, Vitest, Oxlint, Oxfmt, and Vite Task.

## Commands

| Task                      | Command                          |
| ------------------------- | -------------------------------- |
| Dev server                | `vp dev`                         |
| Format + lint + typecheck | `vp check` (`--fix` to auto-fix) |
| Format                    | `vp fmt`                         |
| Lint                      | `vp lint`                        |
| Tests                     | `vp test run`                    |
| Cached task               | `vp run <task>`                  |
| Build                     | `vp build`                       |
| Add dependency            | `vp add <pkg>`                   |
| One-off binary            | `vp dlx <pkg>`                   |
| Tool versions             | `vp --version`                   |

## Import Convention

Import configuration from `vite-plus` and test helpers from `vite-plus/test`:

```tsx
import { defineConfig } from "vite-plus";
import { describe, expect, it } from "vite-plus/test";
```

## Verification Tasks

Fast, Push, and CI profiles are defined under `run.tasks` in `vite.config.ts`. Package scripts, hooks, and CI call those profiles instead of rebuilding the command sequence.

Keep cached verification tasks on explicit `input` globs. Vite Task's automatic file tracer may be unavailable in restricted agent sandboxes, and broad directory tracing makes disposable files invalidate otherwise reusable results.

## Pitfalls

- Do not install Vitest, oxlint, oxfmt, or tsdown directly — Vite+ bundles them.
- `vp dev` runs the Vite dev server, not a `package.json` script. Use `vp run dev` for custom scripts.
- Use `vp dlx` instead of `npx`.
- `vp vitest` / `vp oxlint` don't exist — use `vp test` / `vp lint`.
- Run coverage through `npm run test:coverage`; its small wrapper corrects Vite+ 0.1.x version metadata before loading the matching coverage provider.

## Pre-commit

`vp config --hooks-dir .vite-hooks` installs the sole Git hook adapter. `vp staged` runs `vp check --fix` on staged files using the `staged` configuration in `vite.config.ts`.
