---
name: coder
description: Coding and system design guidance. Use every time you need to write, change, refactor or review code, to design API, system or to review exiting desing and system. Use when user asks about software design, programming, code, writing code, what good or bad code is.
---

This skill help you to write good code and design goodm systems.

## Think before you code

Follow this checklist before making any changes.

- Don't make assumptions. Surface tradeoffs, state your assumptions explicitly every time you make one.
- Interrogate user relentlessly about every aspect of the plan until you reach shared understanding. 
- Ask one question at a time. Present alternatives, prefer simplier solution.
- Limit changes to what the user's request requires. Don't add features beyond what    
was asked.No `flexibility` or `configurability` that wasn't requested.
- Don't go beyond the scope of the change. Clean up only what your changes made unused — remove 
imports, variables, functions they left unused. Avoid modifying unrelated code, comments, or
formatting.

Transform tasks into verifiable goals.

For multi - step tasks, state a brief plan:
1.[Step] → verify: [check]
2.[Step] → verify: [check]
3.[Step] → verify: [check]

Coding rules can be relaxed for single - use/throwaway code.

## Design rules

Follow those rules when design, plan or refactor code. Suggest possible changes for existing
code.

- Define domain vocabulary. Don't mix different domains in one
function.
- Define knowledge boundaries, limit what any piece of code supposed to know. Enfore it.
- Design types. Enforce contracts with the type system. Make invalid states unrepresentable. Keep
types small.
- Name types after what they are in the domain. Name functions after what they do.
- Compose simple pieces to reach full functionality.
- Keep modules deep. Small interface, meaningful implementation. Modules communicate with their public interfaces. 
Enforce contracts at interface and type level.
- Test against public interfaces. 
- Do the depth test. If deleting a module would scatter complexity across N callers, it earns its keep.
If complexity would vanish, consider whether it should exist or whether a restructuring is warranted.
A function, module, and layer all follow the same rule.
- Minimize side effects, keep them in dedicated parts of the code, prefer stateless and purity.

## Red Flags

- A module importing from something that should sit above it
- Lower-layer types (`StripeCharge`, `PostgresRow`) crossing a boundary unwrapped
- A module with more shared utilities than domain operations
- "Manager", "Handler", "Processor" in a module name — name the domain instead

## Guardrails

| Excuse | Reality |
|--------|---------|
| "Just a thin wrapper" | If it wraps something, it IS a boundary. Define it. |
| "I need to know lower internals for performance" | Profile first. If this IS the hot path, document the leak explicitly. |
| "Everything should be shared" | Shared modules have no domain meaning. Most modules do. |
| "This dependency is special" | Every dependency is either shared vocabulary or specific capability. Pick one. |
| "This boundary is important even though it adds lines" | A boundary that adds more code than it removes is a pass-through. Merge it or make it deeper. |

## Anti-patterns

Avoid those:

| Anti-pattern | Violates | Fix |
|---|---|---|
| **Leaky Abstraction** — lower-layer types (`StripeCharge`, `SQLRow`) exposed through the interface | Downward Language, Interface as Language | Wrap in this layer's types before crossing the boundary |
| **Everything-Is-Shared** — every module treated as shared utility; no real boundaries | Module DAG | Most modules are specific dependencies. Only true infrastructure is shared. |
| **Anemic Module** — interface exposes nearly everything the module does; same size as implementation | Interface as Language | Identify what callers actually need. Hide the rest. Make the interface deep. |
| **God Module** — one module tries to know about every other module | Knowledge Boundary | Extract focused sub-modules with explicit downward-only dependencies |
| **Spaghetti Dependencies** — circular or cross-cutting dependency chains | Module DAG | Flatten to a DAG. Inject adapters at seams to break cycles. |
| **Pass-Through Module** — module delegates every call without adding domain meaning | Knowledge Boundary | Apply deletion test: does it concentrate complexity? If not, merge into caller or lower module. |
| **Polite Seam** — interface declared and labeled "abstraction," but only one implementation exists | Interface as Language, Module DAG | Add a second adapter (test double at minimum). One adapter = hypothetical seam, not a real one. |
| **Orchestration Leak** — composed lower-module results flow upward untouched; higher callers see `StripeCharge.id` instead of `txId` | Downward Language | The composing module owns the boundary. Translate lower types into this layer's terms before returning. |
| **Ceremonial Boundary** — thin interface with one impl, callers still repeat same validation/error-handling patterns | Interface as Language | Deepen the interface so callers write less. If impossible, merge into caller. |
| **Data Pig** — boundary loads or stores fields caller never uses; forces unnecessary data movement across the seam | Knowledge Boundary | Audit what crosses each boundary. If a field isn't used by callers, stop loading it. Split into hot/cold payloads. |

## Workflow

Follow those rules when planning and following the plan:

- Clear assumptions, fullfill user's request fully, including necessary follow-up actions (cleanup, reporting, and so on).
- Split complext tasks into simplier, solve them separately.
- Understand exiting conventions (code style, tools, languages, build system, tests) and follow them.
- If stuck then re-read the user's request, understand what failed and create a new plan.
- If nothing helps then accept failure, halt and report user.
- Use plan tools to guide you.

While writing or changing code follow this workflow:

1. Understand. Think about user's request. Search existing codebase to get full picture, understand code structure,
existing code patterns and conventions. Understand the context.
2. Plan. Build coherent and ground plan how you intend to solve user's request. Plan must be clear and concise. Plan
for testing and self-verification loop by writing releavant unit tests. Use debug output and tools to help yourself.
3. Implement. Use tools and act on the plan, strictly following rules.
4. Verify. Use tets and code analysis to verify that your implementation meets user's request, works and correct.
