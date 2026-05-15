export interface Mode {
    name(): string;
    canRead(): boolean;
    canWrite(): boolean;
    canExecute(): boolean;
}

export interface IPrompt {
    resolve(mode: Mode | undefined): Promise<string | undefined>;
}

class Prompt implements IPrompt {
    private prompt: string | undefined = undefined;
    private filter: Function | undefined = undefined;

    public constructor(prompt: string, fn: Function | undefined) {
        this.prompt = prompt;
        this.filter = fn;
    }

    async resolve(mode: Mode | undefined): Promise<string | undefined> {
        if (this.filter === undefined) {
            return this.prompt;
        }
        if (this.filter(mode))
            return this.prompt;
        return undefined;
    }
}

class CombiePrompt implements IPrompt {
    private prompts: IPrompt[] = []

    constructor(prompts: IPrompt[]) {
        this.prompts = prompts;
    }

    async resolve(mode: Mode): Promise<string | undefined> {
        let resolvedPromises = this.prompts.map(prompt => prompt.resolve(mode));
        let resolvedValues = await Promise.all(resolvedPromises);
        return resolvedValues.filter(prompt => prompt !== undefined).join("\n\n");
    }
}

class SelectPrompt implements IPrompt {
    private prompts: IPrompt[] = []

    constructor(prompts: IPrompt[]) {
        this.prompts = prompts;
    }

    async resolve(mode: Mode): Promise<string | undefined> {
        let resolvedPromises = this.prompts.map(prompt => prompt.resolve(mode));
        let resolvedValues = await Promise.all(resolvedPromises);
        return resolvedValues.find(prompt => prompt !== undefined)
    }
}

export function combine(prompts: IPrompt[]): IPrompt {
    return new CombiePrompt(prompts)
}

export function select(prompts: IPrompt[]): IPrompt {
    return new SelectPrompt(prompts)
}

export function prompt(prompt: string, filter: Function | undefined = undefined): IPrompt {
    return new Prompt(prompt, filter)
}