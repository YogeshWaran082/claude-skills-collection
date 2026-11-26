---
name: design-ui-ux-suite
description: Complete design suite covering frontend UI/UX (React, Tailwind), graphic and poster layouts, brand identity systems, Figma-to-code conversion, and design critique audits. Use for any design, UI, UX, branding, poster, banner, design-to-code, or design review request.
---

# Design & UI/UX Suite

This suite has five modules. Pick the module(s) that match the request and combine them when needed (e.g. apply Module 3 brand rules inside Modules 1 or 2, and run Module 5 on your own output before delivering).

1. Frontend UI Designer
2. Graphic and Poster Designer
3. Brand Identity System
4. Figma-to-Code Architect
5. Design Critique Auditor

---

# MODULE 1


## Frontend UI Designer

Produce interfaces that look designed by a person with taste, not generated from a template.

### Workflow
1. **Clarify the brief in one pass** (only if missing): audience, goal of the screen, platform (web/mobile), any brand. If a brand exists, apply the `brand-identity-system` skill if available.
2. **Commit to a design direction** before coding. State it in 2 lines: mood (e.g. "editorial, calm, high-contrast"), and one signature move (an oversized number, an asymmetric hero, a tinted surface system).
3. **Define tokens first**: palette (1 primary, 1 accent, neutral ramp, semantic success/warn/error), type scale, spacing scale, radius, shadow. Put them in CSS variables or the Tailwind config.
4. **Build mobile-first**, then enhance at `sm`, `md`, `lg`.
5. **Self-review** against the checklist below and fix before delivering.

### Typography
- Max 2 families: one display/heading, one text. Use a real pairing (e.g. Fraunces + Inter, Space Grotesk + IBM Plex Sans), not system default alone.
- Scale (ratio ~1.25): 12 / 14 / 16 / 20 / 25 / 31 / 39 / 49 / 61. Body 16px min, line-height 1.5-1.65; headings 1.1-1.25.
- Line length 55-75 characters for prose. Use `max-w-prose`.
- Weight carries hierarchy: 400 body, 500-600 UI labels, 700+ headings. Avoid more than 3 weights.
- Tracking: tighten large headings (`tracking-tight`), loosen small caps/labels (`tracking-wide`).

### Spacing and layout
- Use a 4/8px grid. Only Tailwind scale values (1, 2, 3, 4, 6, 8, 12, 16, 24).
- Group by proximity: space inside a group is at most half the space between groups.
- Consistent page gutters (16px mobile, 24-32px tablet, container max 1200px desktop).
- Align to a 12-col grid on desktop; no element floats off-grid without a reason.
- Touch targets at least 44x44px. Generous whitespace beats borders: prefer spacing and tonal surfaces to boxes within boxes.

### Color
- Neutral ramp does 90% of the work; accent used sparingly for the primary action and key data.
- Text contrast: 4.5:1 for body, 3:1 for large text and UI borders (WCAG AA). Never gray-400 text on white.
- Provide dark mode through tokens (`prefers-color-scheme` or `dark:`), not inverted hacks.

### Accessibility (non-negotiable)
- Semantic HTML (`header`, `nav`, `main`, `button` for actions, `a` for navigation).
- Visible focus ring on all interactive elements (`focus-visible:ring-2 ring-offset-2`).
- Labels bound to inputs; error messages tied with `aria-describedby`; icon-only buttons have `aria-label`.
- Respect `prefers-reduced-motion`. Never convey state by color alone.
- Images have meaningful `alt`, or `alt=""` if decorative.

### Avoid generic "AI template" looks
- No purple-to-blue gradient hero with centered text and three identical cards by default.
- No emoji as icons; use a consistent icon set (lucide-react) at one stroke width.
- No uniform `rounded-2xl shadow-lg` on everything. Vary elevation intentionally: flat by default, shadow only on floating layers.
- No lorem ipsum or "Feature One". Write realistic, specific copy.
- Break monotony: vary section layouts (split, full-bleed, asymmetric, bento), but keep rhythm consistent.

### Components and states
Every interactive component needs: default, hover, focus-visible, active, disabled, loading, and error states. Empty states get helpful copy and a primary action. Add skeletons for loading, not just spinners.

### Motion
150-250ms ease-out for micro-interactions; 300-400ms for layout. Animate `transform` and `opacity` only. One orchestrated page-load reveal beats scattered effects.

### Code standards
- React function components, small and composable; props typed (TypeScript preferred).
- Tailwind utilities with extracted components for repeats; use `clsx`/`cva` for variants.
- No inline magic numbers: use tokens. No `div` soup.

### Example (direction statement)
> Direction: "Warm editorial fintech." Display: Fraunces; text: Inter. Palette: ink #14120F, paper #FAF7F2, accent #E2531F. Signature: oversized tabular numerals on cards with a thin top rule instead of shadows.

### Final checklist
- [ ] Clear single primary action per screen
- [ ] Contrast AA, focus visible, keyboard operable
- [ ] Works at 360px, 768px, 1280px
- [ ] Only tokens used; max 2 fonts
- [ ] All states designed; realistic copy

---

# MODULE 2


## Graphic and Poster Designer

Build layouts that communicate in under 3 seconds and look intentional.

### Workflow
1. **Collect the brief**: purpose, audience, exact copy (headline, supporting line, CTA, date/place/contact), format and size, brand assets. Ask only for what is missing.
2. **Pick the canvas**:
   - Instagram post 1080x1080 (or 1080x1350), Story/Reel 1080x1920, Facebook/LinkedIn banner 1200x628, X header 1500x500, YouTube thumbnail 1280x720, A4 poster 210x297mm (2480x3508 at 300dpi), A5 flyer 148x210mm, US Letter 8.5x11in.
3. **Set the grid**: 12-col (poster) or 4-col (social) with outer margin of 5-8% of the width. Keep critical content inside the safe zone (Stories: keep 250px top and bottom clear).
4. **Rank content** into three levels, then design the reading path (Z-pattern, F-pattern, or a strong central axis).
5. **Build as SVG or HTML/CSS** with inline assets only; export-ready, with sizes matching the canvas.
6. **Review** with the checklist.

### Visual hierarchy
- Level 1 (headline): 1 element, dominant, roughly 2.5-4x the size of body text.
- Level 2 (support/subhead): 40-60% of headline size.
- Level 3 (details/CTA/legal): smallest but still legible (24px minimum on a 1080 social canvas).
- Create contrast through size, weight, color and space; use at least two of these per level jump.
- One focal point. If everything shouts, nothing is read.

### Layout rules
- Align to the grid; use a single alignment axis (left or center), not both.
- Whitespace is a feature: aim for 30-40% empty space.
- Rule of thirds or golden-ratio placement for imagery.
- Group related items; keep CTA and contact details together in the final reading position.
- Print bleed: extend backgrounds 3mm past trim; keep text 5mm inside trim.

### Typography
- Max 2 typefaces; display for the headline, clean sans for details.
- Headlines: 3-8 words, tight leading (0.95-1.1), slightly negative tracking at large sizes.
- Never set long text in all caps; limit all caps to short labels with positive tracking.
- Left-align multi-line text; center only short statements.

### Color and contrast
- Palette of 3-4 colors: dominant (60%), secondary (30%), accent (10%), plus neutral.
- Text-to-background contrast at least 4.5:1 (7:1 for small print). Over photos, add a gradient scrim or a 50-70% opacity solid panel.
- Use the accent only for the CTA and one key word.
- Test in grayscale: the hierarchy must still read.

### Imagery
- Use SVG shapes, patterns, or provided images. No cluttered stock-style collages.
- Crop boldly. One hero image or illustration, not five.
- Keep icons in one style and stroke weight.

### Social-specific rules
- Hook headline readable at thumbnail size (about 120px wide).
- One message per graphic. Carousel: consistent template, numbered, last slide is the CTA.
- Logo small (8-12% of width), consistent corner placement.

### Example brief to layout
> "Jazz Night, Fri 14 March, 8pm, Blue Door Cafe."
> Canvas 1080x1350. Dark ink background #111111, headline "JAZZ NIGHT" 180px condensed display in white; date in accent #FFB000 at 64px; venue and address at 32px; thin rule dividers; a decorative circle motif cropped at the top right.

### Delivery
Provide the SVG/HTML file, canvas size, palette hex codes, fonts used, and export steps if print is needed.

### Checklist
- [ ] Reads in 3 seconds; one focal point
- [ ] Contrast at least 4.5:1; passes grayscale test
- [ ] Margins and safe zones respected
- [ ] Copy exactly as supplied; no typos
- [ ] CTA obvious

---

# MODULE 3


## Brand Identity System

Treat the brand spec as law. Define it once, then apply it identically everywhere.

### Workflow
1. **Check for an existing brand.** If the user provides colors, fonts, logo or guidelines, use them verbatim. Never "improve" them unless asked.
2. **If none exists, build one** by asking at most 4 questions: what the company does, audience, 3 personality words, references to echo or avoid.
3. **Output a Brand Spec** (template below) and confirm it before producing assets.
4. **Apply the spec** to every deliverable and state at the end which tokens were used.
5. **Audit** each output against the rules; fix any drift.

### Brand Spec template
```
BRAND: <name>
Tagline: <line>
Personality: <3 adjectives>

COLORS
Primary      #______  (~60% / main surfaces and key headings)
Secondary    #______  (~30% / supporting)
Accent       #______  (~10% / CTA and highlights only)
Neutral dark #______  Neutral light #______
Semantic: success #____ warning #____ error #____
Approved text/background pairs (all >= 4.5:1): ...

TYPOGRAPHY
Heading: <font>, weights ___  | Body: <font>, weights ___
Fallbacks: <stack>
Scale: H1 __ / H2 __ / H3 __ / Body __ / Caption __

LOGO
Versions: full, icon, mono, reversed
Clear space: height of the logo's "x" on all sides
Minimum size: __px digital / __mm print
Placement: top-left on web; bottom-right on posters; centered on sign-offs
Don'ts: no stretching, recoloring, shadows, rotation, or busy backgrounds

VOICE & TONE
Voice: <e.g. warm, direct, expert>
Do: <3 examples>  Don't: <3 examples>
Sample headline / CTA / error message in brand voice
```

### Building a palette (when none exists)
- Choose the primary from the brand's emotion: trust (blues), energy (orange/red), growth (greens), premium (deep neutrals, gold), creativity (violet/magenta).
- Derive the accent as a complementary or split-complementary hue with similar saturation.
- Build a 50-900 tint/shade ramp for the primary and neutral.
- Verify every text/background pair with WCAG contrast; list failing pairs as forbidden.

### Font pairing rules
- One expressive display face plus one neutral workhorse (contrast in style, harmony in proportion).
- Examples: Playfair Display + Source Sans 3 (editorial); Poppins + Inter (friendly tech); DM Serif Display + DM Sans (boutique); Space Grotesk + IBM Plex Sans (technical).
- Use Google Fonts unless the user supplies licensed fonts. Always provide fallbacks.

### Application rules
- Only the exact hex codes from the spec; no near-matches.
- Accent color never exceeds roughly 10% of an artwork's area.
- Logo always uses an approved version, with clear space respected and contrast verified against its background.
- Voice applies to all copy: headlines, buttons, alt text, emails.
- When a request conflicts with the brand (e.g. "make it neon"), flag the conflict, follow the brand, and offer an off-brand variant only if asked.

### Consistency check (run on every output)
- [ ] Only spec colors and fonts used
- [ ] Logo version, size, placement and clear space correct
- [ ] Contrast pairs approved
- [ ] Copy matches voice and tone
- [ ] Same spacing/radius/shadow language as previous assets

### Example
> Brand "Kaveri Coffee": primary #3B2A20, secondary #F4EBDD, accent #D9822B; Fraunces headings, Inter body; voice: warm, unfussy, a little playful. Poster CTA: "Come in, the kettle's on." Not: "Experience premium coffee solutions."

---

# MODULE 4


## Figma-to-Code Architect

Translate designs into maintainable component code that matches the design at every breakpoint.

### Workflow
1. **Inventory the design**: list screens, sections, repeated patterns, interactive states and assets. If Figma tools are available, read the actual node data (layout, tokens, text, assets) rather than guessing from a screenshot.
2. **Extract tokens** into a single source of truth:
   - Colors, typography (family, size, weight, line-height, tracking), spacing, radius, shadows, breakpoints.
   - Map them to CSS variables and Tailwind theme extensions. Match existing project tokens before inventing new ones.
3. **Plan the component tree**: atoms (Button, Input, Badge, Icon) -> molecules (Card, FormField, NavItem) -> organisms (Header, Hero, PricingTable) -> page. Reuse over duplication.
4. **Implement** top-down: layout skeleton, components, states, then responsive behavior.
5. **Verify** against the design: spacing, font sizes, colors, states. Report any deviation.

### Layout translation rules
- Figma auto-layout maps to flexbox (`flex`, `gap`, `items-*`, `justify-*`); grids map to CSS grid.
- "Hug" maps to content sizing; "Fill" maps to `flex-1`/`w-full`; "Fixed" only when truly fixed.
- Never use absolute positioning for ordinary layout; reserve it for overlays and decorative elements.
- Convert px to rem (16px = 1rem) and prefer Tailwind scale values; use arbitrary values `[]` only when the design demands it.
- Use `max-w-*` containers and fluid widths, not fixed 1440px frames.

### Responsiveness
- Designs usually show 1-2 breakpoints. Infer the rest: stack columns below `md`, scale type with `clamp()`, collapse nav into a menu, keep touch targets at 44px.
- Breakpoints: sm 640, md 768, lg 1024, xl 1280. Mobile-first classes.
- Images: `object-cover`, explicit aspect ratio, `loading="lazy"` where applicable.
- Check mentally at 360, 768 and 1280, and list the assumptions made.

### Component rules
- One component per file, PascalCase; props typed (TypeScript interfaces) with sensible defaults.
- Variants via `cva` or a props map (`variant`, `size`), not copy-pasted class strings.
- Composition: use `children` and slots instead of many boolean props.
- Implement hover, focus-visible, active, disabled, loading and error states even if the design shows only default, following the design's token logic.
- Accessibility: semantic elements, labels, aria attributes, keyboard operation, alt text.

### Assets
- Export SVG icons as inline components (`currentColor`). Use an icon library if icons match (lucide, heroicons).
- Name assets semantically. Flag any placeholder URLs clearly.

### Output structure
```
/src
  /styles/tokens.css (or tailwind.config.ts theme)
  /components/ui/Button.tsx
  /components/sections/Hero.tsx
  /pages/Home.tsx
```
Provide: token file, components, page composition, and a short "Deviations & assumptions" list.

### Example token mapping
```ts
// tailwind.config.ts
theme: { extend: {
  colors: { brand: { 500: '#3B2A20' }, accent: '#D9822B' },
  fontFamily: { display: ['Fraunces','serif'], sans: ['Inter','sans-serif'] },
  borderRadius: { card: '12px' },
}}
```

### Checklist
- [ ] Tokens centralized; no hard-coded hex in components
- [ ] No fixed-width layouts; responsive at 360/768/1280
- [ ] Reusable components with variants and states
- [ ] Accessible semantics
- [ ] Deviations from the design listed

---

# MODULE 5


## Design Critique Auditor

Give honest, specific, actionable critique. Every problem comes with a measurable fix.

### Workflow
1. **Identify context**: screen purpose, user, platform, the primary task. If unclear, state your assumption.
2. **Inspect systematically** in this order: hierarchy, layout/alignment, spacing, typography, color/contrast, components/states, UX flow, accessibility, responsiveness, consistency.
3. **Rate and prioritize** each finding: Critical (blocks task or fails accessibility), Major (hurts clarity or trust), Minor (polish).
4. **Provide exact fixes**: specific values (px, hex, class names, code), not vague advice.
5. **Summarize** with a score and a top-3 action list.

### What to check
**Hierarchy & focus**: One clear primary action and focal point? Is the page purpose understood in 5 seconds? Do size, weight and color match importance?

**Alignment & layout**: Consistent left edges and baselines? Grid respected? Equal gutters? Optical alignment of icons and text? Uneven card heights or orphaned items?

**Spacing**: Consistent scale (4/8px)? Proximity grouping correct? Consistent component padding? Cramped or over-airy regions?

**Typography**: Max 2 families? Body at least 16px (14px minimum in dense UI)? Line-height 1.4-1.6? Line length 45-75 characters? Distinct heading steps? Too many weights?

**Color & contrast**: Measure ratios. Body text at least 4.5:1, large text/UI 3:1. Color-only state indicators? Excess accent usage? Palette cohesion? Dark-mode parity?

**Components & states**: Do buttons look pressable? Hover, focus, disabled, loading, error and empty states present? Consistent radius, icon style, borders?

**UX flow**: Steps/clicks to goal; clear labels (verbs, not "Submit"); form length and inline validation; error recovery; feedback after actions; navigation clarity and current location; destructive actions confirmed or undoable.

**Accessibility**: Focus visibility, keyboard order, labels, alt text, semantic structure, 44px touch targets, motion preferences, 200% zoom without breakage.

**Responsiveness**: Check 360 / 768 / 1280 widths. Overflow, truncation, tiny tap targets, hidden critical actions, fixed widths, image scaling, sticky elements covering content.

### Report format
```
### Summary
Overall: X/10 | Strongest: ... | Biggest risk: ...

### Findings
### [Critical] <short title>
- Where: <element/location or file:line>
- Problem: <what and why it matters>
- Fix: <exact change>  e.g. `text-gray-400 (#9CA3AF, 2.5:1)` -> `text-gray-600 (#4B5563, 7.5:1)`

### [Major] ...
### [Minor] ...

### Quick wins (under 30 min)
1. ...
### Top 3 priorities
1. ...
```

### Rules
- Be specific: cite the element and a number. Replace "improve spacing" with "increase the gap between card and heading from 8px to 24px".
- When reviewing code, quote the line and give the corrected snippet.
- When reviewing a screenshot, estimate measurements and say they are estimates.
- Balance critique with 2-3 genuine strengths worth keeping.
- Don't rewrite the design to personal taste; flag only issues that harm usability, clarity, consistency or accessibility.
- If asked, offer a corrected version (code or revised layout) after the report.

### Example finding
### [Critical] Low-contrast secondary text
- Where: card description under the "Pricing" heading
- Problem: #9CA3AF on #FFFFFF is about 2.5:1, below the 4.5:1 AA threshold.
- Fix: change to #4B5563 (about 7.5:1) and raise the size from 13px to 14px.

