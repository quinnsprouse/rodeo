# TanStack Start Patterns

## Routing

- File-based routes in `src/routes/`. Export `Route` using `createFileRoute(...)`.
- Root layout: `src/routes/__root.tsx`. Never edit `src/routeTree.gen.ts`.
- Keep the full HTML document in the root route's `shellComponent` so loading, error, and not-found boundaries always render inside a valid shell.
- Colocate loaders/actions with route files unless there's a clear reuse boundary.
- Keep route params/search typing explicit through TanStack Router APIs.

## Server Functions

- Use `createServerFn` for server-only logic. Always `await` the call.
- Never pass non-serializable values (functions, class instances) across the server boundary.
- For data refresh after mutations: `router.invalidate()`.
- Retry loader failures with `router.invalidate()` so loaders rerun before the error boundary resets.

## Data Loading

- Prefer loaders for initial data — avoid client-side fetch waterfalls.
- Never fetch in `useEffect` what could be loaded in a route loader.
- Remember that route loaders are isomorphic. Move secrets and privileged work behind server functions or server-only modules.

## Type Safety

- Avoid `any` unless unavoidable and justified.
- Use `type` imports for type-only values: `import type { Foo } from "..."`.
- Route export allow-list: `Route`, `loader`, `beforeLoad`, `head`, `meta`, `links`, `headers`, `pendingComponent`, `errorComponent`, `notFoundComponent`.

## SSR

- Nitro handles the server engine (via `nitro/vite` plugin).
- TanStack Start SSR is automatic via `tanstackStart()` Vite plugin.
- Keep `verbatimModuleSyntax` disabled and import protection fatal so server-only code cannot leak into client bundles.
- Use `*.server.*` and `*.client.*` filenames (or the matching server-only/client-only markers) at environment boundaries.
- Production: `node .output/server/index.mjs`.
- URL should always reflect application state — use search params, not hidden state.

## Executable Example

See `docs/agents/FULL_STACK_EXAMPLE.md` for the homepage's tested search state → loader dependency → server function → rendered result → error UI flow. Copy that vertical shape before inventing a new data-loading pattern.
