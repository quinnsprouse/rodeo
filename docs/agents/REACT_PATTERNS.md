# React patterns

## Effects synchronize with external systems

Use React's `useEffect` for timers, subscriptions, and imperative browser APIs. Derive values during render, handle user actions in event handlers, and load route data with TanStack loaders. See [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect).

Keep the effect callback inline and include every reactive value it reads in the dependency array. An empty array is correct only when the effect reads no reactive values. Do not hide dependencies behind a mount-only wrapper or suppress a dependency warning.

```tsx
useEffect(() => {
  const connection = createConnection(roomId);
  connection.connect();
  return () => connection.disconnect();
}, [roomId]);
```

Cleanup must undo setup before dependencies change and when the component unmounts. Clear timers, remove listeners, and unsubscribe from external systems. React Strict Mode replays setup and cleanup in development, so both must be safe to repeat. An effect callback cannot be async; start asynchronous work inside it and cancel or ignore stale results during cleanup.

For browser state such as media queries, use [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) with a server snapshot that matches hydration. See `src/hooks/use-prefers-reduced-motion.ts`.

## Prefer direct code

Compute derived values during render:

```tsx
const filtered = items.filter(predicate);
```

Load route data before rendering:

```tsx
export const Route = createFileRoute("/items/$id")({
  loader: ({ params }) => getItem({ data: { id: params.id } }),
  component: ItemPage,
});
```

Run user actions in handlers:

```tsx
<button type="button" onClick={handleSave}>
  Save
</button>
```

When an entity's identity changes, use a key to reset its component state:

```tsx
<Editor key={document.id} initialValue={document.content} />
```

Avoid copying props into state that must stay synchronized. Props named `initial*` or `default*` may seed intentionally independent state. Keep browser globals inside functions that run in the browser, not at module scope where SSR evaluates them.

## Enforcement

`npm run check` and the commit checks run the configured React rules. Missing dependencies, conditional hooks, synchronous state updates in effects, render-time mutations, and inline lint suppressions fail the gate. [React's lint reference](https://react.dev/reference/eslint-plugin-react-hooks) explains the standard rules; [Lint rules](LINT_RULES.md) documents project restrictions and file-scoped exceptions.

Lint cannot prove that every subscription is cleaned up or that an effect is needed. Review effects for external synchronization, complete cleanup, and stale asynchronous results. Test observable behavior when dependencies change or the component unmounts.

## Component design

- Prefer composition with `children` over accumulating configuration props.
- Use explicit variants when booleans describe mutually exclusive states.
- Lift state only as high as needed.
- React Compiler memoizes components and hooks. `reactCompilerPreset` in `vite.config.ts` turns it on. Don't add `useMemo`, `useCallback`, or `memo` for performance. Use them only when an API needs a stable identity. When the compiler can't compile a component, a `react-hooks-js/*` rule fails lint.
- Prefer animating `transform` and `opacity`; avoid `transition: all`.
