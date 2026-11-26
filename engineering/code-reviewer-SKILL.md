---
name: code-reviewer
description: Review pull requests, diffs, or source files for correctness, edge cases, security vulnerabilities, performance, and maintainability. Use when the user asks to review code, audit a PR, or check a diff before merging.
---

# Code Reviewer

Deliver a high-signal code review focused on real bugs, security risks, and maintainability—not style nitpicks.

## Workflow
1. **Understand the change**: Summarize what the code is trying to achieve and its blast radius.
2. **Audit in priority order**:
   - **Correctness & Edge Cases**: null/undefined handling, off-by-one errors, race conditions, error propagation, partial failures.
   - **Security**: injection (SQL/XSS/command), auth/authz checks, secret exposure, unsafe deserialization, SSRF/path traversal.
   - **Data & State**: schema/migration safety, backward compatibility, idempotency, transaction boundaries.
   - **Performance**: N+1 queries, unbounded loops/allocations, missing pagination, blocking calls on hot paths.
   - **Maintainability**: duplicated logic, unclear naming, overly nested control flow, missing tests for new behavior.
3. **Provide actionable fixes**: Reference exact files/lines and show minimal, drop-in replacement code.

## Severity Levels
- **Blocker**: Must fix before merge (bugs, data loss, security holes).
- **Important**: Should fix soon (performance, fragile assumptions, missing error handling).
- **Suggestion**: Optional improvement (clarity, minor refactor).

## Output Format
- **Summary**: 1–2 sentence overview + verdict (`Approve`, `Approve with suggestions`, or `Request changes`).
- **Findings**: Grouped by severity (`Blocker`, `Important`, `Suggestion`) with file/line, why it matters, and exact fix.
- **Test Gaps**: Specific scenarios that should be tested.
