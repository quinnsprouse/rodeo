# Lint rules

Most lint errors name the fix. Read the error, fix the cause, and move on. Warnings fail too.

**Never suppress a rule inline.** `oxlint-disable` and `eslint-disable` comments are errors. If a rule is wrong for a file, prove it with a minimal example, then add a file-scoped entry to `lint.overrides` in `vite.config.ts` with a `why:` comment. An exception to a `rodeo/*` rule goes in `rodeoRuleExceptions` in `lint/rodeo-rules.ts` instead, because React Doctor reads that file and ignores the overrides.

## Comments

Comments are banned. Agents copy them, and one note about a workaround teaches the next agent to write its own workaround instead of fixing the cause. Say it in code: a better name, a smaller function, a type.

Keep a comment only when the code must stay as it is because of something you can't change, and start it with `why:`:

```ts
// why: Penflow's font parser reads window at import time, so it loads only inside ClientOnly.
```

**The test:** could you delete the comment by changing the code? Then change the code.

## Where code goes

Each folder in `src/` imports only from the folders below it, and the lint error names the right home when you cross a line:

```
routes → components → components/ui, hooks → lib, config
```

Nothing imports a route module. Server-only code lives in `*.server.ts`, the only place `process`, `Buffer`, and `node:*` imports are allowed. Read `VITE_*` values from `clientEnv`, never from `import.meta.env`.

## Errors that need more context

- **`react-hooks-js/todo`.** React Compiler can't compile the component, often because it calls `import()` in its body. Move that code to module scope.
- **`no-warning-comments`.** Finish the work. Rewording the TODO doesn't count.
- **`complexity`, `max-depth`, `max-lines`.** Split by responsibility. Return early, or move one concern into its own module.
- **`shadcn/no-arbitrary-values` on a font size.** Declare a size token such as `--text-2xs`. Tailwind reads any other `text-<name>` as a color.

## Add a rule

When you correct the same mistake twice, make it a rule instead of more prose. Prefer a compiler check or a built-in rule, and prove its valid and invalid cases in `lint/policy.test.ts`. Write a custom rule in `lint/rules.js` only when nothing built in fits. Put the fix in its message, test it in `lint/rules.test.ts`, and add its name to `rodeoRuleNames` in `lint/rodeo-rules.ts`.
