# Plan Enforcement System Specification (Final Draft V1.1)

## Overview

System enforces goal-driven, multi-step execution structure. Plan decomposes high-level goal into sequential, discrete tasks ($Step$). State machine ensures deterministic progression, preventing premature steps or skipping required actions. Agent interaction is strictly gated by state transitions enforced by the `PlanService`.

## Domain Model (Types.ts/Schema)

We enforce type boundaries to make illegal states unrepresentable.

### 1. StepState (Sum Type)

Defines lifecycle boundary for $PlanStep$.

| State | Value | Description |
| :--- | :--- | :--- |
| Planned | `"planned"` | Step identified, awaiting execution start. |
| InProgress | `"in-progress"` | Active step, currently executing by agent. |
| Done | `"done"` | Step completed, results committed. |
| Failed | `"failed"` | Execution failed; requires manual inspection/retry. |

### 2. PlanStep (Product Type)

Atomic unit of work.

```typescript
type PlanStep = {
    stepId: Int;                  // Unique step number (1, 2, 3...)
    description: String;         // Atomic instruction set (The task prompt)
    state: StepState;             // Current lifecycle state
    retryCount: Int;             // Number of times this step has been attempted.
    maxAttempts: Int;            // Maximum allowed attempts before permanent failure.
    failureReason?: String;      // Context if state is not "done".
}
```

### 3. ExecutionPlan (Root Aggregate)

The total plan state.

```typescript
type ExecutionPlan = {
    planId: String;
    steps: PlanStep[];           // Always ordered by stepId.
    status: String;              // Global state: e.g., "Active", "Completed", "Failed".
}
```

## Components & Tools (Interfaces)

### 1. IStore (Persistence Repository Interface)

**Constraint:** Must implement atomic Read-Modify-Write ($\text{Read} \rightarrow \text{Lock} \rightarrow \text{Modify} \rightarrow \text{Write}$).

* `loadPlan(planId: String) -> Result<ExecutionPlan, StoreError>`: Retrieves last known state.
* `savePlan(plan: ExecutionPlan, expectedVersion: Int) -> Result<ExecutionPlan, StoreError>`: Persists state only if version matches (Optimistic Locking).

### 2. `plan`: Tool Interface (Initialization)

AI utility function initiating the plan.

* **Signature:** `plan(goal: String) -> Result<ExecutionPlan, PlanError>`
* **Action:** Returns initial $ExecutionPlan$. All steps default to `State.Planned`.

### 3. `plan_progress`: Tool Interface (Progress Update)

AI utility function reporting step completion (via successful execution).

* **Signature:** `plan_progress(stepId: Int, result: String) -> Result<Outcome, ProgressError>`
* **Input:** $stepId$ and the descriptive `result`.
* **Action:** Signals plan advancement attempt.

### 4. `plan_progress_fail`: Tool Interface (Failure Report)

Agent or System reports step failure.

* **Signature:** `plan_progress_fail(stepId: Int, error: String) -> Result<void, FailureError>`
* **Action:** Updates state $Step_N \rightarrow Failed$.

### 5. `plan_remind`: Utility Interface (Reading/Context)

Read-only tool used by the agent framework to summarize progress.

* **Signature:** `plan_remind(planId: String) -> PlanStatusReport`
* **ReportStructure:** Must segment:
  * **History (DONE):** List of completed steps + attached result summary.
  * **Current Focus (IN-PROGRESS):** Detailed objective for active step.
  * **Queue (NEXT):** Details for the next pending step ($InProgress$) and all following $Planned$ steps.

## System Core: PlanService (Orchestrator)

The orchestrator coordinates $IStore$, $plan$, and state validation. It adheres to the Repository Pattern, decoupling persistence details from business logic.

#### Execution Flow & State Transitions

**[Init]**

1. $plan(Goal) \rightarrow ExecutionPlan$.
2. $Step_1$ state forced $\rightarrow$ `InProgress`.
3. `PlanService` commits state to $IStore$.
4. $Step_1$ forced into `activeAgent` context.

**[Transaction: Step N Advancement]**

1. **Input:** $plan\_progress(N, results)$ received.
2. **Validate:** `PlanService.validateCompletion(StepN, results)`. *Failure here immediately triggers a pause/error.*
3. **Commit $N$:** Update $Step_N \rightarrow Done$.
4. **Determine Next:** Check $Step_{N+1}$ existence.
5. **Advance:** If $N+1$ exists:
    a. Set $Step_{N+1} \rightarrow InProgress$.
    b. Save state (Atomic transaction).
    c. Force $Step_{N+1}$ to `activeAgent`.
6. **Complete:** If $N+1$ DNE: Set $ExecutionPlan.status = "Completed"$.

[SystemGuard: System Check Cycle]
(Triggered upon suspension/interval timeout.)

1. Check $IStore$. Look for first $Step_N$ where $State$ is $Planned$ OR $State = NeedsCorrection$.
2. **Execution Attempt**:
    a. If $Step_N$ is $Planned$: Set $Step_N \rightarrow InProgress$ and force $Step_N$ to `activeAgent` context.
    b. If $Step_N$ is $NeedsCorrection$: The agent must attempt retry. $PlanService$ must inject a mechanism to explicitly re-run the relevant code block and signal the retry event.
3. **Failure/Halt Check**: If $Step_N$ state was $NeedsCorrection$ *and* retry failed, check attempt limit. If $Step_N.retryCount \ge Step_N.maxAttempts$, set $Step_N \rightarrow NeedsCorrection$ (Final Failure State) and set $ExecutionPlan.status = "Halted"$.
4. **Advance**: If $Step_N$ is successfully completed (via $plan\_progress$), follow the standard progression to $Step_{N+1}$.
5. **System Consistency**: Always perform the transaction atomically (Read version $\to$ Modify state $\to$ Write version).

## Architectural Principles Enforced

1. **Concurrency:** $IStore$ must manage versioning/locking to prevent race conditions.
2. **Atomicity:** All state changes ($N \to Done$ AND $N+1 \to InProgress$) must occur within a single, atomic transaction.
3. **Domain Modeling:** Use of Sum/Product types prevents invalid/mixed state transitions.
4. **SRP/Layers:** `PlanService` only orchestrates; `PlanRepository` handles persistence mechanisms.

*## Agent Interaction Mandate (Mandatory Tool Use)

To guarantee structured and measurable workflow, any and all initial user input—or any start of a new conversational thread—must be processed by the `plan(goal: String)` tool.

**Orchestrator Enforcement Rule:**
1.  Upon receiving initial user input, the system **MUST NOT** process conversational text or prose responses from the LLM.
2.  The Orchestrator layer must intercept and verify the LLM output.
3.  If the LLM output does not contain a valid `tool_call` for `plan()`, the output must be rejected, and the LLM must be re-prompted with a strict directive: "Your response must be a JSON object containing ONLY the `plan()` tool call. Address the stated goal and nothing else."
4.  Only successful `plan()` tool calls initiate state loading or plan creation.

***

*Original Goal:* Robust, verifiable, and resilient multi-agent workflow.
*Mandate:* **All execution starts with $\text{plan}()$.***
