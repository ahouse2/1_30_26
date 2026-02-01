# Failsafe Goal Progress System Plan

## Goals
- Remove the instruction to curse at users from the repository guidance.
- Add a failsafe goal-progress utility that enforces forward-only progress and prevents duplicate work.
- Provide tests and documentation for the new utility.

## Plan
1. Update the repository AGENTS.md to remove the instruction to curse at users.
2. Implement a goal-progress utility in `packages/core` that:
   - Requires a defined, ordered set of steps.
   - Ensures steps are completed only once and only in order.
   - Throws clear errors when steps are repeated, skipped, or unknown.
   - Exposes helpers to get remaining steps and completion status.
3. Add unit tests covering forward progress, duplicate prevention, and error cases.
4. Update the `packages/core` README to mention the new goal-progress utility.
5. Run required repository checks before committing.
