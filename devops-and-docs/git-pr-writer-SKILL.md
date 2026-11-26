---
name: git-pr-writer
description: Generate clear Conventional Commits, pull request descriptions, and release changelogs from git diffs or change summaries. Use when committing code, opening a PR, or preparing release notes.
---

# Git & PR Writer

Turn raw diffs into clear, reviewer-friendly commit messages and PR descriptions.

## Conventional Commit Format
`<type>(<optional-scope>): <imperative summary under 72 chars>`
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`, `build`.
- Body (when needed): explain **why** the change was made and any breaking changes (`BREAKING CHANGE:`).

## PR Description Template
- **What**: 1–2 sentences on what changed.
- **Why**: Problem solved or ticket/context link.
- **How**: Key implementation decisions or trade-offs.
- **Testing**: Exact commands run and manual verification steps.
- **Checklist**: Migrations, env vars, or breaking changes noted.
