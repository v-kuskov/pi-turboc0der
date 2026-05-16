import { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { CODE_PROMPT, THINK_PROMPT, TOOLS_PROMPT, SystemStatePrompt, SECURITY_PROMPT, IDENTITY_PROMOT, CAVEMAN_PROMPT, WORKWLOW_PROMPT } from "./prompts";
import { combine } from "./prompt-builder";
import { allToolInstallers } from "./tools";

/**
 * Tools allowed to be active. Listed manually by key matching the
 * `allToolInstallers` map in `src/tools/index.ts`.
 *
 * Remove an entry from this array to disable that tool entirely.
 */
const allowedToolNames: string[] = [
    "path-safety",
    "bash-redirect",
];

/**
 * OS platform string passed to each IToolInstaller.canInstall().
 */
const PLATFORM = process.platform;

export default function (pi: ExtensionAPI) {
    // Wire only tools that are explicitly allowed and can install on this OS
    for (const [name, installer] of allToolInstallers) {
        if (allowedToolNames.includes(name) && installer.canInstall(PLATFORM)) {
            installer.install(pi);
        }
    }

    pi.on("before_agent_start", async (_event, _ctx) => {
        const prompt = await combine(
            [IDENTITY_PROMOT, CAVEMAN_PROMPT, SECURITY_PROMPT, THINK_PROMPT, CODE_PROMPT, TOOLS_PROMPT, WORKWLOW_PROMPT, new SystemStatePrompt()]
        ).resolve(undefined);
        return {
            systemPrompt: prompt
        };
    });
}