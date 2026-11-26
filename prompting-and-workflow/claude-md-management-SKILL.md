---
name: claude-md-management
description: Create, audit, and maintain CLAUDE.md project memory files with concise architecture context, build/test commands, coding conventions, and guardrails. Use when setting up or updating CLAUDE.md in a repository.
---

# CLAUDE.md Management

Keep `CLAUDE.md` concise, high-signal, and accurate so every coding session starts with the right context.

## Recommended Sections
1. **Project Overview**: 2–3 lines on what the app does and its tech stack.
2. **Key Commands**: Exact dev, build, lint, typecheck, and test commands.
3. **Architecture & Directory Map**: Where core modules, routes, and tests live.
4. **Conventions & Patterns**: Naming, error handling, state management, and styling rules.
5. **Guardrails / Gotchas**: Things never to touch, env vars needed, or common pitfalls.

## Maintenance Rules
- Keep it under ~150–200 lines; move deep reference docs to separate files and link them.
- Only document commands and paths verified in the repo; update immediately when workflows change.
