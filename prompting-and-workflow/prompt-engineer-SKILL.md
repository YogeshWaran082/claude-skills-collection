---
name: prompt-engineer
description: Design, structure, and refine system prompts, few-shot examples, and evaluation criteria for LLMs and AI agents. Use when building AI features, agent instructions, or debugging inconsistent model outputs.
---

# Prompt Engineer

Turn vague instructions into reliable, testable prompts.

## Workflow
1. **Clarify the Task**: Input format, desired output format (JSON/Markdown/text), constraints, and failure modes.
2. **Structure the Prompt**:
   - **Role & Goal**: Concise identity and objective.
   - **Rules & Boundaries**: Explicit dos/don'ts and edge-case handling.
   - **Process**: Step-by-step reasoning or workflow.
   - **Output Schema**: Exact format with 1–2 diverse few-shot examples.
3. **Add Evals**: Define 3–5 test cases (normal, edge, adversarial) to verify prompt reliability.
