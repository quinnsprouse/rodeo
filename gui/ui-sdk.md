# UI SDK components

Use this guide when the receiving app uses UI SDK. Keep existing shared wrappers and verify component APIs against the installed `@ui-sdk/react` declarations and the docs the package ships in `node_modules/@ui-sdk/react/docs/`. The theme reference describes appearance; it does not provide React implementations.

## Apply the theme

Read the relevant component section linked from the [theme reference](themes.md). Map its part, variant, mode, and state assignments to the app’s shared component styles. Use named theme tokens and the full typography, fill, foreground, edge, elevation, and focus treatments. Preserve the primitive’s supported state selectors and anatomy.

Parts render without styles. Select a part by its `data-slot` and its state attributes, such as `data-selected`, `data-open`, and `data-disabled`, which each component page lists. Declare `@layer ui-sdk;` above the Tailwind import in the global stylesheet so the app’s styles win over the few rules UI SDK adds.

Compose patterns from these shared controls and application content. Keep selection, focus management, dismissal, and form behavior in the primitive. Preserve the app’s existing dependencies; a theme change does not require replacing its primitive library.

## Composition and behavior

Use the documented `render` prop when composing UI SDK with custom components. Spread supplied props and retain refs; compose handlers deliberately, since the app’s handler runs first and `event.preventDefault()` skips the part’s own. Leave the roles, IDs, and ARIA state a part manages intact. Preserve accessible labels, descriptions, native form values, and controlled/uncontrolled behavior. Avoid nested interactive elements.

Read `llms.txt` in the shipped docs for the conventions every part shares, and the relevant page in `components/` beside it. They describe the installed version, so prefer them to the website.

## Popups and motion

Popups render in place in the browser’s top layer, so they inherit the theme scope around them and need no portal. Keep a popup outside clickable cards and links, because its events bubble through the elements around it. A popup moved with `container` leaves that scope; follow the portal guidance in [Custom components](custom-components.md). Preserve the primitive’s positioning, sizing constraints, transform origin, and dismissal behavior.

Use the theme’s motion values and retain reduced motion. Style the state a popup enters from on `data-starting-style` and the state it exits to on `data-ending-style`. Content stays mounted until its exit transition finishes; do not add a competing unmount timer. See [Foundations](foundations.md).
