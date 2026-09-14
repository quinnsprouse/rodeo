# Lint Rules

Rodeo's lint gate has four layers. All four run on every `vp lint`, in the post-edit hook after supported edits, in `vp staged` at commit, and in every `npm run check*` command. Warnings fail the gate: `lint.options.denyWarnings` is on.

1. **Oxlint categories** — `correctness`, `suspicious`, and `perf`, plus type-aware `typescript/*` rules through tsgolint.
2. **Named restriction rules** — individually chosen Oxlint rules that ban known agent mistakes.
3. **Project rules** — the `rodeo/*` plugin in `lint/rules.js`, written for patterns no stock rule expresses.
4. **Design-system rules** — the `shadcn/*` plugin from `@shadcn/lint`, which checks Tailwind classes against the theme and the UI kit.

## No inline suppression

`oxlint-disable` and `eslint-disable` comments are lint errors (`rodeo/no-disable-directives`), and Oxlint ignores `eslint-disable` comments even where they appear. When a rule is wrong for a file, add a file-scoped entry under `lint.overrides` in `vite.config.ts` with a comment explaining why. That keeps every exception in one reviewed place instead of scattered through the code. See [ADR 0004](../adr/0004-lint-exceptions-live-in-config.md).

## Named restriction rules

The category defaults already enable checks for floating promises, unsafe promise callbacks, accessibility, unstable React keys, and focused or skipped Vitest tests. Use `vp lint --print-config` to inspect the effective configuration before adding a duplicate rule.

| Rule                                  | Why                                                            | Do this instead                                   |
| ------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------- |
| `no-restricted-imports`               | Icon and animation packages we don't use                       | `@/components/icons`, `motion/react`              |
| `import/no-relative-parent-imports`   | `../../lib/x` paths break when files move                      | `@/lib/x`                                         |
| `import/no-default-export`            | Default exports defeat rename refactors and Knip               | Named exports (config files are exempt)           |
| `typescript/no-explicit-any`          | `any` turns off the type checker where it matters most         | `unknown` plus narrowing, or a real type          |
| `typescript/no-non-null-assertion`    | `x!` hides a null path the compiler found                      | Narrow with `if`, or `?.` with a fallback         |
| `typescript/ban-ts-comment`           | `@ts-ignore` hides errors silently                             | `@ts-expect-error` with a description, or fix it  |
| `typescript/no-misused-promises`      | Promises in `if` or as `void` callbacks run unawaited          | `await`, or `void` an intentional fire-and-forget |
| `typescript/no-unsafe-*`              | Values typed `any` leaking through calls, returns, and members | Type the boundary                                 |
| `typescript/no-unsafe-type-assertion` | `as unknown as T` bypasses checking                            | Validate at the boundary                          |
| `react/no-danger`                     | `dangerouslySetInnerHTML` is the XSS path                      | Render data as text or sanitize server-side       |
| `no-console`                          | Stray debug output ships to production                         | `console.warn` / `console.error` are allowed      |
| `unicorn/no-array-for-each`           | `forEach(async …)` silently drops awaits                       | `for … of`, or `Promise.all(items.map(…))`        |
| `unicorn/no-abusive-eslint-disable`   | Bare `eslint-disable` turns off everything                     | Fix the code                                      |

## React rules

React effects are allowed. The configured `react-hooks-js/*` rules come from `eslint-plugin-react-hooks`. Missing dependencies, conditional hooks, synchronous state updates in effects, and render-time mutations fail checks. Warnings also fail; inline suppression remains an error. See [React patterns](REACT_PATTERNS.md) and [React's lint reference](https://react.dev/reference/eslint-plugin-react-hooks).

Cleanup correctness still needs code review and behavior tests.

## Explicit behavior checks

Empty blocks fail `no-empty`; handle failures, or explain why ignoring a particular failure is intentional inside the block. Inputs with `checked` must have `onChange` or `readOnly` under `react/checked-requires-onchange-or-readonly`. See the upstream [empty-block](https://eslint.org/docs/latest/rules/no-empty) and [checked-input](https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/checked-requires-onchange-or-readonly.md) rules.

| Check                                     | What agents should do                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `typescript/switch-exhaustiveness-check`  | Handle every union or enum member explicitly; a `default` does not cover omitted members         |
| `react/button-has-type`                   | Set `type="button"`, `type="submit"`, or `type="reset"` to avoid accidental form submissions     |
| `eqeqeq`                                  | Use `===` and `!==`; `value == null` is allowed to test both null and undefined                  |
| `typescript/prefer-promise-reject-errors` | Reject with an `Error` to preserve a stack and error context                                     |
| TypeScript `noImplicitReturns`            | Return a value on every applicable path, or explicitly return undefined when absence is intended |

TypeScript's `noImplicitReturns` replaces `typescript/consistent-return` for TypeScript files because it understands exhaustive union switches. This follows the [rule's recommendation](https://typescript-eslint.io/rules/consistent-return/). The check is enabled for application code, tooling, and E2E tests.

`lint/policy.test.ts` runs the actual configuration against failing examples and valid code, including intentional null checks and exhaustive switches without unnecessary defaults. The rule behavior follows the upstream references for [switches](https://typescript-eslint.io/rules/switch-exhaustiveness-check/), [button types](https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/button-has-type.md), [equality](https://eslint.org/docs/latest/rules/eqeqeq), and [promise rejections](https://typescript-eslint.io/rules/prefer-promise-reject-errors/).

## Design-system rules (`shadcn/*`)

[`@shadcn/lint`](https://github.com/shadcn-ui/lint) checks Tailwind classes against the theme in `src/styles/app.css` and the components in `src/components/ui`, both discovered through `components.json`. Its errors name the token, scale step, size, or variant to use instead, so fix the class rather than the rule.

| Rule                     | Catches                                                                    | Do this instead                                                                                                                                                             |
| ------------------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-raw-colors`          | Palette colors such as `bg-emerald-500`, undeclared color tokens           | A semantic token (`text-success`, `bg-brand`), or declare `--color-<name>`                                                                                                  |
| `no-arbitrary-values`    | `text-[13px]`, `bg-[#333]`, `leading-[1.7]` (layout values allowed)        | A scale step (`text-sm`, `leading-relaxed`). A custom font-size token needs a t-shirt name such as `--text-2xs`; the class grammar reads any other `text-<name>` as a color |
| `no-restyle`             | Appearance classes on a kit component, such as `<Snippet className="p-4">` | A size or variant prop; only layout classes (`w-full`, `mt-4`) pass                                                                                                         |
| `no-inline-styles`       | `style={{ … }}` and `<style>` elements                                     | Tailwind classes                                                                                                                                                            |
| `no-unknown-classes`     | Classes Tailwind cannot generate, such as `rounded-huge`                   | Fix the spelling, or declare it with `@utility`                                                                                                                             |
| `require-static-classes` | Class strings the linter cannot read, such as `` `bg-${color}` ``          | A lookup object of full class names                                                                                                                                         |

Inside `src/components/ui/**`, `no-restyle`, `no-arbitrary-values`, and `require-static-classes` are off (`lint.overrides`): the kit owns its appearance and may need structural values. `no-raw-colors` and `no-inline-styles` stay on there.

## Project rules (`rodeo/*`)

| Rule                              | Catches                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| `no-disable-directives`           | Any `oxlint-disable` or `eslint-disable` comment                                               |
| `server-fn-requires-validator`    | A `createServerFn` handler that reads `data` without `.validator()` or `.inputValidator()`     |
| `no-state-from-props`             | `useState(prop)` seeded from a prop not named `default*` or `initial*`                         |
| `no-module-scope-browser-globals` | `window`, `document`, `localStorage`, `navigator`, `location` read at module scope (SSR crash) |
| `no-window-navigation`            | `window.location.href = …`, `location.assign()`, `location.replace()`                          |

Rules live in `lint/rules.js` and are tested end to end through the real Oxlint binary in `lint/rules.test.ts`. React Doctor loads the same plugin through `doctor.config.ts`, so the rules also appear in `npm run doctor` and the PR summary comment.

## Adding a rule

1. Identify a concrete failure and check whether the effective configuration already catches it. Prefer a compiler check or documented built-in rule.
2. Test valid and invalid examples against the project configuration in `lint/policy.test.ts`, including legitimate edge cases. Do not enable a rule that forces unnecessary code to satisfy it.
3. Enable the rule in `vite.config.ts` and document the diagnostic's fix here. If it produces a false positive, reproduce it before choosing a narrower option or a documented file-scoped exception.
4. Write a custom rule only when existing checks cannot express a recurring project requirement. Use `defineRule` from `@oxlint/plugins`, give the diagnostic a concrete fix, test both outcomes in `lint/rules.test.ts`, and register it in both lint and React Doctor configurations.
