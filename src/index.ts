import { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { CODE_PROMPT, PROCESS_PROMPT, TOOLS_PROMPT, SKILLS_PROMPT, SystemStatePrompt, SECURITY_PROMPT, CONFLICT_RESOLUTION_PROMPT, REPORT_PROMPT } from "./prompts";
import { combine } from "./prompt-builder";

export default function (pi: ExtensionAPI) {
    pi.on("before_agent_start", async (event, ctx) => {
        const prompt = await combine(
            [SECURITY_PROMPT, PROCESS_PROMPT, CODE_PROMPT, TOOLS_PROMPT, CONFLICT_RESOLUTION_PROMPT, REPORT_PROMPT, new SystemStatePrompt]
        ).resolve(undefined);
        return {
            systemPrompt: prompt
        }
    });
}