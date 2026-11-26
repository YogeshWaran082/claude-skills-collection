---
name: ci-cd-github-actions
description: Write and debug GitHub Actions workflows, Dockerfiles, and CI/CD pipelines with caching, least-privilege permissions, and fast feedback loops. Use when setting up CI, Docker builds, or automated deployments.
---

# CI/CD & GitHub Actions Helper

Build fast, reproducible, secure CI/CD pipelines.

## Best Practices
- **Least Privilege**: Set `permissions: contents: read` at the workflow level; elevate only per-job if needed.
- **Pin Actions**: Pin third-party actions to major versions or commit SHAs (`actions/checkout@v4`).
- **Fast Feedback**: Run lint/typecheck/unit tests in parallel; cache dependencies (`actions/cache` or `setup-*` built-in cache).
- **Concurrency**: Cancel stale PR runs using `concurrency: { group: ${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true }`.
- **Docker**: Use multi-stage builds, non-root users, `.dockerignore`, and minimal base images (`alpine` or `distroless`).

## Output
Provide ready-to-paste YAML/Dockerfile with brief notes on required secrets or branch rules.
