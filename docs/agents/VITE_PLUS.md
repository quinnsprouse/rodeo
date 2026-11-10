# Vite+

`vp` wraps Vite, Rolldown, Vitest, Oxlint, Oxfmt, and Vite Task. Run the gates through `npm run check*`. For anything else, use `vp dev`, `vp lint`, `vp fmt`, or `vp test`.

- **Import from `vite-plus`.** Config comes from `vite-plus`, test helpers from `vite-plus/test`, and the lint plugin API from `vite-plus/lint/plugins`.
- **Don't install the bundled tools.** `vite-plus/versions` lists the tools Vite+ ships. A second copy drifts from its version.
- **Load Vite plugins inside `lazyPlugins`.** `vp lint` and `vp fmt` load `vite.config.ts` on every run, including after each agent edit. A plugin imported at the top of the file slows every run, so `lint/config.test.ts` rejects it. Import it with `import()` inside the `lazyPlugins` callback.
- **Cached gates read every file outside `ignoredDirectories`** in `scripts/lib/project.mjs`. Add a new output or cache directory there, or every gate walks it and misses the cache when it changes.
- **Update Vite+ with `vp migrate`.** On a branch, run `npx --package=vite-plus@<version> vp migrate --no-interactive` before you change any dependency. It rewrites the pins, and `scripts/check-toolchain.mjs` fails until they match Vite+.
- **`vp dev` is the dev server, not the `dev` script.** Run a package script with `vp run <name>`. There is no `vp vitest` or `vp oxlint`.
