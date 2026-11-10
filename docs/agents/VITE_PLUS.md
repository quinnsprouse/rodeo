# Vite+

`vp` wraps Vite, Rolldown, Vitest, Oxlint, Oxfmt, and Vite Task. Run the gates through `npm run check*`. For anything else, use `vp dev`, `vp lint`, `vp fmt`, or `vp test`.

- **Import from `vite-plus`.** Config comes from `vite-plus`, test helpers from `vite-plus/test`, and the lint plugin API from `vite-plus/lint/plugins`.
- **Don't install the bundled tools.** Vite+ ships oxlint, oxfmt, `@oxlint/plugins`, vitest, and tsdown. A second copy drifts from its version.
- **Load Vite plugins inside `lazyPlugins`.** `vp lint` and `vp fmt` load `vite.config.ts` on every run, including after each agent edit. A plugin imported at the top of the file adds over a second to each run, so `lint/config.test.ts` rejects it. Import it with `import()` inside the `lazyPlugins` callback.
- **Cached gates see only `verificationInputs`.** The gates are tasks in `run.tasks` in `vite.config.ts`. Add any new config or hook file to `verificationInputs`, or the cache returns a stale pass.
- **Update Vite+ with `vp migrate`.** On a branch, run `npx --package=vite-plus@<version> vp migrate --no-interactive` before you change any dependency. It pins `vite-plus` and the `vite` override, and pins `vitest` only when another package or a `vitest/package.json` reference in the source needs it. `scripts/check-toolchain.mjs` fails until the pins match Vite+.
- **`vp dev` is the dev server, not the `dev` script.** Run a package script with `vp run <name>`. There is no `vp vitest` or `vp oxlint`.
