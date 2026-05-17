import { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { TOOLS_PROMPT, SECURITY_PROMPT, IDENTITY_PROMPT, CAVEMAN_PROMPT, WORKFLOW_PROMPT, DESIGN_PROMPT, CODING_PROMPT, systemStatePrompt, INTERNAL_TOOLS } from "./prompts";
import { rgToolDef } from "./tools/rg";
import { fdToolDef } from "./tools/fd";
import { lsToolDef } from "./tools/ls";

export default function (pi: ExtensionAPI) {
    // Register custom rg and fd tools
    pi.registerTool(rgToolDef);
    pi.registerTool(fdToolDef);
    pi.registerTool(lsToolDef);

    pi.on("before_agent_start", async (_event, _ctx) => {
        const prompt =
            [
                IDENTITY_PROMPT,
                CAVEMAN_PROMPT,
                SECURITY_PROMPT,
                TOOLS_PROMPT,
                DESIGN_PROMPT,
                CODING_PROMPT,
                WORKFLOW_PROMPT,
                await systemStatePrompt()
            ].join("\n\n");
        return {
            systemPrompt: prompt
        };
    });
}