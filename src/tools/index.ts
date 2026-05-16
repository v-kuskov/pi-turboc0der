import { IToolInstaller } from "../tool-installer";
import { PathSafetyEnforcer } from "./path-safety";
import { WindowsBashRedirector } from "./bash-redirect";

/**
 * Manually maintained list of all available tool installers.
 *
 * To add a new tool:
 *   1. Create a class implementing IToolInstaller in a separate file.
 *   2. Import it here and add it to the `allToolInstallers` map.
 */
export const allToolInstallers = new Map<string, IToolInstaller>([
    ["path-safety", new PathSafetyEnforcer()],
    ["bash-redirect", new WindowsBashRedirector()],
]);

export { PathSafetyEnforcer } from "./path-safety";
export { WindowsBashRedirector } from "./bash-redirect";
