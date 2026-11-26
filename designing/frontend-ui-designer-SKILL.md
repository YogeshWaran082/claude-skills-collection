---
name: frontend-ui-designer
description: Design and build modern, high-craft web and mobile UI using React and Tailwind CSS with deliberate typography, spacing, color and accessibility. Use whenever the user asks for a landing page, dashboard, app screen, component, form, or any interface, or wants a UI to look more polished or less generic.
---

# Frontend UI Designer

Produce interfaces that look designed by a person with taste, not generated from a template.

## Workflow
1. **Clarify the brief in one pass** (only if missing): audience, goal of the screen, platform (web/mobile), any brand. If a brand exists, apply the `brand-identity-system` skill if available.
2. **Commit to a design direction** before coding. State it in 2 lines: mood (e.g. "editorial, calm, high-contrast"), and one signature move (an oversized number, an asymmetric hero, a tinted surface system).
3. **Define tokens first**: palette (1 primary, 1 accent, neutral ramp, semantic success/warn/error), type scale, spacing scale, radius, shadow. Put them in CSS variables or the Tailwind config.
4. **Build mobile-first**, then enhance at `sm`, `md`, `lg`.
5. **Self-review** against the checklist below and fix before delivering.

## Typography
- Max 2 families: one display/heading, one text. Use a real pairing (e.g. Fraunces + Inter, Space Grotesk + IBM Plex Sans), not system default alone.
- Scale (ratio ~1.25): 12 / 14 / 16 / 20 / 25 / 31 / 39 / 49 / 61. Body 16px min, line-height 1.5-1.65; headings 1.1-1.25.
- Line length 55-75 characters for prose. Use `max-w-prose`.
- Weight carries hierarchy: 400 body, 500-600 UI labels, 700+ headings. Avoid more than 3 weights.
- Tracking: tighten large headings (`tracking-tight`), loosen small caps/labels (`tracking-wide`).

## Spacing and layout
- Use a 4/8px grid. Only Tailwind scale values (1, 2, 3, 4, 6, 8, 12, 16, 24).
- Group by proximity: space inside a group is at most half the space between groups.
- Consistent page gutters (16px mobile, 24-32px tablet, container max 1200px desktop).
- Align to a 12-col grid on desktop; no element floats off-grid without a reason.
- Touch targets at least 44x44px. Generous whitespace beats borders: prefer spacing and tonal surfaces to boxes within boxes.

## Color
- Neutral ramp does 90% of the work; accent used sparingly for the primary action and key data.
- Text contrast: 4.5:1 for body, 3:1 for large text and UI borders (WCAG AA). Never gray-400 text on white.
- Provide dark mode through tokens (`prefers-color-scheme` or `dark:`), not inverted hacks.

## Accessibility (non-negotiable)
- Semantic HTML (`header`, `nav`, `main`, `button` for actions, `a` for navigation).
- Visible focus ring on all interactive elements (`focus-visible:ring-2 ring-offset-2`).
- Labels bound to inputs; error messages tied with `aria-describedby`; icon-only buttons have `aria-label`.
- Respect `prefers-reduced-motion`. Never convey state by color alone.
- Images have meaningful `alt`, or `alt=""` if decorative.

## Avoid generic "AI template" looks
- No purple-to-blue gradient hero with centered text and three identical cards by default.
- No emoji as icons; use a consistent icon set (lucide-react) at one stroke width.
- No uniform `rounded-2xl shadow-lg` on everything. Vary elevation intentionally: flat by default, shadow only on floating layers.
- No lorem ipsum or "Feature One". Write realistic, specific copy.
- Break monotony: vary section layouts (split, full-bleed, asymmetric, bento), but keep rhythm consistent.

## Components and states
Every interactive component needs: default, hover, focus-visible, active, disabled, loading, and error states. Empty states get helpful copy and a primary action. Add skeletons for loading, not just spinners.

## Motion
150-250ms ease-out for micro-interactions; 300-400ms for layout. Animate `transform` and `opacity` only. One orchestrated page-load reveal beats scattered effects.

## Code standards
- React function components, small and composable; props typed (TypeScript preferred).
- Tailwind utilities with extracted components for repeats; use `clsx`/`cva` for variants.
- No inline magic numbers: use tokens. No `div` soup.

## Example (direction statement)
> Direction: "Warm editorial fintech." Display: Fraunces; text: Inter. Palette: ink #14120F, paper #FAF7F2, accent #E2531F. Signature: oversized tabular numerals on cards with a thin top rule instead of shadows.

## Final checklist
- [ ] Clear single primary action per screen
- [ ] Contrast AA, focus visible, keyboard operable
- [ ] Works at 360px, 768px, 1280px
- [ ] Only tokens used; max 2 fonts
- [ ] All states designed; realistic copy
