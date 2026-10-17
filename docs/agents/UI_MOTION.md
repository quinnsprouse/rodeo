# UI and motion

For UI work, follow `GUI.md` and the `graphical-ui` skill. This guide covers how the starter wires components, tokens, fonts, and motion.

- **Check `src/components/ui/` before you build a component.** Add a missing one with `npx shadcn@latest add <component>`. It installs on Base UI in the `base-mira` style.
- **Actions are `Button`, navigation is `<Link>`.** To make a link look like a button, style it with `buttonVariants({ variant, size })`, so assistive technology still announces a link.
- **Icons come from `@/components/icons`** through its `Icon` wrapper. Give an icon-only button an accessible name.
- **Colors are tokens.** Declare a new one in `src/styles/app.css` as a `light-dark()` pair, which follows the OS theme. Lint rejects palette colors and arbitrary values but allows `bg-white` and `bg-black`. Don't use those either. The accessibility test fails them on contrast in one of the themes.
- **Fonts come from `@fontsource-variable/*`**, imported in `app.css`. Never link a third-party font stylesheet.
- **Load motion lazily.** Import from `motion/react`, render `m` components inside `<LazyMotion strict>`, and load the features from `@/lib/motion-features` with `import()`, as `src/components/terminal-demo.tsx` does.
- **Motion renders `initial` on the server.** If `initial` hides content, add `noscript:opacity-100!` so the content shows without JavaScript.
- **Animate `transform` and `opacity`**, never `transition: all`. Respect reduced motion with `usePrefersReducedMotion`.
- **Keep input text at least `16px`**, or iOS zooms in on focus. Use `tabular-nums` for numbers that change.
