# UI and motion

For UI work, follow `GUI.md` and the `graphical-ui` skill. This guide covers how the starter wires components, tokens, fonts, and motion.

- **Check `src/components/ui/` before you build a component.** Add a missing one with `npx shadcn@latest add <component>`. It installs on Base UI in the `base-mira` style.
- **Actions are `Button`, navigation is `<Link>`.** To make a link look like a button, style it with `buttonVariants({ variant, size })`, so assistive technology still announces a link.
- **Icons come from `@/components/icons`** through its `Icon` wrapper. Give an icon-only button an accessible name.
- **Use the theme's names.** `src/styles/app.css` defines the Untitled tokens, each color a `light-dark()` pair that stays light until `ThemeToggle` sets `.dark` on `<html>` and stores the choice in `localStorage`. Write `text-m`, `p-m`, `gap-s`, `rounded-s`, `font-heavy`, `bg-primary`, and `text-muted-foreground`. Tailwind's default type, radius, shadow, weight, and palette scales are gone, so `text-sm` or `bg-emerald-500` fails lint.
- **Draw edges with `ring` or `inset-ring`**, and dividers with `divider-t` or `divider-b`, not `border`. The theme draws every edge as a box shadow.
- **Fonts are self-hosted.** Open Runde is subset to Latin, punctuation, and arrows in `src/assets/fonts/`, and Geist Mono comes from Fontsource. Both are declared in `app.css`. To show another script, re-subset Open Runde from its upstream release. Never link a third-party font stylesheet.
- **Keep motion on the compositor.** Chrome runs `transform` and `opacity` animations off the main thread. Animated `filter`, `clip-path`, `width`, and `background-position` repaint on the main thread every frame, so keep them short. For keyframed or spring motion, call `element.animate()`, or `useWebAnimation` for precomputed keyframes. Motion's `spring` turns a spring into a CSS `linear()` easing, as `src/components/swap-chip-motion.tsx` does.
- **Render the settled state on the server.** Content that animates in should render visible, and hide only after it mounts below the fold, so it shows without JavaScript. `usePlayOnView` works this way.
- **Time motion with the theme.** Use `duration-(--motion-duration) ease-(--motion-easing)` for controls, and the large curve for reveals and panels. Animate `transform` and `opacity`, never `transition: all`. Respect reduced motion with `usePrefersReducedMotion`.
- **Keep input text at least `16px`**, or iOS zooms in on focus. Use `tabular-nums` for numbers that change.
