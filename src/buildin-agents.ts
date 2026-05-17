import { CODING_PROMPT, DESIGN_PROMPT, WORKFLOW_PROMPT } from "./prompts";

/**
 * Built-in agent definitions — name → system prompt.
 *
 * Fallback used when discoverAgent(name) finds no file on disk.
 */
export const BUILDIN_AGENTS: Record<string, string[]> = {
    "coder": [
        WORKFLOW_PROMPT,
        CODING_PROMPT,
        DESIGN_PROMPT
    ]

};
