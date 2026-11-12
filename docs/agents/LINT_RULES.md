# Lint rules

Most lint errors name the fix. Read the error, fix the cause, and move on. Warnings fail too.

**Never suppress a rule inline.** `oxlint-disable` and `eslint-disable` comments are errors. If a rule is wrong for a file, prove it with a minimal example, then add a file-scoped entry with its `why` to `exceptions` in `lint/exceptions.ts`. Oxlint and React Doctor both read that list.

## Comments

Comments are banned. Agents copy them, and one note about a workaround teaches the next agent to write its own workaround instead of fixing the cause. Say it in code: a better name, a smaller function, a type.

Almost every comment can go. Write a `why:` comment only after an agent got the code wrong because of a dependency, a browser, or a spec, and the code can't change. In `src/` and `e2e/`, lint requires the comment to name that cause and keeps it within the limits of `defaultCommentOptions` in `lint/rules.js`:

```ts
// why: Vite inlines VITE_* values into the client bundle, so a secret here becomes public.
```

Lint matches cause names as whole words. It takes them from `KNOWN_CAUSES` in `lint/rules.js` and from the dependencies in `package.json`, except generic words such as `test` and `base`. Add a real cause it doesn't know to the matching group in `KNOWN_CAUSES`.

**The test:** could you delete the comment by changing the code, or does a test already fail when someone undoes it? Then skip the comment.

## Where code goes

Each folder in `src/` imports only from the folders below it, as `lint/layers.ts` defines, and the lint error names the right home when you cross a line:

```
routes → components → components/ui, hooks → lib, config
```

Nothing imports a route module, and only `src/demo/` and `src/routes/(demo)/` may import `@/demo`. Server-only code lives in `*.server.ts`, the only place `process`, `Buffer`, and `node:*` imports are allowed. Read `VITE_*` values from `clientEnv`, never from `import.meta.env`.

## Errors that need more context

- **`react-hooks-js/todo`.** React Compiler can't compile the component, often because it calls `import()` in its body. Move that code to module scope.
- **`no-warning-comments`.** Finish the work. Rewording the TODO doesn't count.
- **`complexity`, `max-depth`, `max-lines`.** Split by responsibility. Return early, or move one concern into its own module.
- **`shadcn/no-unknown-classes` on `text-sm`, `rounded-md`, or `font-bold`.** The Untitled theme replaced Tailwind's default scales. Use its names, such as `text-s`, `rounded-s`, and `font-heavy`.

## Add a rule

When you correct the same mistake twice, make it a rule instead of more prose. Prefer a compiler check or a built-in rule, and prove its valid and invalid cases as probes in the matching topic under `lint/policy/`, which `lint/policy.test.ts` lints in one run. Write a custom rule only when nothing built in fits. Give it its own module in `lint/rules/`, put the fix in its message, add it to the `rules` export in `lint/rules.js`, and test it in `lint/<rule-name>.test.ts`.
