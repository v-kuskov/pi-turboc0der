---
description: Commit changes to git
argument-hint: <description what need to be commited>
---

# Commit Workflow

Commit changes in git repository. Collect changes, formulate message, present it to user and commit after confirmation.

## Collect files

- Check what was done in this session, what files were changed.
- Check which files are stages and changed with `git status --porcelain`.
- Read changes if needed by using `git diff`.
- Stage files that has changes related to the goal `git add <file> <file>..`.
- Do not review changes, accept them as-is.
- Do not make any changes.

## Check if amend is needed

- Changes are small <= 10 lines total or <=3 lines per file.
- Changes don't affect functionality and fix minor bugs or typos
- Changes are directly related to last commit `git log-1 --format=%s`.

## Formulate list of changes

- Each logical change goes into one line describe in one sentence.
- For bugs add short explaination, including root reason and fix.
- Keep list of changes short, group and merge agressively.

## Present list to user

- Change description exactly how described below.
- Are you going to commit or amend.

Commit description examples:

```text
- Added ILogging service.
- Added implementations for ILogSing: ConsoleLogSink, FileLogSink
```

```text
Fixed wrong texture.
Reason: typo in descriptor set creation
Fix: right textures goes into correct slots
```

## Present changes to user

```markdown
**Changes**:
[What changed, what was implemented]

**Changed files**:
[list of changed files]

**Message**:
[commit message]

[list of logical changes]

```

Wait for user to confirm.

## Commit

If user confirm then exceute:

- Commit: `git commit -m "One-line description" -m "Description"`
- Check that commit was successfull: `git log -1`
- Present user report and commit hash

```markdown
Commit successful. Hash: <hash>
```
