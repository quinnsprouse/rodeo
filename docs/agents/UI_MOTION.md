# UI and motion

## Components and icons

- shadcn/ui is configured for Base UI with the `base-mira` style. Check `src/components/ui/` before adding a component with `npx shadcn@latest add <component>`. The CLI finds `src/components/ui/` through the `@/*` path in the root `tsconfig.json`.
- Use `Button` from `@/components/ui/button` for actions. For navigation that looks like a button, keep the `<Link>` and style it with `buttonVariants({ variant, size })`, so assistive technology still announces a link.
- Import icons from `@/components/icons` and render them with its `Icon` wrapper.
- Give icon-only buttons an accessible name and set button types explicitly.
- Use [React patterns](REACT_PATTERNS.md) for component composition and state.

## Styling

- Use Tailwind v4 classes and `cn()` from `@/lib/utils`.
- Use theme tokens such as `bg-background`, `text-foreground`, and `border-border`. Add new colors in `src/styles/app.css`; raw palette colors (`bg-emerald-500`) and arbitrary values (`text-[13px]`, `bg-[#333]`) in `className` fail lint (`shadcn/no-raw-colors`, `shadcn/no-arbitrary-values`). Declare a token instead. See [Lint Rules](LINT_RULES.md#design-system-rules-shadcn).
- Brand tokens include `text-brand`, `bg-brand`, `border-brand`, and `bg-brand-soft`.
- The theme follows the operating system setting. Each color token in `app.css` is a `light-dark(light, dark)` pair. To force one theme, put `.light` or `.dark` on `<html>`.
- Use semantic tokens such as `bg-background`, never `bg-white` or `bg-black`. `shadcn/no-raw-colors` allows white and black, so `e2e/accessibility.spec.ts` catches them through contrast checks in both themes.
- `app.css` imports DM Sans and JetBrains Mono from `@fontsource-variable/*` and maps them to `--font-sans` and `--font-mono`. Add new fonts the same way. Don't link a third-party font stylesheet.

## Motion and layout

- Import animation components from `motion/react`.
- Prefer animating `transform` and `opacity`; specify transition properties instead of `transition: all`.
- Respect reduced-motion preferences. The existing `usePrefersReducedMotion` hook handles the browser subscription and server snapshot.
- Use `tabular-nums` for changing or column-aligned numbers.
- Keep input fonts at least `16px` to avoid iOS focus zoom.
- Check narrow viewports for overflow, use dynamic viewport units for full-height layouts, and account for safe areas when placing fixed controls.
