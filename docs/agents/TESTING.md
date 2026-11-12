# Testing

Test what a user can observe, end to end. App code has no unit tests. A unit test pins the shape a function has today, so it breaks on every refactor and costs tokens to rewrite.

**Pick the test:**

- For a page or a user journey, write a Playwright test in `e2e/` with the `page` fixture.
- For a server function or HTTP behavior such as a status code, a header, or CSRF, use the `request` fixture. It calls the built server without a browser, as `e2e/security.spec.ts` does.
- For a lint rule, the lint config, or a hook, write a guardrail test in `lint/` or `.agents/hooks/` that runs the real binary.

**Write browser tests this way:**

- Run `npm run test:e2e:install` once. `npm run test:e2e` builds with `--mode e2e`, then tests the built server. It skips the build when nothing changed. `.env.e2e` gives its `VITE_` keys to the build and every other key to that server, so put the test value of a server secret there. To run a second copy at the same time, set `E2E_PORT`.
- Select elements by role or text. Import `test` and `expect` from `e2e/fixtures.ts`, so a test fails on any browser error not in `expectedBrowserErrors`.
- To reach an error that a browser API controls, stub the API with `page.addInitScript` before you load the page.
- To test a streamed skeleton, set a desktop browser `userAgent` on the test. TanStack Router holds a bot's response until the data is ready, and headless Chromium's default user agent counts as a bot. Assert the skeleton through its `label` text, which is in the page while the data loads and gone after.
- `e2e/pages.spec.ts` runs axe and its other checks on every page route, listed or not. Fix an axe violation instead of turning the rule off.
- A server stack trace in a passing run is a bug. The one exception is `Error: aborted` with `ECONNRESET`, which TanStack Start logs when the browser leaves a page before the response starts.

**Keep guardrail tests fast.** Name a guardrail test `*.repo.test.ts` when it reads the repository as it stands, such as which files exist or what a stylesheet declares. The Stop hook runs those after every turn that changes files, so keep each to milliseconds. Every other guardrail test exercises a tool on inputs it writes itself. The Stop hook runs those tests after you change tooling, then skips them until tooling changes again. `toolingPaths` in `scripts/lib/project.mjs` lists the tooling paths. If a tool test reads an app file, add the file there. `npm run check` runs every guardrail test. Start one process for many cases, as `lint/policy.test.ts` does with a single `vp lint` run. Test a hook by calling its handler or rules in process. Start a hook as a process only in `hook-process.test.ts`, which runs a copy inside a fixture so it can't reach this repository.

**The check:** change the internals without changing what a user sees. If the test fails, it tested the implementation.

## Hooks that check your work

- `pre-tool-guard.mjs` blocks edits to generated files, new unit tests, new docs outside the places `scripts/lib/project.mjs` allows, Git hook bypasses, and package managers other than npm. It asks a human before a force push or a command that discards uncommitted work, such as `git checkout .`, `git restore`, or `rm -rf` on files Git can't restore. It reads a command the way a shell does, so a flag inside a commit message or a quoted string doesn't count.
- `post-edit.mjs` formats, lints, and typechecks each file an edit tool writes. Shell edits skip it, so `lint/layout.repo.test.ts` fails the stop check on a doc or unit test in the wrong place.
- `stop-check.mjs` runs before the turn ends and sends you back if a check fails: `vp check` on the files you changed, `tsc -b`, and the guardrail tests your change can break. In a checkout without dependencies or Git hooks, such as a new worktree, it sends you back to run `npm ci` or `npm run setup`.
- Vite+ installs the Git hooks from `.vite-hooks/`. Don't add Husky.

`npm run test:template` runs the whole starter from a clean copy of the staged files. If the copy has the demo, it then removes the demo and runs the push checks again. Then it adds the example feature in `scripts/example-feature/` and runs them a third time. That feature is a server function with a secret behind a streamed, unlisted page, so the run tests those parts together. CI runs it. Stage your changes before you run it locally.
