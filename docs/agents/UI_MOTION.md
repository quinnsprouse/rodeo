# UI and motion

## Components and icons

- shadcn/ui is configured for Base UI with the `base-mira` style. Check `src/components/ui/` before adding a component with `npx shadcn@latest add <component>`.
- Import icons from `@/components/icons` and render them with its `Icon` wrapper.
- Give icon-only buttons an accessible name and set button types explicitly.
- Use [React patterns](REACT_PATTERNS.md) for component composition and state.

## Styling

- Use Tailwind v4 classes and `cn()` from `@/lib/utils`.
- Use theme tokens such as `bg-background`, `text-foreground`, and `border-border`. Add new colors in `src/styles/app.css`; raw palette colors (`bg-emerald-500`) and arbitrary values (`text-[13px]`, `bg-[#333]`) in `className` fail lint (`shadcn/no-raw-colors`, `shadcn/no-arbitrary-values`). Declare a token instead. See [Lint Rules](LINT_RULES.md#design-system-rules-shadcn).
- Brand tokens include `text-brand`, `bg-brand`, `border-brand`, and `bg-brand-soft`.
- Dark mode uses `.dark` on `<html>`. Prefer semantic tokens that respond to the theme.
- DM Sans and JetBrains Mono are loaded in `src/routes/__root.tsx` and mapped to `--font-sans` and `--font-mono` in `app.css`.

## Motion and layout

- Import animation components from `motion/react`.
- Prefer animating `transform` and `opacity`; specify transition properties instead of `transition: all`.
- Respect reduced-motion preferences. The existing `usePrefersReducedMotion` hook handles the browser subscription and server snapshot.
- Use `tabular-nums` for changing or column-aligned numbers.
- Keep input fonts at least `16px` to avoid iOS focus zoom.
- Check narrow viewports for overflow, use dynamic viewport units for full-height layouts, and account for safe areas when placing fixed controls.
