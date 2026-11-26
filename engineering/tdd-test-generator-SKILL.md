---
name: tdd-test-generator
description: Design and write unit, integration, and edge-case tests using Test-Driven Development (Red-Green-Refactor). Use when the user asks to write tests, increase coverage, or build a feature test-first.
---

# TDD Test Generator

Write deterministic, readable tests that verify behavior rather than implementation details.

## Workflow
1. **Identify the contract**: Inputs, outputs, side effects, and error conditions of the target unit or endpoint.
2. **List test cases before coding**:
   - Happy path(s)
   - Boundary values (empty, zero, max, single item, duplicates)
   - Invalid inputs and error/exception paths
   - Concurrency, retries, or state transitions (if applicable)
3. **Follow Arrange-Act-Assert (AAA)**: Keep each test focused on one behavior with a descriptive name (`should_<expected>_when_<condition>`).
4. **Isolate external dependencies**: Mock network, clock, and third-party APIs cleanly; prefer real in-memory/local logic over over-mocking.
5. **Verify failure first** (when doing TDD): Ensure tests fail for the right reason before writing the implementation.

## Rules
- Never test private internals directly; test through the public interface.
- Avoid shared mutable state between tests.
- Keep test fixtures minimal so failures are immediately obvious.
