# Design

## Direction

Jev Marshal uses a railway signal cabin as its visual system. A pull request is a route. Repository rules are signals. A failed rule ends in a clear HOLD state.

## Color

- Amber `#f8a928`: primary field and action surface.
- Paper `#f7e9e8`: route board and reading surface.
- Ink `#131313`: type, routes, rules, and dark sections.
- Signal red `#d84737`: blocked states.
- Signal green `#266f2d`: compliant states.

Use flat color fields. Do not use gradients, glass, glow, or soft card shadows.

## Type

- Anton: large display headings and control labels.
- Roboto Condensed: compact signal and decision labels.
- Platform sans: body text.
- Monospace: code only.

Headings are short, direct, and dense. Body copy follows STE100 principles.

## Layout

Use hard dividers, square corners, asymmetric fields, and generous empty space. The first viewport splits into an amber statement field and a paper route board. Later sections use tables and large type, not card grids.

## Motion

The route draws once. Signal lamps resolve in sequence. Content is visible without motion. Respect `prefers-reduced-motion`.

## Responsive behavior

Desktop keeps the split route-board composition. Mobile stacks the statement, route board, process, decisions, privacy note, and action. Keep every status label in text. Do not depend on color alone.

## Accessibility

Use semantic landmarks and headings. Provide visible focus styles, a skip link, readable contrast, descriptive SVG text, and text labels for every decision.
