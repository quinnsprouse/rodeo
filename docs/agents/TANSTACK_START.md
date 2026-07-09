# TanStack Start Patterns

## Routing

- File-based routes in `src/routes/`. Export `Route` using `createFileRoute(...)`.
- Root layout: `src/routes/__root.tsx`. Never edit `src/routeTree.gen.ts`.
- Colocate loaders/actions with route files unless there's a clear reuse boundary.
- Keep route params/search typing explicit through TanStack Router APIs.

## Server Functions

- Use `createServerFn` for server-only logic. Always `await` the call.
- Never pass non-serializable values (functions, class instances) across the server boundary.
- For data refresh after mutations: `router.invalidate()`.

## Data Loading

- Prefer loaders for initial data — avoid client-side fetch waterfalls.
- For complex data needs, use TanStack Query with `prefetchQuery` in loaders.
- Never fetch in `useEffect` what could be loaded in a route loader.

## Type Safety

- Avoid `any` unless unavoidable and justified.
- Use `type` imports for type-only values: `import type { Foo } from "..."`.
- Route export allow-list: `Route`, `loader`, `beforeLoad`, `head`, `meta`, `links`, `headers`, `pendingComponent`, `errorComponent`, `notFoundComponent`.

## SSR

- Nitro handles the server engine (via `nitro/vite` plugin).
- TanStack Start SSR is automatic via `tanstackStart()` Vite plugin.
- Production: `node .output/server/index.mjs`.
- URL should always reflect application state — use search params, not hidden state.

## Executable Example

See `docs/agents/FULL_STACK_EXAMPLE.md` for the homepage's tested search state → loader dependency → server function → rendered result → error UI flow. Copy that vertical shape before inventing a new data-loading pattern.
