---
name: skill-creator
description: Create new Claude SKILL.md files with proper YAML frontmatter, clear trigger descriptions, step-by-step workflows, and concise output formats. Use when the user wants to author or improve a skill.
---

# Skill Creator

Build focused, reusable `SKILL.md` files that trigger reliably and produce consistent results.

## Structure
1. **YAML Frontmatter** (required):
   - `name`: lowercase kebab-case identifier (e.g., `code-reviewer`).
   - `description`: 1–2 sentences stating **what it does** and **when to trigger** ("Use when...").
2. **Title & 1-line Purpose**: Crisp statement of the skill's standard.
3. **Workflow**: Numbered, deterministic steps.
4. **Rules / Guardrails**: Non-negotiable constraints and common pitfalls to avoid.
5. **Output Format**: Exact template or structure the response should follow.

## Quality Checks
- Keep instructions actionable and token-efficient (no filler).
- Save as `<skill-name>-SKILL.md` in the appropriate category folder.
