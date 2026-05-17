import { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { TOOLS_PROMPT, SECURITY_PROMPT, IDENTITY_PROMPT, CAVEMAN_PROMPT, WORKFLOW_PROMPT, DESIGN_PROMPT, CODING_PROMPT, systemStatePrompt } from "./prompts";


export default function (pi: ExtensionAPI) {
    pi.on("before_agent_start", async (_event, _ctx) => {
        const prompt =
            [
                IDENTITY_PROMPT,
                CAVEMAN_PROMPT,
                SECURITY_PROMPT,
                TOOLS_PROMPT,
                await systemStatePrompt()
            ].join("\n\n");
        return {
            systemPrompt: prompt
        };
    });
}