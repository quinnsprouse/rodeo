# Testing

## Feedback Loop

Run in order for non-trivial changes:

1. `npm run check` (format + lint + typecheck + unit tests)
2. `npm run test:e2e` (Playwright smoke) — for UI changes
3. `npm run build` — for release-critical changes

`npm run check:push` = check + Playwright smoke.

## Test Scope

Don't test what static analysis catches. Oxlint + TypeScript own type errors, unused vars, hook deps, formatting. Tests own **runtime behavior through public interfaces**.

## Test Design

- Test observable outcomes: rendered UI, returned values, side effects at boundaries.
- Avoid implementation coupling: no internal call counts, no private helper tests, no brittle mocks.
- Use role-based selectors (`getByRole`) over test IDs.
- One assertion focus per test. Separate happy path from edge cases.

## Unit Tests

- Vitest via `npm run test` with jsdom + Testing Library + user-event.
- Setup in `src/test/setup.ts` runs `cleanup()` after each test.
- Coverage: `npm run test:coverage` (v8, excludes generated files).

## E2E Tests

- Playwright with Chromium. Tests in `e2e/`.
- Capture `pageerror` events and assert zero errors at test end.
- Use accessible selectors: `page.getByRole(...)`, `page.getByText(...)`.

## Git Hooks

- **Pre-commit**: `vp staged` → `vp check --fix` on staged files.
- **Pre-push**: `npm run check:push` → full quality gate.

## Dead Code

- `npm run knip` detects unused exports, dependencies, and files.
