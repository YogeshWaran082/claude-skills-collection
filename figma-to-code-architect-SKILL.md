---
name: figma-to-code-architect
description: Convert UI designs (Figma links or exports, screenshots, specs, design tokens) into clean, responsive, component-based code in React, Tailwind CSS or plain HTML/CSS. Use when the user asks to implement, build, port or "turn this design into code", or provides design tokens.
---

# Figma-to-Code Architect

Translate designs into maintainable component code that matches the design at every breakpoint.

## Workflow
1. **Inventory the design**: list screens, sections, repeated patterns, interactive states and assets. If Figma tools are available, read the actual node data (layout, tokens, text, assets) rather than guessing from a screenshot.
2. **Extract tokens** into a single source of truth:
   - Colors, typography (family, size, weight, line-height, tracking), spacing, radius, shadows, breakpoints.
   - Map them to CSS variables and Tailwind theme extensions. Match existing project tokens before inventing new ones.
3. **Plan the component tree**: atoms (Button, Input, Badge, Icon) -> molecules (Card, FormField, NavItem) -> organisms (Header, Hero, PricingTable) -> page. Reuse over duplication.
4. **Implement** top-down: layout skeleton, components, states, then responsive behavior.
5. **Verify** against the design: spacing, font sizes, colors, states. Report any deviation.

## Layout translation rules
- Figma auto-layout maps to flexbox (`flex`, `gap`, `items-*`, `justify-*`); grids map to CSS grid.
- "Hug" maps to content sizing; "Fill" maps to `flex-1`/`w-full`; "Fixed" only when truly fixed.
- Never use absolute positioning for ordinary layout; reserve it for overlays and decorative elements.
- Convert px to rem (16px = 1rem) and prefer Tailwind scale values; use arbitrary values `[]` only when the design demands it.
- Use `max-w-*` containers and fluid widths, not fixed 1440px frames.

## Responsiveness
- Designs usually show 1-2 breakpoints. Infer the rest: stack columns below `md`, scale type with `clamp()`, collapse nav into a menu, keep touch targets at 44px.
- Breakpoints: sm 640, md 768, lg 1024, xl 1280. Mobile-first classes.
- Images: `object-cover`, explicit aspect ratio, `loading="lazy"` where applicable.
- Check mentally at 360, 768 and 1280, and list the assumptions made.

## Component rules
- One component per file, PascalCase; props typed (TypeScript interfaces) with sensible defaults.
- Variants via `cva` or a props map (`variant`, `size`), not copy-pasted class strings.
- Composition: use `children` and slots instead of many boolean props.
- Implement hover, focus-visible, active, disabled, loading and error states even if the design shows only default, following the design's token logic.
- Accessibility: semantic elements, labels, aria attributes, keyboard operation, alt text.

## Assets
- Export SVG icons as inline components (`currentColor`). Use an icon library if icons match (lucide, heroicons).
- Name assets semantically. Flag any placeholder URLs clearly.

## Output structure
```
/src
  /styles/tokens.css (or tailwind.config.ts theme)
  /components/ui/Button.tsx
  /components/sections/Hero.tsx
  /pages/Home.tsx
```
Provide: token file, components, page composition, and a short "Deviations & assumptions" list.

## Example token mapping
```ts
// tailwind.config.ts
theme: { extend: {
  colors: { brand: { 500: '#3B2A20' }, accent: '#D9822B' },
  fontFamily: { display: ['Fraunces','serif'], sans: ['Inter','sans-serif'] },
  borderRadius: { card: '12px' },
}}
```

## Checklist
- [ ] Tokens centralized; no hard-coded hex in components
- [ ] No fixed-width layouts; responsive at 360/768/1280
- [ ] Reusable components with variants and states
- [ ] Accessible semantics
- [ ] Deviations from the design listed
