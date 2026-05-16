import { combine, IPrompt, prompt, select } from '../src/prompt-builder';

describe('prompt()', () => {
    it('resolves with given text when no filter', async () => {
        const p = prompt('Test prompt');
        await expect(p.resolve()).resolves.toBe('Test prompt');
    });

    it('resolves with given text when filter returns true', async () => {
        const p = prompt('Test prompt', () => true);
        await expect(p.resolve()).resolves.toBe('Test prompt');
    });

    it('resolves undefined when filter returns false', async () => {
        const p = prompt('Test prompt', () => false);
        await expect(p.resolve()).resolves.toBeUndefined();
    });

    it('resolves empty string prompt', async () => {
        const p = prompt('');
        await expect(p.resolve()).resolves.toBe('');
    });

    it('handles multiple instances with different filters', async () => {
        const trueP = prompt('Yes', () => true);
        const falseP = prompt('No', () => false);

        await expect(trueP.resolve()).resolves.toBe('Yes');
        await expect(falseP.resolve()).resolves.toBeUndefined();
    });

    it('filter receives no arguments (current contract)', async () => {
        const filter = jest.fn(() => true);
        const p = prompt('No args', filter);
        await p.resolve();
        expect(filter).toHaveBeenCalledWith();
    });
});

describe('combine()', () => {
    it('joins resolved prompts with double newline', async () => {
        const a: IPrompt = { resolve: () => Promise.resolve('Part A') };
        const b: IPrompt = { resolve: () => Promise.resolve('Part B') };
        const result = await combine([a, b]).resolve();
        expect(result).toBe('Part A\n\nPart B');
    });

    it('returns empty string for empty array', async () => {
        const result = await combine([]).resolve();
        expect(result).toBe('');
    });

    it('returns single prompt unaltered', async () => {
        const a: IPrompt = { resolve: () => Promise.resolve('Only one') };
        const result = await combine([a]).resolve();
        expect(result).toBe('Only one');
    });

    it('filters out undefined values', async () => {
        const a: IPrompt = { resolve: () => Promise.resolve('A') };
        const b: IPrompt = { resolve: () => Promise.resolve(undefined) };
        const c: IPrompt = { resolve: () => Promise.resolve('C') };
        const result = await combine([a, b, c]).resolve();
        expect(result).toBe('A\n\nC');
    });

    it('returns empty string when all resolve undefined', async () => {
        const a: IPrompt = { resolve: () => Promise.resolve(undefined) };
        const b: IPrompt = { resolve: () => Promise.resolve(undefined) };
        const result = await combine([a, b]).resolve();
        expect(result).toBe('');
    });

    it('works with real Prompt instances with filters', async () => {
        const a = prompt('Visible', () => true);
        const b = prompt('Hidden', () => false);
        const c = prompt('Always');
        const result = await combine([a, b, c]).resolve();
        expect(result).toBe('Visible\n\nAlways');
    });

    it('handles many prompts', async () => {
        const prompts = Array.from({ length: 10 }, (_, i) => ({
            resolve: () => Promise.resolve(String(i)),
        }));
        const result = await combine(prompts).resolve();
        expect(result).toBe(Array.from({ length: 10 }, (_, i) => String(i)).join('\n\n'));
    });
});

describe('select()', () => {
    it('returns first resolved prompt', async () => {
        const a: IPrompt = { resolve: () => Promise.resolve('First') };
        const b: IPrompt = { resolve: () => Promise.resolve('Second') };
        const result = await select([a, b]).resolve();
        expect(result).toBe('First');
    });

    it('returns undefined when none resolve', async () => {
        const a: IPrompt = { resolve: () => Promise.resolve(undefined) };
        const b: IPrompt = { resolve: () => Promise.resolve(undefined) };
        const result = await select([a, b]).resolve();
        expect(result).toBeUndefined();
    });

    it('skips undefined, picks first real value', async () => {
        const a: IPrompt = { resolve: () => Promise.resolve(undefined) };
        const b: IPrompt = { resolve: () => Promise.resolve('B') };
        const c: IPrompt = { resolve: () => Promise.resolve('C') };
        const result = await select([a, b, c]).resolve();
        expect(result).toBe('B');
    });

    it('returns undefined for empty array', async () => {
        const result = await select([]).resolve();
        expect(result).toBeUndefined();
    });

    it('returns undefined when only prompt returns undefined', async () => {
        const a: IPrompt = { resolve: () => Promise.resolve(undefined) };
        const result = await select([a]).resolve();
        expect(result).toBeUndefined();
    });

    it('falls through filtered prompts to fallback', async () => {
        const a = prompt('Hidden1', () => false);
        const b = prompt('Hidden2', () => false);
        const c = prompt('Fallback');
        const result = await select([a, b, c]).resolve();
        expect(result).toBe('Fallback');
    });
});

describe('Integration: combine + select nesting', () => {
    it('nests select inside combine', async () => {
        const sel = select([prompt('Selected prompt')]);
        const comb = combine([prompt('Header'), sel, prompt('Footer')]);
        const result = await comb.resolve();
        expect(result).toBe('Header\n\nSelected prompt\n\nFooter');
    });

    it('nests combine inside select', async () => {
        const comb = combine([prompt('Part A'), prompt('Part B')]);
        const sel = select([comb, prompt('Fallback')]);
        const result = await sel.resolve();
        expect(result).toBe('Part A\n\nPart B');
    });

    it('deeply nests with filters', async () => {
        const adminSection = select([prompt('Admin header', () => false)]);
        const userSection = combine([
            prompt('User header', () => true),
            prompt('User data', () => true),
        ]);
        const fallback = prompt('Generic content');
        const result = await select([adminSection, userSection, fallback]).resolve();
        expect(result).toBe('User header\n\nUser data');
    });

    it('falls through when all nested prompts filter out', async () => {
        const adminSection = select([prompt('Admin', () => false)]);
        const result = await select([adminSection, prompt('Fallback')]).resolve();
        expect(result).toBe('Fallback');
    });
});
