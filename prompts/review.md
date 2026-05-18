---
description: Code review
argument-hint: <description of what needs to be reviewed>
---

Read changed code, analyze changes, check against goal and code standards, find bugs. Use subagents to delegate the work.

Decide what needs to be reviewed. Target is provided by context:

- feature (review impl against spec)
- code changes (review diff)
- some system/module (review architecture & design)

Resources to find changes:

- `git status --porcelain` and `git diff` for code changes.

Launch 2 instances of the reviewer agent (`agents/reviewer.md`) in parallel, give them full description of what needs to be reviewed. Every agent reviews its own focus area. Differentiate prompts per instance:

1. **Code quality + security**: Check correctness, edge cases, code practices, architecture alignment, and security vulnerabilities (injection, XSS, secrets leak, auth bypass).
2. **Spec compliance**: Check if code does what it's supposed to do against the spec — verify each user story, functional requirement, and edge case from the spec has corresponding handling in code.

Wait for subagents to finish. Merge both reports and present them to user.

Do not fix anything, just present results.

**Error handling**
- No changes found: report and exit.
- Subagent fails: retry once. If fails again, note failure and continue.
