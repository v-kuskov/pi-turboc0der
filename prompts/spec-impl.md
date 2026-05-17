---
description: Implement planned spec
argument-hint: [feature slug]
---

Orchestrate implementation for given feature using TDD, subagents and self-verification cycle.

## Pre-flight

1. Read plan `.specs/{feature}/plan.md` — confirm `status: approved`.
2. Explore the codebase enough to understand existing types, interfaces, module structure
and test patterns relevant to the plan.
3. Run verification and tests to confirm clean start.

## Rules

- One task at the time.
- Review-gate per task, do NOT proceed until current task passes review.
- Commit per task, each verified + reviewed task gets one intermediate commit.
- Full test suite at end, run it before merging.
- *Squash all per-task commits collapsed into one consolidated commit.
- Consolidated commit message, describe what was done for the task, follow project's guidlines.
- Never change code, that's what subagents for.
- For debug order subagents to use `systematic-debugging` skill.

## Create Feature Base Branch

```bash
git checkout -b "feat/{feature}"
```

## Implement plan one task at time

For each task, in execution order:

### Implement Task

Update the task's frontmatter `status` from `planned` to `in-progress`.
Mark task as `in-progress` in task list.

Launch subagent to use TDD, provide it with

- Feature slug.
- Path to the task file.
- Paths to referenced spec files.
- Necessary context.
- Order to use `tdd` skill.

Wait for agent to complete.

### Review Task

Launch 2 reviews in parallel:

1. Check if code is correct and meets standards and best practices.
2. Check if code does what it's supposed to do against the spec.

Pass to each agent:

- Task description, with all references (spec, plan, task files)
- List of changed files (from `git diff --name-only`)
- Order to use `code-review-excellence` skill.

Wait for review agents to complete, merge results.
Review output is trusted and should not be validated.

### Verify

If review returned any blocking/critical/major issues or verification failed → go to fix loop.

### Fix Loop

When build or test output contains blocking, critical, or major failures:

1. Collect the failure details.
2. Go back to `Implement Task`, re-launch it, add failure details and follow plan from there.
3. Max 2 fix iterations per task.

### Mark Task Done

Update the task `status` from `in-progress` to `done`.

### Commit

```powershell
git add <list of changed files>
git commit -m "<short description what was done>" -m "<list of changes, short explanation what was changed, why if needed>"
```

One commit per task. Follow project-specific commit rules.

### Move to Next Task

Proceed to the next task in the ordered list.

## Full Suite Verification

After ALL tasks are committed run full verification and tests.
If verification fails, fix it.

## Phase 4: Consolidate Feature Branch

```powershell
git checkout master
git pull --rebase                          # catch any upstream changes
git checkout feat/{feature}
git rebase master                          # rebase feature onto latest master
# Verify rebase is clean
<verification and tests>
# Consolidate all intermediate commits into one
$commitCount = git rev-list --count HEAD "^(master)"
if ([int]$commitCount -gt 1) {
    $consolidatedMsg = "- <short description of functional changes that were made with `why` if needed>"
    git reset --soft master
    git commit -m $consolidatedMsg
}
# Verify squash is clean
<verification and tests>
```

## Report

Update project's context.

Return:

- Feature description.
- Tasks implemented and committed (ordered list).
- Per-task: review outcome, fix iterations.
- Squashed commit hash (on feature branch).
- Number of intermediate commits consolidated.
- Any unresolved issues.
