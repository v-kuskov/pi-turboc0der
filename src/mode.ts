import * as fs from 'fs';
import * as path from 'path';
export interface Mode {
    name(): string;
    prompt(): string | undefined;
    canRead(): boolean;
    canWrite(): boolean;
    canExecute(): boolean;
}

const MODE_PATH = path.resolve(process.cwd(), '.pi/turboc0der/mode.json');

export const PLAN_MODE: Mode = {
    name: () => "plan",
    prompt: () => undefined,
    canRead: () => false,
    canWrite: () => false,
    canExecute: () => false,
};

export const BUILD_MODE: Mode = {
    name: () => "build",
    prompt: () => undefined,
    canRead: () => true,
    canWrite: () => true,
    canExecute: () => true,
};

export const ORCHESTRATOR_MODE: Mode = {
    name: () => "orchestrator",
    prompt: () => undefined,
    canRead: () => false,
    canWrite: () => false,
    canExecute: () => false,
};

class ModeManager {
    private registry: Map<string, Mode> = new Map();
    private currentModeName: string | undefined = undefined;

    constructor() {
        this.initializeRegistry();
        const loadedName = this._loadState();
        this.currentModeName = loadedName;
    }

    private initializeRegistry() {
        this.registry.set(PLAN_MODE.name(), PLAN_MODE);
        this.registry.set(BUILD_MODE.name(), BUILD_MODE);
        this.registry.set(ORCHESTRATOR_MODE.name(), ORCHESTRATOR_MODE);
    }

    private _loadState(): string | undefined {
        try {
            if (!fs.existsSync(path.dirname(MODE_PATH))) {
                fs.mkdirSync(path.dirname(MODE_PATH), { recursive: true });
            }
            if (fs.existsSync(MODE_PATH)) {
                const data = fs.readFileSync(MODE_PATH, 'utf8');
                const state = JSON.parse(data);
                return state.currentMode || undefined;
            }
        } catch (e) {
            console.error("Error loading mode state:", e);
        }
        return undefined;
    }

    private _saveState(name: string): void {
        try {
            if (!fs.existsSync(path.dirname(MODE_PATH))) {
                fs.mkdirSync(path.dirname(MODE_PATH), { recursive: true });
            }
            const state = { currentMode: name };
            fs.writeFileSync(MODE_PATH, JSON.stringify(state, null, 2));
        } catch (e) {
            console.error("Error saving mode state:", e);
        }
    }

    public get_current_mode(): Mode | undefined {
        if (!this.currentModeName) {
            return undefined;
        }
        return this.registry.get(this.currentModeName);
    }

    public set_mode(name: string): Mode | undefined {
        if (!this.registry.has(name)) {
            console.warn(`Mode "${name}" does not exist in registry.`);
            return undefined;
        }

        const mode = this.registry.get(name)!;
        this.currentModeName = name;
        this._saveState(name);
        return mode;
    }
}

// Singleton instance for API client
export const mode_manager = new ModeManager();