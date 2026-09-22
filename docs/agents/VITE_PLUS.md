# Vite+ Toolchain

The project-installed `vp` CLI wraps Vite 8, Rolldown, Vitest, Oxlint, Oxfmt, and Vite Task.

Use the [package scripts](../../package.json) for development and verification. The usual tool commands are `vp dev`, `vp check`, `vp fmt`, `vp lint`, and `vp test`; use `--help` for their options.

## Import Convention

Import configuration from `vite-plus` and test helpers from `vite-plus/test`:

```tsx
import { defineConfig } from "vite-plus";
import { describe, expect, it } from "vite-plus/test";
```

## Verification Tasks

Fast, Push, and CI profiles are defined under `run.tasks` in `vite.config.ts`. Package scripts, hooks, and CI call those profiles instead of rebuilding the command sequence.

Keep cached verification tasks on explicit `input` globs. Vite Task's automatic file tracer may be unavailable in restricted agent sandboxes, and broad directory tracing makes disposable files invalidate otherwise reusable results.

Include custom lint rules, hook scripts and tests, and tool configuration in those globs. With explicit inputs, changes to omitted files cannot invalidate a cached pass. The fast profile runs `scripts/check-toolchain.mjs` to catch incompatible version pins before lint or tests run.

Run verification through the `npm run check*` scripts. The verification adapter keeps caching enabled normally and retries without cache only when a restricted sandbox blocks Vite Task communication.

## Pitfalls

- Vite+ bundles its own Vitest, currently Vitest 5. `vitest`, `@vitest/coverage-v8`, and the `vitest` override must match that exact version. `scripts/check-toolchain.mjs` fails until every pin matches.
- To update Vite+, run `vp migrate` on a branch. It updates the pins and rewrites imports that moved.
- Don't install oxlint, oxfmt, `@oxlint/plugins`, or tsdown directly. Import the lint plugin API from `vite-plus/lint/plugins`.
- The jest-dom matcher types come from `@testing-library/jest-dom/vitest`. The root `@testing-library/jest-dom` entry types Jest instead.
- `vp dev` runs the Vite dev server, not a `package.json` script. Use `vp run dev` for custom scripts.
- `vp vitest` / `vp oxlint` don't exist — use `vp test` / `vp lint`.
- Run coverage through `npm run test:coverage`; the coverage provider is pinned to Vite+'s Vitest version.

See [Testing](TESTING.md#git-hooks) for Git hook installation and staged checks.
