---
name: brand-identity-system
description: Define and strictly apply a brand identity (hex color palette, font pairings, tone of voice, logo placement and clear-space rules) consistently across every output. Use when the user shares or wants to create brand guidelines, says "on brand", or asks for any asset that must follow a brand.
---

# Brand Identity System

Treat the brand spec as law. Define it once, then apply it identically everywhere.

## Workflow
1. **Check for an existing brand.** If the user provides colors, fonts, logo or guidelines, use them verbatim. Never "improve" them unless asked.
2. **If none exists, build one** by asking at most 4 questions: what the company does, audience, 3 personality words, references to echo or avoid.
3. **Output a Brand Spec** (template below) and confirm it before producing assets.
4. **Apply the spec** to every deliverable and state at the end which tokens were used.
5. **Audit** each output against the rules; fix any drift.

## Brand Spec template
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

## Building a palette (when none exists)
- Choose the primary from the brand's emotion: trust (blues), energy (orange/red), growth (greens), premium (deep neutrals, gold), creativity (violet/magenta).
- Derive the accent as a complementary or split-complementary hue with similar saturation.
- Build a 50-900 tint/shade ramp for the primary and neutral.
- Verify every text/background pair with WCAG contrast; list failing pairs as forbidden.

## Font pairing rules
- One expressive display face plus one neutral workhorse (contrast in style, harmony in proportion).
- Examples: Playfair Display + Source Sans 3 (editorial); Poppins + Inter (friendly tech); DM Serif Display + DM Sans (boutique); Space Grotesk + IBM Plex Sans (technical).
- Use Google Fonts unless the user supplies licensed fonts. Always provide fallbacks.

## Application rules
- Only the exact hex codes from the spec; no near-matches.
- Accent color never exceeds roughly 10% of an artwork's area.
- Logo always uses an approved version, with clear space respected and contrast verified against its background.
- Voice applies to all copy: headlines, buttons, alt text, emails.
- When a request conflicts with the brand (e.g. "make it neon"), flag the conflict, follow the brand, and offer an off-brand variant only if asked.

## Consistency check (run on every output)
- [ ] Only spec colors and fonts used
- [ ] Logo version, size, placement and clear space correct
- [ ] Contrast pairs approved
- [ ] Copy matches voice and tone
- [ ] Same spacing/radius/shadow language as previous assets

## Example
> Brand "Kaveri Coffee": primary #3B2A20, secondary #F4EBDD, accent #D9822B; Fraunces headings, Inter body; voice: warm, unfussy, a little playful. Poster CTA: "Come in, the kettle's on." Not: "Experience premium coffee solutions."
