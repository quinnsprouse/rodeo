# Full-stack example

The homepage contains a deliberately small vertical example that agents can copy when adding product behavior.

## Flow

1. `src/routes/index.tsx` validates `?demo=error` as typed URL state.
2. `loaderDeps` puts that state into the route loader cache key.
3. The awaited loader calls a private `createServerFn`.
4. `src/lib/starter-status.ts` validates the serialized input and resolves the result.
5. The loader catches the deliberate rejection and returns a typed error result.
6. The route renders either the ready status or an accessible recovery state.

The server function stays private to the route because route files should export only TanStack's supported route symbols. The pure Starter Status interface lives in `src/lib/` so unit tests and the server adapter exercise the same behavior.

## Executable feedback

- `src/lib/starter-status.test.ts` covers the ready result and requested failure.
- `e2e/smoke.spec.ts` proves loader → server function → rendered result in a browser.
- The error-path E2E test follows the URL-driven rejection into a handled alert and back to a healthy page without an uncaught browser error.

When adapting the example, keep user-visible state in the URL, await server functions in loaders, and test observable behavior through the same interface the route uses.
