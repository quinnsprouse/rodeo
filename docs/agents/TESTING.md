# Testing

## Feedback Loop

Use the smallest Verification Profile that proves the change:

| Profile | Command              | Guarantees                                                 |
| ------- | -------------------- | ---------------------------------------------------------- |
| Fast    | `npm run check`      | format, lint, types, unit tests                            |
| Push    | `npm run check:push` | Fast, production build, dead code, Playwright              |
| CI      | `npm run check:ci`   | Push, coverage, clean Starter Journey, React Doctor, audit |

The profiles live in the Vite Task graph in `vite.config.ts`. Cached tasks use explicit inputs so verification also works in restricted agent sandboxes.

## Test Scope

Don't test what static analysis catches. Oxlint + TypeScript own type errors, unused vars, hook deps, formatting. Tests own **runtime behavior through public interfaces**.

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
- The Push and CI profiles exercise the built Nitro server; direct `npm run test:e2e` uses the development server for a fast local loop.
- Capture both `pageerror` events and browser `console.error` messages; assert zero errors at test end.
- Use accessible selectors: `page.getByRole(...)`, `page.getByText(...)`.

## Starter Journey

`npm run test:template` tests the staged distribution artifact in a clean temporary directory. It performs `npm ci`, proves install and hooks do not mutate the distributed tree, exercises portable Edit Feedback, installs Chromium, executes the actual pre-push hook, and boots the production Nitro server.

Stage intended starter changes before running it. Failures preserve the temporary app automatically and write diagnostics to `test-results/starter-journey/`; `KEEP_TEMPLATE_TEST=1` also preserves successful runs.

## Git Hooks

- Vite+ owns `.vite-hooks`; do not add a second hook installer.
- **Pre-commit**: `vp staged` plus advisory React Doctor feedback.
- **Commit-msg**: commitlint enforces Conventional Commits.
- **Pre-push**: `npm run check:push`.

## Dead Code

- `npm run knip` detects unused exports, dependencies, and files; it is part of the Push Profile.
