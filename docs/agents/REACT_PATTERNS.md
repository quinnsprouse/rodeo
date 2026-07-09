# React Patterns

## No Direct useEffect

`useEffect` is banned via lint rule. It causes race conditions, infinite loops, and implicit control flow that's hard to trace. For the rare mount-sync case, use `useMountEffect()` from `@/hooks/use-mount-effect`.

### What to do instead

**Derive state, don't sync it:**

```tsx
// BAD — extra render cycle, loop risk
const [filtered, setFiltered] = useState([]);
useEffect(() => setFiltered(items.filter(pred)), [items]);

// GOOD — compute inline
const filtered = items.filter(pred);
```

**Use route data:**

```tsx
// BAD — race condition, no caching
useEffect(() => {
  fetch(url).then(setData);
}, [id]);

// GOOD — load before rendering
export const Route = createFileRoute("/items/$id")({
  loader: ({ params }) => getItem({ data: { id: params.id } }),
  component: ItemPage,
});
```

**Handle events in handlers:**

```tsx
// BAD — flag → effect → reset flag
useEffect(() => {
  if (submitted) {
    save();
    setSubmitted(false);
  }
}, [submitted]);

// GOOD — direct handler
<button onClick={() => save()}>Save</button>;
```

**Reset with `key`, not effect dependency choreography:**

```tsx
// BAD
useEffect(() => {
  reset();
  loadVideo(id);
}, [id]);

// GOOD — forces clean remount
<VideoPlayer key={videoId} videoId={videoId} />;
```

**Mount-only external sync → `useMountEffect`:**

```tsx
useMountEffect(() => {
  const sub = externalSystem.subscribe();
  return () => sub.unsubscribe();
});
```

### Conditional mounting over effect guards

```tsx
// BAD — guard inside effect
useEffect(() => {
  if (!loading) init();
}, [loading]);

// GOOD — mount only when ready
if (loading) return <Spinner />;
return <Ready />; // useMountEffect inside Ready
```

## Component Design

- Composition over configuration — prefer `children` over render props.
- Explicit variant props over boolean proliferation (`variant="primary"` not `primary`).
- Lift state only as high as needed. Keep expensive components as `children`, not inline JSX.
- Use `key` to force remounts when identity changes (user ID, entity ID).

## Performance

- Only animate `transform` and `opacity`. Never `width`, `height`, `top`, `left`.
- Never use `transition: all` — specify exact properties.
- Use `useMemo`/`useCallback` only when profiling shows a real problem, not preemptively.
