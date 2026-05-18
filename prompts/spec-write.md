---
description: Creating and writing spec
argument-hint: "feature description - what to build"
---

Interrogate user and write or update feature spec at path `.specs/{feature}/spec.md`. Spec must reflect
feature from user's perspective, describing what needs to be done, without any implementation details.

**Pre-flight**

- [ ] Read project's context (CONTEXT.md if exists, README, package.json), understand its structure and high-level functionality.
- [ ] Determine feature slug from description and context (kebab-case).
- [ ] Create directory `.specs/{feature}/`. If it already exists, read existing spec and ask user: update or rewrite?

**1. Requirements collection**

Systematically ask the user about what the feature should do — from the user's perspective, not the implementer's.

Question Categories:

<details>
<summary><b>1. User & Purpose</b></summary>

- Who is the user of this feature?
- What is the user trying to accomplish?
- What problem does this solve for them?

</details>

<details>
<summary><b>2. Expected Behavior</b></summary>

- What should happen when the user triggers this feature?
- What inputs does the user provide? What outputs do they get?
- What does success look like from the user's point of view?

</details>

<details>
<summary><b>3. Quality & Constraints</b></summary>

- How fast/reliable does it need to be?
- What platforms or environments must it support?
- What existing systems must it work with?

</details>

<details>
<summary><b>4. Scope Boundaries</b></summary>

- What is explicitly in scope?
- What is explicitly out of scope?
- What should NOT happen?

</details>

<details>
<summary><b>5. Priorities</b></summary>

- What is essential vs nice-to-have?
- What can be deferred?

</details>

<details>
<summary><b>6. Edge Cases</b></summary>

- What could go wrong from the user's perspective?
- What error states should the user see?
- What invalid inputs might occur?

</details>

**2. Write Requirements Spec**

<details>
<summary><b>Spec template</b></summary>

```markdown
---
status: draft
summary: Requirements spec for {feature}
---

# Context and Goals

Brief background, what problem this solves for the user.

## User Stories

[List of user stories, named as US-{N}]

## Acceptance

[Acceptance scenarios]

## Functional Requirements

[List of functional requirements using MUST/SHOULD language, named as FC-{N}]

## Key Entities

[List of entities described from user's perspective, named as KE-{N}]

## Scope

### In Scope

[List of aspects that are in scope for this feature]

### Out of Scope

[List of aspects that are out of scope for this feature]

## Edge Cases

[List of edge cases, named as EC-{N}]

## Success Criteria

[List of outcomes from user's perspective, named as SC-{N}]

## Open Questions

[List of open questions]

## Details

(List of subspecs with short description. Populated after step 3.)
</details>

**3. Decompose into sub-specs**

Split spec into compact sub-specs (≤150 lines each). Each covers one coherent concept.

1. Identify natural boundaries: user story groups, functional areas, lifecycle phases.
2. For each subfeature, write `.specs/{feature}/spec-{slug}.md` with same format as above plus frontmatter:
3. After writing all sub-specs, go back and update the main spec's `## Details` section with links and descriptions for each sub-spec.

```markdown
---
summary: One-line description
---

## Context

(brief)

## User Stories Summary

[List of user stories covered by this subspec]

## Functional Requirements

[List of functional requirements using MUST/SHOULD language]

## Edge Cases

[List of edge cases]

## Success Criteria

[List of outcomes from user's perspective]
```

**Rules**

- Cover one category per round. Ask related questions together.
- Each question must be from the user's perspective only.
- If user starts describing implementation, redirect: "Let's focus on what the user sees, not how it's built."
- Spec files must be 150 lines or less.
- Continue until all categories are covered and user has nothing more to add.
- Max 6 rounds (one per category). Document remaining unknowns as open questions.
- No implementation details, never ask about or document HOW, only WHAT from user perspective.
- Do not plan, this workflow produces requirements and specs only.
- If user gives contradictory answers across categories → formulate as a new question and ask for clarification.

**Error handling**
- If user rejects spec during validation, ask what's wrong and iterate (max 2 revision rounds).
- If user can't answer a category, mark questions as unresolved and note in Open Questions.
- If user persists with implementation details, note them as out-of-scope and move on.

**Post-flight**
1. Validate full spec with user: present main spec + all sub-specs, ask "does this capture what you want?"
2. If accepted, confirm all files written: `.specs/{feature}/spec.md` and `.specs/{feature}/spec-*.md`.
3. Summarize to user: "Spec written to `.specs/{feature}/` with [N] sub-specs. Review and approve, then proceed to planning."
