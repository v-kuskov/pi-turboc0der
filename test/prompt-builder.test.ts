import {
    IPrompt,
    Mode,
    combine,
    select,
    prompt,
} from '../src/prompt-builder';

function mockMode(overrides?: Partial<Mode>): Mode {
    return {
        name: () => 'test-mode',
        canRead: () => true,
        canWrite: () => true,
        canExecute: () => false,
        ...overrides,
    };
}

describe('Prompt', () => {
    it('should resolve with the given prompt if there is no filter', async () => {
        const p = prompt('Test prompt');
        const result = await p.resolve(mockMode());
        expect(result).toBe('Test prompt');
    });

    it('should resolve with the given prompt if the filter is successful', async () => {
        const mockFilter = () => true;
        const p = prompt('Test prompt', mockFilter);
        const result = await p.resolve(mockMode());
        expect(result).toBe('Test prompt');
    });

    it('should resolve with undefined if the filter fails', async () => {
        const mockFilter = () => false;
        const p = prompt('Test prompt', mockFilter);
        const result = await p.resolve(mockMode());
        expect(result).toBeUndefined();
    });

    it('should resolve with undefined if filter fails and mode is undefined', async () => {
        const mockFilter = () => false;
        const p = prompt('Test prompt', mockFilter);
        const result = await p.resolve(undefined);
        expect(result).toBeUndefined();
    });

    it('should resolve empty string prompt', async () => {
        const p = prompt('');
        const result = await p.resolve(mockMode());
        expect(result).toBe('');
    });

    it('should pass mode argument to filter function', async () => {
        const filter = jest.fn(() => true);
        const mode = mockMode();
        const p = prompt('Test prompt', filter);
        await p.resolve(mode);
        expect(filter).toHaveBeenCalledWith(mode);
    });

    it('should filter based on mode canRead capability', async () => {
        const p = prompt('Read prompt', (m: Mode) => m.canRead());
        const readMode = mockMode({ canRead: () => true });
        const noReadMode = mockMode({ canRead: () => false });

        await expect(p.resolve(readMode)).resolves.toBe('Read prompt');
        await expect(p.resolve(noReadMode)).resolves.toBeUndefined();
    });

    it('should filter based on mode canWrite capability', async () => {
        const p = prompt('Write prompt', (m: Mode) => m.canWrite());
        const writeMode = mockMode({ canWrite: () => true });
        const noWriteMode = mockMode({ canWrite: () => false });

        await expect(p.resolve(writeMode)).resolves.toBe('Write prompt');
        await expect(p.resolve(noWriteMode)).resolves.toBeUndefined();
    });

    it('should filter based on mode canExecute capability', async () => {
        const p = prompt('Exec prompt', (m: Mode) => m.canExecute());
        const execMode = mockMode({ canExecute: () => true });
        const noExecMode = mockMode({ canExecute: () => false });

        await expect(p.resolve(execMode)).resolves.toBe('Exec prompt');
        await expect(p.resolve(noExecMode)).resolves.toBeUndefined();
    });

    it('should filter based on mode name', async () => {
        const p = prompt('Admin prompt', (m: Mode) => m.name() === 'admin');
        const adminMode = mockMode({ name: () => 'admin' });
        const userMode = mockMode({ name: () => 'user' });

        await expect(p.resolve(adminMode)).resolves.toBe('Admin prompt');
        await expect(p.resolve(userMode)).resolves.toBeUndefined();
    });

    it('should support multiple prompt instances with different filters', async () => {
        const readP = prompt('Read section', (m: Mode) => m.canRead());
        const writeP = prompt('Write section', (m: Mode) => m.canWrite());
        const mode = mockMode({ canRead: () => true, canWrite: () => false });

        await expect(readP.resolve(mode)).resolves.toBe('Read section');
        await expect(writeP.resolve(mode)).resolves.toBeUndefined();
    });
});

describe('CombiePrompt', () => {
    it('should combine the resolved prompts with newlines', async () => {
        const mock1: IPrompt = {
            resolve() { return Promise.resolve('1'); }
        };
        const mock2: IPrompt = {
            resolve() { return Promise.resolve('2'); }
        };
        const result = await combine([mock1, mock2]).resolve(undefined);
        expect(result).toBe('1\n\n2');
    });

    it('should return empty string for empty prompts array', async () => {
        const result = await combine([]).resolve(undefined);
        expect(result).toBe('');
    });

    it('should return single prompt unaltered', async () => {
        const mock: IPrompt = {
            resolve() { return Promise.resolve('Single'); }
        };
        const result = await combine([mock]).resolve(undefined);
        expect(result).toBe('Single');
    });

    it('should filter out undefined resolved values', async () => {
        const mock1: IPrompt = {
            resolve() { return Promise.resolve('A'); }
        };
        const mock2: IPrompt = {
            resolve() { return Promise.resolve(undefined); }
        };
        const mock3: IPrompt = {
            resolve() { return Promise.resolve('B'); }
        };
        const result = await combine([mock1, mock2, mock3]).resolve(undefined);
        expect(result).toBe('A\n\nB');
    });

    it('should return empty string if all prompts resolve to undefined', async () => {
        const mock1: IPrompt = {
            resolve() { return Promise.resolve(undefined); }
        };
        const mock2: IPrompt = {
            resolve() { return Promise.resolve(undefined); }
        };
        const result = await combine([mock1, mock2]).resolve(undefined);
        expect(result).toBe('');
    });

    it('should combine real Prompt instances with filters', async () => {
        const mode = mockMode({ canRead: () => true, canWrite: () => false });
        const a = prompt('Readable', (m: Mode) => m.canRead());
        const b = prompt('Writable', (m: Mode) => m.canWrite());
        const c = prompt('Always');

        const result = await combine([a, b, c]).resolve(mode);
        expect(result).toBe('Readable\n\nAlways');
    });

    it('should handle many prompts', async () => {
        const prompts = Array.from({ length: 10 }, (_, i) => ({
            resolve() { return Promise.resolve(String(i)); }
        }));
        const result = await combine(prompts).resolve(undefined);
        expect(result).toBe(Array.from({ length: 10 }, (_, i) => String(i)).join('\n\n'));
    });
});

describe('SelectPrompt', () => {
    it('should resolve with the first resolved prompt', async () => {
        const mock1: IPrompt = {
            resolve() { return Promise.resolve('1'); }
        };
        const mock2: IPrompt = {
            resolve() { return Promise.resolve('2'); }
        };
        const result = await select([mock1, mock2]).resolve(undefined);
        expect(result).toBe('1');
    });

    it('should resolve with undefined if no prompt resolved', async () => {
        const mock1: IPrompt = {
            resolve() { return Promise.resolve(undefined); }
        };
        const mock2: IPrompt = {
            resolve() { return Promise.resolve(undefined); }
        };
        const result = await select([mock1, mock2]).resolve(undefined);
        expect(result).toBeUndefined();
    });

    it('should skip undefined and pick the first resolved', async () => {
        const mock1: IPrompt = {
            resolve() { return Promise.resolve(undefined); }
        };
        const mock2: IPrompt = {
            resolve() { return Promise.resolve('B'); }
        };
        const mock3: IPrompt = {
            resolve() { return Promise.resolve('C'); }
        };
        const result = await select([mock1, mock2, mock3]).resolve(undefined);
        expect(result).toBe('B');
    });

    it('should return undefined for empty prompts array', async () => {
        const result = await select([]).resolve(undefined);
        expect(result).toBeUndefined();
    });

    it('should return undefined for single undefined prompt', async () => {
        const mock: IPrompt = {
            resolve() { return Promise.resolve(undefined); }
        };
        const result = await select([mock]).resolve(undefined);
        expect(result).toBeUndefined();
    });

    it('should work with real Prompt instances and filters', async () => {
        const mode = mockMode({ canRead: () => false, canWrite: () => true });
        const a = prompt('Read only', (m: Mode) => m.canRead());
        const b = prompt('Write only', (m: Mode) => m.canWrite());
        const c = prompt('Fallback');

        const result = await select([a, b, c]).resolve(mode);
        expect(result).toBe('Write only');
    });

    it('should fall through all filtered prompts to fallback', async () => {
        const mode = mockMode({ canRead: () => false, canWrite: () => false, canExecute: () => false });
        const a = prompt('Read', (m: Mode) => m.canRead());
        const b = prompt('Write', (m: Mode) => m.canWrite());
        const c = prompt('Exec', (m: Mode) => m.canExecute());
        const d = prompt('Default');

        const result = await select([a, b, c, d]).resolve(mode);
        expect(result).toBe('Default');
    });
});

describe('Integration: combine + select nesting', () => {
    it('should nest select inside combine', async () => {
        const sel = select([
            prompt('Selected prompt'),
        ]);
        const comb = combine([
            prompt('Header'),
            sel,
            prompt('Footer'),
        ]);
        const result = await comb.resolve(undefined);
        expect(result).toBe('Header\n\nSelected prompt\n\nFooter');
    });

    it('should nest combine inside select (combine before fallback)', async () => {
        const comb = combine([
            prompt('Part A'),
            prompt('Part B'),
        ]);
        const sel = select([
            comb,
            prompt('Fallback'),
        ]);
        const result = await sel.resolve(undefined);
        expect(result).toBe('Part A\n\nPart B');
    });

    it('should deeply nest combine inside select with mode filters', async () => {
        const mode = mockMode({ canRead: () => true, canWrite: () => false });

        // adminSection: select returns undefined when no sub-prompt matches
        const adminSection = select([
            prompt('Admin header', (m: Mode) => m.name() === 'admin'),
        ]);

        // userSection: combine joins multiple matching prompts
        const userSection = combine([
            prompt('User header', (m: Mode) => m.canRead()),
            prompt('User data', (m: Mode) => m.canRead()),
        ]);

        const fallback = prompt('Generic content');

        const result = await select([adminSection, userSection, fallback]).resolve(mode);
        expect(result).toBe('User header\n\nUser data');
    });
});
