import * as path from "path";
import { ExtensionAPI, isToolCallEventType, ToolCallEventResult } from "@earendil-works/pi-coding-agent";
import { IToolInstaller } from "../tool-installer";

/**
 * Blocks edit and write tool calls that target paths outside the current
 * working directory. This prevents accidental or malicious file mutations
 * outside the project boundary.
 */
export class PathSafetyEnforcer implements IToolInstaller {
    canInstall(_os: string): boolean {
        // Works on all platforms (path.join handles separators)
        return true;
    }

    install(pi: ExtensionAPI): void {
        pi.on("tool_call", (event, ctx) => {
            if (isToolCallEventType("edit", event)) {
                return this.checkPath(event.input.path, ctx.cwd);
            }
            if (isToolCallEventType("write", event)) {
                return this.checkPath(event.input.path, ctx.cwd);
            }
        });
    }

    private checkPath(targetPath: string, cwd: string): ToolCallEventResult | undefined {
        const normalizedTarget = path.resolve(cwd, targetPath);
        const normalizedCwd = path.resolve(cwd);

        const isInside =
            normalizedTarget === normalizedCwd ||
            normalizedTarget.startsWith(normalizedCwd + path.sep);

        if (!isInside) {
            return {
                block: true,
                reason:
                    `Access denied: "${targetPath}" is outside the current directory ` +
                    `("${normalizedCwd}"). Edit and write operations are restricted ` +
                    `to the project directory tree.`,
            };
        }
    }
}
