:
---
name: ralph-loop
description: Self-referential development loop that continues until completion.
---

# Ralph Loop

A Ralph loop is a self-referential work session. The agent keeps going until the task is done, without asking the user for permission to continue.

## Protocol

1. State the goal in one line.
2. Do the next concrete step.
3. Verify the step (tests, diagnostics, manual QA, or diff review).
4. Update todos.
5. If done, stop and summarize. Otherwise, continue from step 2.

## Rules

- Never ask "should I continue?" — continue automatically.
- On blockers, try one alternative approach before escalating.
- Document non-obvious decisions in a notepad under `.omo/notepads/`.
- Finish 100%; do not stop at "looks good".
