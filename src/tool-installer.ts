import { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export interface IToolInstaller {
    canInstall(os: string): boolean;
    install(pi: ExtensionAPI): void;
}