---
name: commit-commands
description: Execute clean git commit, branch, stash, interactive rebase, and PR-prep commands safely. Use when staging changes, crafting atomic commits, cleaning branch history, or resolving merge conflicts.
---

# Git Commit & Branch Commands

Keep git history clean, atomic, and safe to review or revert.

## Workflow
1. **Inspect Before Staging**: Run `git status` and `git diff` to ensure no secrets, debug logs, or unrelated files are included.
2. **Atomic Commits**: Group related changes into logical commits using Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
3. **Branch Hygiene**:
   - Branch from up-to-date `main`: `git switch -c feat/<short-name>`
   - Sync cleanly: `git fetch origin && git rebase origin/main`
4. **Safety Rules**:
   - Never force-push (`--force`) to shared `main`/`master`; use `--force-with-lease` only on personal feature branches.
   - Never skip hooks (`--no-verify`) unless explicitly instructed.
