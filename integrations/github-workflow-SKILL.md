---
name: github-workflow
description: Manage GitHub pull requests, issues, labels, milestones, reviews, and releases using the gh CLI and GitHub best practices. Use when triaging issues, opening/reviewing PRs, or automating GitHub workflows.
---

# GitHub Workflow

Streamline GitHub PRs, issues, and releases with consistent structure and `gh` CLI commands.

## Core Workflows
- **Pull Requests**: Link related issues (`Closes #123`), summarize what/why/testing, request targeted reviewers, and keep PRs small and focused.
- **Issue Triage**: Classify (`bug`, `enhancement`, `docs`), add repro steps/acceptance criteria, and assign priority/milestone.
- **Releases & Tags**: Use semantic versioning (`vMAJOR.MINOR.PATCH`), generate release notes from merged PRs, and highlight breaking changes.
- **Quick `gh` Commands**:
  - `gh pr create --fill` / `gh pr checks --watch`
  - `gh pr review --approve` / `gh pr merge --squash`
  - `gh issue list --state open --label bug`
