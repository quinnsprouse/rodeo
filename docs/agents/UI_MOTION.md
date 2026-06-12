# UI and Motion

## Styling

- Tailwind CSS v4 utility classes only. Use `cn()` from `@/lib/utils` to compose.
- Always use theme tokens (`bg-background`, `text-foreground`, `border-border`) — never ad-hoc hex colors.
- Dark mode via `.dark` class on `<html>`. Use CSS variables for theme, not Tailwind `dark:` modifier where possible.
- Use shadows instead of borders for subtle separation. For hairline borders: `border` + `border-color` with opacity.

## Components

- shadcn/ui with Base UI primitives (`base-mira` style) in `src/components/ui/`.
- Prefer existing shadcn components before building custom ones.
- Add new: `npx shadcn@latest add <component>`.
- Use `AlertDialog` (not `Dialog`) for destructive/irreversible actions.
- Icon-only buttons must have `aria-label`.

## React Patterns

- Composition over configuration — prefer `children` over render props.
- Avoid boolean prop proliferation (`<Button primary>` vs `<Button variant="primary">`). Use explicit variant props.
- Minimize re-renders: lift state only as high as needed, keep expensive components as `children` not inline.
- Never use `transition: all` — always specify exact properties (`transition-colors`, `transition-opacity`).

## Motion

- Import from `motion/react` (not `framer-motion`).
- Only animate compositor properties: `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`.
- Easing: `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for state changes. Never `linear` for UI motion.
- Duration: feedback < 200ms, entrances 200-500ms. Scale with element size — larger = slightly longer.
- Start near 1 for scale (`0.95`+), never `scale(0)`.
- Stagger delays: 30-80ms between items.
- Respect `useReducedMotion()` — skip or simplify all motion.

## Typography

- Use `text-balance` on headings, `text-pretty` on body text.
- Use `tabular-nums` for any numbers that change or align in columns.
- Minimum `16px` font on inputs (prevents iOS zoom).
- Use `text-ellipsis` + `overflow-hidden` for single-line truncation, never uncontrolled overflow.

## Layout

- Use `min-h-dvh` not `min-h-screen` (accounts for mobile browser chrome).
- Fixed z-index scale: base 0, dropdown 10, sticky 20, overlay 30, modal 40, toast 50.
- Account for safe areas on mobile: `env(safe-area-inset-*)`.

## Icons

- Import from `@/components/icons` which wraps Hugeicons Free icons.
- Use the `Icon` wrapper for consistent size/stroke.
- Pattern: `import { Icon, SomeIcon } from "@/components/icons"`.

## Fonts

- DM Sans (body), JetBrains Mono (code) — loaded in `__root.tsx`.
- Registered as `--font-sans` and `--font-mono` in `app.css`.
