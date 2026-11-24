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

## Honest tests

Lint rejects a test that can pass without proving anything. `@interfere/landmines` rejects a fixed sleep or a timed wait, a retry, a `timeout` option on a test or suite, a test double in a guardrail test, and an assertion that runs on only one branch. `playwright/no-slowed-test` rejects `test.slow()`. Fix the test by waiting on the event or using the real implementation. CI does not retry a failed test. Lint does not catch `test.setTimeout`, `test.describe.configure({ timeout })`, a `timeout` on a single assertion, or `expect(...).toPass({ timeout })`, and the same reasoning rules them out.

Some landmines messages name things the starter does not have. Read them this way:

- **"File the failure under the flaky-test tracker."** There is no tracker. Fix the wait.
- **"Use the real implementation and MSW."** There is no MSW. Use the real implementation.
- **"Use fake timers (`vi.useFakeTimers()`)" in a browser test.** Move time with `page.clock`.
- **"Lower its allowlist entry in `.oxlintrc.jsonc`."** The list is `suitesThatRunRealProcesses` in `lint/config.ts`, which names the guardrail suites that may keep a raised timeout and how many each may have.

`lint/config.ts` turns each landmines rule on by name, and `declinedLandminesRules` there gives the reason for each one the starter leaves off. `lint/config.repo.test.ts` fails when a new version recommends a rule that is in neither place. Turn it on with a rejected sample in `lint/policy/`, or decline it with a reason.

## Errors that need more context

- **`react-hooks-js/todo`.** React Compiler can't compile the component, often because it calls `import()` in its body or has a `try` without a `catch`. Move an `import()` to module scope. For a pending flag around an async submit, drop the `try`/`finally` and pass an async function to `startTransition` from `useTransition`, which tracks the pending state for you.
- **`jsx-a11y/label-has-associated-control` on shadcn's `Label`.** The rule can't see `htmlFor` through `{...props}`, so skip the wrapper. Wrap the control in a native `<label>`, which lint accepts for Base UI's `Switch`, `Checkbox`, `Radio`, and `Input`, or give it an `id` from `useId()` and point `<label htmlFor>` at it.
- **`typescript/no-deprecated` on `FormEvent`.** The message drops the names of the replacements. Type a submit handler with `SubmitEvent<HTMLFormElement>`.
- **`no-warning-comments`.** Finish the work. Rewording the TODO doesn't count.
- **`landmines/no-silent-catch`.** A rejection handler that does nothing hides every failure, including the ones you did not expect. Name the one rejection the code expects and rethrow the rest, as `src/components/theme-toggle.tsx` does for a click sound the browser blocks.
- **`complexity`, `max-depth`, `max-lines`.** Split by responsibility. Return early, or move one concern into its own module.
- **`shadcn/no-unknown-classes` on `text-sm`, `rounded-md`, or `font-bold`.** The Untitled theme replaced Tailwind's default scales. Use its names, such as `text-s`, `rounded-s`, and `font-heavy`.

## Add a rule

When you correct the same mistake twice, make it a rule instead of more prose. Prefer a compiler check or a built-in rule, and prove its valid and invalid cases as probes in the matching topic under `lint/policy/`, which `lint/policy.test.ts` lints in one run. Write a custom rule only when nothing built in fits. Give it its own module in `lint/rules/`, put the fix in its message, add it to the `rules` export in `lint/rules.js`, and test it in `lint/<rule-name>.test.ts`.
