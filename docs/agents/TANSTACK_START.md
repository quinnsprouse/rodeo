# TanStack Start Patterns

## Routing

- File-based routes in `src/routes/`. Export `Route` using `createFileRoute(...)`.
- Root layout: `src/routes/__root.tsx`. Never edit `src/routeTree.gen.ts`.
- Keep the full HTML document in the root route's `shellComponent` so loading, error, and not-found boundaries always render inside a valid shell.
- Colocate loaders/actions with route files unless there's a clear reuse boundary.
- Keep route params/search typing explicit through TanStack Router APIs.
- `defaultErrorComponent` and `defaultNotFoundComponent` in `src/router.tsx` give every route its own boundary, so a failing page renders its error inside its parent layouts. To change one route's error UI, set `errorComponent` or `notFoundComponent` on that route.

## Document head

- The root route's `head` sets the site-wide tags. It derives the canonical URL and `og:url` from the deepest match, so each page gets its own canonical and a 404 gets none.
- Put tags that only one page needs in that route's `head`, such as a preload for an asset only that page uses. A preload in the root route downloads on every page.
- `HeadContent` keeps one `meta` tag per `name` or `property`, and the deepest route wins. It keeps every `link`, so never add a canonical link in a child route.
- To render two `meta` tags with the same `name`, such as the per-theme `theme-color` pair, write them in the root route's `shellComponent`.

## Server Functions

- Use `createServerFn` for server-only logic. Always `await` the call.
- A handler that reads `data` must declare `.validator(schema)` first. `rodeo/server-fn-requires-validator` rejects a handler that reads unvalidated input.
- Pass a Zod Mini schema to `.validator()`. Start runs the schema on the server and infers the type of `data` from its output. The old name, `.inputValidator()`, is deprecated and fails `no-deprecated`.
- Import `z` from `zod/mini`. Lint rejects `zod`, because search schemas ship in the entry chunk that every route downloads. See [ADR 0007](../adr/0007-schemas-use-zod-mini.md).
- Validate search params with a Zod Mini schema too: `validateSearch: z.object({ ... })`. To make a bad value fall back instead of throwing, wrap the field in `z.catch(schema, fallback)`.
- `src/start.ts` registers `createCsrfMiddleware` for server functions, and it rejects a call that another site sends. Start adds this protection on its own only while `src/start.ts` does not exist. When you add request middleware, keep the CSRF middleware in `requestMiddleware`.
- Never pass non-serializable values (functions, class instances) across the server boundary.
- For data refresh after mutations: `router.invalidate()`.
- Retry loader failures with `router.invalidate()` so loaders rerun before the error boundary resets.

## Data Loading

- Prefer loaders for initial data — avoid client-side fetch waterfalls.
- Never fetch in `useEffect` what could be loaded in a route loader.
- Remember that route loaders are isomorphic. Move secrets and privileged work behind server functions or server-only modules.

## Environment variables

- `src/config/env.ts` validates every `VITE_*` variable with Zod when the app starts. Read them from `clientEnv`, not from `import.meta.env`.
- Vite inlines `VITE_*` values into the client bundle. Never put a secret in one.
- Read secrets from `process.env` in a `*.server.ts` module. Parse them with a Zod Mini schema there, the same way `env.ts` does, so a missing secret fails with its name. Import protection keeps that module out of the client bundle.
- For each new variable, add it to the schema and to `.env.example`. Add `VITE_*` variables to `src/vite-env.d.ts` too.

## SSR

- Nitro handles the server engine (via `nitro/vite` plugin).
- TanStack Start SSR is automatic via `tanstackStart()` Vite plugin.
- Keep `verbatimModuleSyntax` disabled and import protection fatal so server-only code cannot leak into client bundles.
- Use `*.server.*` and `*.client.*` filenames (or the matching server-only/client-only markers) at environment boundaries.
- Production: `node .output/server/index.mjs`.
- Nitro adds the security headers in `securityHeaders` (`vite.config.ts`) to every response. The CSP has no `script-src`, because hydration uses inline scripts. Before you load a third-party script, add a `script-src` that uses a nonce.
- Navigate with `useNavigate()` or `<Link>`, never `window.location` (`rodeo/no-window-navigation`).
- Never touch `window`, `document`, or storage at module scope; modules load on the server too (`rodeo/no-module-scope-browser-globals`).

## Full-stack example

The homepage demonstrates typed URL state, a route loader, a server function, and recovery from an error:

1. `src/routes/index.tsx` validates the `demo` search parameter and includes it in `loaderDeps` so it affects the loader cache key.
2. The loader awaits a private `createServerFn`; `src/lib/starter-status.ts` exports its Zod input schema and returns the result or throws.
3. The loader catches the requested `?demo=error` failure and returns a typed result for the route's recovery UI.

Keep shared logic in `src/lib/` and export only supported route symbols from route files. `src/lib/starter-status.test.ts` tests the shared logic; `e2e/smoke.spec.ts` tests the rendered result and error recovery. When adapting the example, put shareable state in the URL and test observable behavior through the same interface the route uses.
