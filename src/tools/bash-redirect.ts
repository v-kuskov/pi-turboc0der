import * as os from "os";
import { ExtensionAPI, isToolCallEventType } from "@earendil-works/pi-coding-agent";
import { IToolInstaller } from "../tool-installer";

/**
 * On Windows, when pi-powershell tools are registered, blocks "bash"
 * tool calls and redirects the agent to use PowerShell instead.
 *
 * Detection is lazy (at event time) so extension load order does not
 * matter — pi-powershell's tools may register before or after us.
 *
 * The bash tool is a built-in and cannot be unregistered. This enforcer
 * intercepts every bash tool_call event and returns { block: true }
 * with a message pointing the LLM to the powershell tool.
 */
export class WindowsBashRedirector implements IToolInstaller {
    canInstall(osPlatform: string): boolean {
        return osPlatform === "win32" || os.platform() === "win32";
    }

    install(pi: ExtensionAPI): void {
        pi.on("tool_call", (event, _ctx) => {
            if (!isToolCallEventType("bash", event)) {
                return;
            }

            // Lazy check: pi-powershell may register tools after us.
            const hasPowerShellTool = pi
                .getAllTools()
                .some((t) => t.name === "powershell");

            if (!hasPowerShellTool) {
                return;
            }

            return {
                block: true,
                reason:
                    `Windows + pi-powershell detected on this system. ` +
                    `Use the "powershell" tool instead of "bash" for all ` +
                    `command execution. PowerShell handles batch files ` +
                    `(.cmd/.bat), background jobs (pwsh-start-job), process ` +
                    `management (Get-Process, Stop-Process), and Windows ` +
                    `services (Get-Service, Start-Service).`,
            };
        });
    }
}
