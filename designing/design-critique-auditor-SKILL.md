---
name: design-critique-auditor
description: Audit any UI screenshot, mockup or code for alignment, spacing, contrast, typography, UX flow, accessibility and responsiveness problems, then give prioritized, exact fixes. Use when the user asks to review, critique, audit, improve, or "what's wrong with" a design or interface.
---

# Design Critique Auditor

Give honest, specific, actionable critique. Every problem comes with a measurable fix.

## Workflow
1. **Identify context**: screen purpose, user, platform, the primary task. If unclear, state your assumption.
2. **Inspect systematically** in this order: hierarchy, layout/alignment, spacing, typography, color/contrast, components/states, UX flow, accessibility, responsiveness, consistency.
3. **Rate and prioritize** each finding: Critical (blocks task or fails accessibility), Major (hurts clarity or trust), Minor (polish).
4. **Provide exact fixes**: specific values (px, hex, class names, code), not vague advice.
5. **Summarize** with a score and a top-3 action list.

## What to check
**Hierarchy & focus**: One clear primary action and focal point? Is the page purpose understood in 5 seconds? Do size, weight and color match importance?

**Alignment & layout**: Consistent left edges and baselines? Grid respected? Equal gutters? Optical alignment of icons and text? Uneven card heights or orphaned items?

**Spacing**: Consistent scale (4/8px)? Proximity grouping correct? Consistent component padding? Cramped or over-airy regions?

**Typography**: Max 2 families? Body at least 16px (14px minimum in dense UI)? Line-height 1.4-1.6? Line length 45-75 characters? Distinct heading steps? Too many weights?

**Color & contrast**: Measure ratios. Body text at least 4.5:1, large text/UI 3:1. Color-only state indicators? Excess accent usage? Palette cohesion? Dark-mode parity?

**Components & states**: Do buttons look pressable? Hover, focus, disabled, loading, error and empty states present? Consistent radius, icon style, borders?

**UX flow**: Steps/clicks to goal; clear labels (verbs, not "Submit"); form length and inline validation; error recovery; feedback after actions; navigation clarity and current location; destructive actions confirmed or undoable.

**Accessibility**: Focus visibility, keyboard order, labels, alt text, semantic structure, 44px touch targets, motion preferences, 200% zoom without breakage.

**Responsiveness**: Check 360 / 768 / 1280 widths. Overflow, truncation, tiny tap targets, hidden critical actions, fixed widths, image scaling, sticky elements covering content.

## Report format
```
## Summary
Overall: X/10 | Strongest: ... | Biggest risk: ...

## Findings
### [Critical] <short title>
- Where: <element/location or file:line>
- Problem: <what and why it matters>
- Fix: <exact change>  e.g. `text-gray-400 (#9CA3AF, 2.5:1)` -> `text-gray-600 (#4B5563, 7.5:1)`

### [Major] ...
### [Minor] ...

## Quick wins (under 30 min)
1. ...
## Top 3 priorities
1. ...
```

## Rules
- Be specific: cite the element and a number. Replace "improve spacing" with "increase the gap between card and heading from 8px to 24px".
- When reviewing code, quote the line and give the corrected snippet.
- When reviewing a screenshot, estimate measurements and say they are estimates.
- Balance critique with 2-3 genuine strengths worth keeping.
- Don't rewrite the design to personal taste; flag only issues that harm usability, clarity, consistency or accessibility.
- If asked, offer a corrected version (code or revised layout) after the report.

## Example finding
### [Critical] Low-contrast secondary text
- Where: card description under the "Pricing" heading
- Problem: #9CA3AF on #FFFFFF is about 2.5:1, below the 4.5:1 AA threshold.
- Fix: change to #4B5563 (about 7.5:1) and raise the size from 13px to 14px.
