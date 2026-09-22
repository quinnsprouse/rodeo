# Testing

## Checks

Use the smallest check that proves the change:

| Profile | Command              | Checks                                                           |
| ------- | -------------------- | ---------------------------------------------------------------- |
| Fast    | `npm run check`      | toolchain, format, lint, types, unit tests                       |
| Push    | `npm run check:push` | Fast, production build, dead code, Playwright                    |
| CI      | `npm run check:ci`   | Push, coverage, clean template installation, React Doctor, audit |

The checks live in the Vite Task graph in `vite.config.ts`. Cached tasks use explicit inputs so verification also works in restricted agent sandboxes.

## Test Scope

Don't test what static analysis catches. Oxlint + TypeScript own type errors, unused vars, hook deps, formatting. Tests own **runtime behavior through public interfaces**.

Lint enforcement is the exception: `lint/rules.test.ts` runs each `rodeo/*` rule through the real Oxlint binary, and `lint/policy.test.ts` tests the actual project's configuration with valid and invalid React, TypeScript, and browser code. `.agents/hooks/pre-tool-guard.test.ts` checks every guard decision. These run in `npm run check`.

## Test Design

- Test observable outcomes: rendered UI, returned values, side effects at boundaries.
- Avoid implementation coupling: no internal call counts, no private helper tests, no brittle mocks.
- Use role-based selectors (`getByRole`) over test IDs.
- One assertion focus per test. Separate happy path from edge cases.

## Unit Tests

- Vitest via `npm run test` with jsdom + Testing Library + user-event.
- Import test helpers from `vite-plus/test`.
- Setup in `src/test/setup.ts` runs `cleanup()` after each test.
- Coverage: `npm run test:coverage` (v8, excludes generated files). Vite+ and the coverage provider stay pinned to the same Vitest version.

## E2E Tests

- Playwright with Chromium. Tests in `e2e/`.
- Run `npm run test:e2e:install` once before the first browser test or push.
- All browser tests exercise the built Nitro server. `npm run test:e2e` builds first; Push and CI reuse the build from the task graph.
- `npm run typecheck` includes `e2e/`. Playwright runs TypeScript without checking types.
- Capture both `pageerror` events and browser `console.error` messages; assert zero errors at test end.
- Use accessible selectors: `page.getByRole(...)`, `page.getByText(...)`.
- `e2e/accessibility.spec.ts` runs axe against WCAG 2.2 AA on each page, in the light and the dark theme. It also checks the security headers. Add each new route to it. Fix violations instead of turning off axe rules.

## Clean template test

`npm run test:template` tests the staged files in a clean temporary directory. It performs `npm ci`, checks that installation and hooks leave those files unchanged, exercises post-edit formatting and lint, checks tool-call restrictions, installs Chromium, executes the actual pre-push hook, and boots the production Nitro server.

Stage intended starter changes before running it. Failures preserve the temporary app automatically and write diagnostics to `test-results/starter-journey/`; `KEEP_TEMPLATE_TEST=1` also preserves successful runs.

## Agent Hooks

Claude Code (`.claude/settings.json`) and Codex (`.codex/hooks.json`) run the same scripts from `.agents/hooks/`. Codex loads project hooks only after you trust the project.

- **Before a tool call**: `pre-tool-guard.mjs` denies edits to generated files, and it checks every file in a Codex `apply_patch`. It denies non-npm package managers and Git hook bypasses: `--no-verify` on commit or push, a `core.hooksPath` override, `HUSKY=0`, and `VITE_GIT_HOOKS=0`. It asks a human before a force push or a destructive Git command. `--force-with-lease` passes.
- The guard matches raw command text, so it also blocks a shell heredoc that only mentions a banned flag. Write that content with the file tools instead.
- **After a write**: `post-edit.mjs` formats each edited file, lints it, and typechecks TypeScript. Lint errors appear in the hook output immediately.
- Edits made through shell commands skip the post-edit hook. The Stop hook and the commit hook still check them.
- **Before the agent ends its turn**: `stop-check.mjs` checks the files changed since the last commit. It runs `vp check` on those files, an incremental `tsc -b`, and `vp test run --changed` in parallel, then sends the agent back with the errors if one fails.

The Stop hook's cost follows the size of the change, not the size of the project:

- If the working tree matches the last state that passed, the hook exits after a few `git` calls. A turn that only answers a question costs about 0.2 seconds.
- `vp test run --changed` runs only the tests whose imports reach a changed file. Changes to `package.json`, the Vite configs, `lint/`, or `.agents/hooks/` run every test, because those tests start their subjects as processes instead of importing them (`forceRerunTriggers` in `vitest.config.ts`).
- The production build and the Playwright tests stay in the pre-push gate.
- If the agent retries without changing anything, the hook lets the turn end and tells the user the check still fails, instead of looping.

Keep new tests fast enough for this loop. A test that starts a process per case should run its cases with `it.concurrent`, as `lint/policy.test.ts` does.

## Git Hooks

- Vite+ owns `.vite-hooks`; do not add a second hook installer.
- **Pre-commit**: `vp staged` plus advisory React Doctor feedback.
- **Commit-msg**: commitlint enforces Conventional Commits.
- **Pre-push**: `npm run check:push`.

## Dead Code

- `npm run knip` detects unused exports, dependencies, and files; it runs in `npm run check:push`.
