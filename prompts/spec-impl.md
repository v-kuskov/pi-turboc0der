---
description: Implement planned spec
argument-hint: "feature slug - name from .specs/{slug}"
---

Orchestrate implementation for given feature using TDD, subagents and self-verification cycle.

## Pre-flight

- [ ] Read plan `.specs/{feature}/plan.md` — confirm `status: approved`.
- [ ] Explore the codebase enough to understand existing types, interfaces, module structure
and test patterns relevant to the plan.
- [ ] Run verification and tests to confirm clean start.

<details>
<summary><b>Rules</b></summary>

- **DO NOT** edit code, **ALWAYS** delegate.
- One task at a time.
- Review-gate per task, do NOT proceed until current task passes review.
- Commit per task, each verified + reviewed task gets one intermediate commit.
- Full test suite at end, run it before merging.
- Full Verification at the end means running the complete test suite (build + lint + all tests). Same commands as per-task verification, but run against the full codebase.

</details>

## 1. Create Feature Base Branch

```bash
git checkout -b "feat/{feature}"
```

## 2. Implement plan one task at a time

- [ ] For each task, in execution order: update the task's frontmatter `status` from `planned` to `in-progress`.
- [ ] Run the `tdd` agent (`agents/tdd.md`) for that task.

Provide agent with:

- Full task description.
- References to related files.
- All necessary context.
- Build/test commands (from project context).

Agent must implement exactly one task. Wait for agent to complete. Restart agent on errors.

## 3. Review

Launch 2 instances of the reviewer agent (`agents/reviewer.md`) in parallel:

1. Check if code is correct and meets standards and best practices.
2. Check if code does what it's supposed to do against the spec.

Pass to each agent:

- Full task description.
- Parts of the spec this task implemented.
- List of changed files.

## 4. Verify

If review returned any blocking/critical/major issues or verification failed → go to fix loop.

<details>
<summary><b>Fix Loop</b></summary>

When build or test output contains blocking, critical, or major failures:

1. Collect the failure details.
2. **Spec error check** — if failure indicates spec is wrong (wrong behavior, missing cases, contradictory requirements): hard stop. Report error and abort. Do NOT fix spec.
3. **Code error** — go back to step 2, re-launch it, add failure details to the prompt.
4. No more than 3 fix iterations per task.
5. If 3 iterations exhausted, mark task as `failed`, report in final output, and stop.

#### Unrecoverable failure (build system broken, deps missing, infrastructure)

- Reset last changes.
- Leave already-implemented tasks intact.
- Report what failed and what's salvageable.

</details>

## Mark Task Done

Update the task `status` from `in-progress` to `done`.

## Commit

```powershell
git add <list of changed files>
git commit -m "<short description what was done as full sentences>" -m "<list of changes, short explanation what was changed, and why>"
```

One commit per task. Follow project-specific commit rules.

## Move to Next Task

Proceed to the next task in the ordered list.

## Full Verification

After ALL tasks are committed run full verification and tests.
If verification fails, fix it.

## Report

Return:

- Feature description.
- Tasks implemented and committed (ordered list).
- Per-task: review outcome, fix iterations.
- Any unresolved issues.
