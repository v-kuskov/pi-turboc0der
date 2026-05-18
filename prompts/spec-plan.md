---
description: Planning implementation for spec
argument-hint: [feature slug - name from .specs/{slug}]
---

Write implementation plan for created and approved spec.  Take the spec files, validate and sharpen through grilling, deduce what you can from codebase/spec, ask user about the rest. Decompose into a high-level plan with compilable+testable task boundaries. Your only job is planning, do not write any code.

**Rules**

1. Plan and tasks files are ≤ 300 lines.
2. Dependencies form a DAG without cycles
3. Every task implements one finished aspect of the spec.
4. Every task has full set of related tests.

**Pre-flight**

- [ ] Read project's context (CONTEXT.md if exists), understand its structure and high-level functionality.
- [ ] Read `.specs/{feature}/spec.md` and all `.specs/{feature}/spec-*.md` sub-specs.
- [ ] Explore the codebase enough to understand existing types, interfaces, module structure and test patterns relevant to the feature.
- [ ] From the spec and codebase try to resolve each design question yourself.
- [ ] Verify the codebase compiles and tests pass before writing any plan files. If broken, report to user first.

**1. Spec validation**

- [ ] Terminology: does the spec use terms that conflict with CONTEXT.md definitions?
- [ ] Boundaries: Are module responsibilities clear? Does the spec imply a dependency direction that conflicts with existing architecture?
- [ ] Type shapes: Are the proposed types coherent with existing code patterns?
- [ ] Missing assumptions: Does the spec assume capabilities the codebase doesn't have?

**2. Design questions**

- [ ] Knowledge barriers, what each piece of code must and must not know, keep it minimal.
- [ ] Types, what types feature need, what data and states those types are representing, how connected with another types.
- [ ] Interface shape, signatures that match existing patterns, choose simpler over complex.
- [ ] Where code must be located, must follow existing conventions.
- [ ] Task decomposition, each task must end with something compilable and testable.

**3. Interrogate the user**

Systematically ask the user about design decisions that you couldn't resolve. For questions answerable via codebase exploration, explore instead of asking.

Rules:

- Ask ONE question at a time.
- Do NOT ask about user perspective, interrogate about architecture, types, and boundaries.
- If a question is fully answered by exploration, do not ask the user.
- Max 4 iterations, document remaining unknowns as open questions.

Question categories:

<details>
<summary><b>API shape</b></summary>

"Should <function> return `bool` with out-param, or nullable?" — only if both patterns exist in codebase.

</details>

<details>
<summary><b>Behavioral choices</b></summary>

"When X happens, should we Y or Z?" — only when spec is ambiguous.

</details>

<details>
<summary><b>Config defaults</b></summary>

Any numeric/bool config that needs a default.

</details>

<details>
<summary><b>Error/edge handling</b></summary>

Any non-obvious edge case not covered by spec.

</details>

Heuristics:

| Question | How to resolve |
|----------|---------------|
| Where does this type go? | Check existing files for similar types. Follow namespace/package conventions. |
| What signature fits? | Look at existing APIs in the same area. Match conventions (class/interface/fn, params, returns). |
| Which is simpler? | Fewer types, less nesting, no generics when not needed, plain functions vs classes, minimal public API surface. |
| What default? | Check if the codebase uses a similar default elsewhere. |
| How to split tasks? | Find natural seams: data structure → its consumer → wiring. Each task = a vertical slice with its own tests. |

**4. Document decisions**

For each decision, note it with brief rationale. These become part of the plan's Architecture section.

Rules:
- Do NOT ask about WHAT the feature does (spec-write already covered that). Ask only about HOW to build it.
- Every question should offer a recommended answer. "I think X because Y. Does that work?"
- Max 4 iterations total (shared with interrogation phase).

**5. Plan & Decompose**

Write `plan.md` and `task-{desc}.md` files into `.specs/{feature}/`.

**5a. Validate dependency graph** — after writing all task files, run topological sort check to detect cycles:

1. Collect all task filenames (kebab-case, no extension).
2. For each task, read its `dependencies` frontmatter.
3. Build adjacency list: each task points to its dependents.
4. Run Kahn's algorithm (or DFS cycle detection):
   - If cycle found → identify the cycle path, report which tasks form it.
   - Break cycle by: reordering tasks, merging conflicted tasks, or splitting into smaller tasks.
5. Re-validate until no cycles remain.
6. Only then write files to `.specs/{feature}/`.

<details>
<summary><b>Plan structure template</b></summary>

```markdown
---
status: planned
summary: Execution plan for {feature}
---

# Summary

Brief (2-3 sentences): what gets built, what changes.

## Execution Context

### Runtime/Platform
- Language version, runtime, key packages/frameworks

### Implementation Dependencies
- Libraries, frameworks, internal APIs this depends on

### Constraints
- Must NOT use X. Must stay under Y bytes. etc.

### Validation
- Generic: compile (build succeeds, zero errors), lint (no warnings), test (all pass). Actual commands depend on project language/toolchain.

## Architecture

### Types

For each type (new or modified), describe its name, what this type represents, which states it covers.

### Interface

For each new or modified public API, show signatures in pseudocode. Keep minimal — only what's needed to understand the shape.

### Relations

Describe how different parts of the code relate to each other, which types are using and what they're doing.
Describe global state, where and how it changes.

### Boundaries

- What each module knows and does NOT know.
- "X knows Y but not Z."

## Open Questions

Any design questions not resolved during interrogation. Prefix with what needs to be decided and by whom.

| # | Question | Impact |
|---|----------|--------|
| 1 | <unresolved question> | <what gets blocked without this> |

## Acceptance

Summary of what constitutes success. Reference user stories (US-{N}), functional criteria (FC-{N}), and edge cases (EC-{N}) from the spec.

| Ref | Check |
|-----|-------|
| US-1 | <what the user sees when this is done> |

## File Organization

| Action | File |
|--------|------|
| NEW | path/to/new-file.ext |
| MODIFY | path/to/existing-file.ext — what changes |
| DELETE | path/to/removed-file.ext |

Also list test files.

## Tasks

List of tasks and task files in execution order with short description what those tasks change.

```

Constraints on plan.md:

- ≤ 300 lines total.
- Architecture and high-level only, No implementation pseudocode (1-2 lines of algorithm outline is OK for subtle parts, but no more).
- Focus on types and interfaces.
- Must have `Acceptance` section summarizing user stories, functional criteria, and edge cases from spec.
- File Organization section lists every file touched by the plan.
- Tasks section at the end lists all task files with a short summary and dependency column.

</details>

<details>
<summary><b>Task file structure template</b></summary>

```markdown
---
summary: One-line description of what this task accomplishes
dependencies: [list of task that should be done before]
---

# Description

2-4 sentences. What this task builds. What it does NOT build (explicit out-of-scope for this task).

## Types

Describes types that need to be changed, added or deleted, keep it short and in pseudocode.

## Interface

API signatures in pseudocode that this task introduces or modifies.

## Implementation

Brief algorithm description. Use pseudocode only for non-obvious logic. ≤20 lines. Omit if logic is straightforward.

## Acceptance criteria

What must pass for this task to be done. Use spec references:

US coverage: which user stories are verified by this task.
FC coverage: which functional requirements.
EC coverage: which edge cases.
Test scenarios: 1-2 sentence descriptions of key test cases (language-agnostic).

## Files to change

| File | Action |
|------|--------|
| `path/to/file` | NEW / MODIFY / DELETE |

```

</details>

Constraints on task files:

- ≤ 300 lines each.
- Keep it short, favor concise descriptions over verbose detail.
- Avoid code, only include pseudocode for genuinely non-obvious algorithms.
- Must have `Acceptance` criteria section, with US/FC/EC coverage and test scenario descriptions.
- Each task must end in a state that compiles and tests pass, represent vertical slice: source code + tests scoped for this task.
- The first task must have `dependencies: []` — it needs nothing else.
- Follow `dependencies: [task-types, task-validate]` format (kebab-case task filename without extension) for frontmatter where applicable.
- Dependencies must be acyclic. Tasks form a DAG. Follow step 5a for cycle validation.

Task decomposition guidelines:

Natural seams that produce compilable+testable boundaries:

1. Pure data structure.
2. Core logic and its tests.
3. Integration wiring.
4. API surface/config.

**Post-flight**

1. Update frontmatter `status` to `draft`.
2. Present to user: "Plan written to `.specs/{feature}/plan.md` with X tasks. Review and approve to begin implementation."
3. If user rejects the plan, revise based on feedback (max 2 revision rounds).
