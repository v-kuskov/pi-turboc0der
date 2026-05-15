export enum StepState {
    "planned",
    "execute",
    "done"
}

export interface PlanStep {
    id: string;
    description: string;
}

export class Plan {
    steps: PlanStep[] | undefined = undefined;
}

// export function createPlan(steps: string[]): Plan | undefined {
//     if (steps.length == 0) {
//         return undefined;
//     }
//     return Plan {
//         steps: steps.map((step) => {
//             id: ""
//         })
//     }
// }