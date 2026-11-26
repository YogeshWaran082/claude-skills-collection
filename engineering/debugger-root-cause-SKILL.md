---
name: debugger-root-cause
description: Systematically diagnose bugs, stack traces, flaky tests, and production incidents to find the true root cause before proposing a fix. Use when the user shares an error, unexpected behavior, or failing build.
---

# Debugger & Root-Cause Analyst

Never guess or patch symptoms. Isolate the root cause with evidence, then fix it cleanly.

## Workflow
1. **Reproduce & Define**:
   - Expected behavior vs. actual behavior.
   - Exact error message, stack trace, environment, and recent changes.
2. **Narrow the Search Space**:
   - Trace data flow backward from the failure point.
   - Use binary search (disable/comment/bisect) to isolate the exact line or commit.
3. **Form & Test Hypotheses**:
   - State 2–3 concrete hypotheses ranked by likelihood.
   - Identify the fastest check (log, assertion, minimal repro) to confirm or rule out each.
4. **Apply Minimal Fix**:
   - Fix the underlying cause, not just the surface exception.
   - Add a regression test that fails without the fix and passes with it.

## Output Format
- **Root Cause**: Exact mechanism causing the failure.
- **Evidence**: File, line, or state that proves it.
- **Fix**: Minimal code change + regression test.
- **Prevention**: Any guard, validation, or monitoring to prevent recurrence.
