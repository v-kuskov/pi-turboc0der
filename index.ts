import { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { CODE_PROMPT, THINK_PROMPT, TOOLS_PROMPT, SystemStatePrompt, SECURITY_PROMPT, IDENTITY_PROMOT, CAVEMAN_PROMPT, WORKWLOW_PROMPT } from "./prompts";
import { combine } from "./prompt-builder";

export default function (pi: ExtensionAPI) {
    pi.on("before_agent_start", async (_event, _ctx) => {
        const prompt = await combine(
            [IDENTITY_PROMOT, CAVEMAN_PROMPT, SECURITY_PROMPT, TOOLS_PROMPT, new SystemStatePrompt()]
        ).resolve();
        return {
            systemPrompt: prompt
        };
    });
}