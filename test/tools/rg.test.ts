jest.mock('typebox', () => {
  const TObject = (props: Record<string, any>) => ({ type: 'object', properties: props });
  const TString = (opts: Record<string, any> = {}) => ({ type: 'string', ...opts });
  const TNumber = (opts: Record<string, any> = {}) => ({ type: 'number', ...opts });
  const TBoolean = (opts: Record<string, any> = {}) => ({ type: 'boolean', ...opts });
  const TOptional = (s: Record<string, any>) => ({ ...s });
  return { Type: { Object: TObject, String: TString, Number: TNumber, Boolean: TBoolean, Optional: TOptional }, Static: class Static {} };
});

import { rgToolDef } from '../../src/tools/rg';

describe('rg tool', () => {
  test('name and params', () => {
    expect(rgToolDef.name).toBe('rg');
    expect(rgToolDef.label).toBe('rg');
    expect(rgToolDef.description).toBeTruthy();

    const props = rgToolDef.parameters.properties;
    expect(props.pattern).toBeDefined();
    expect(props.path).toBeDefined();
    expect(props['ignore-case']).toBeDefined();
    expect(props.glob).toBeDefined();
    expect(props.context).toBeDefined();
    expect(props.fixed).toBeDefined();
    expect(props.limit).toBeDefined();
    expect((props.limit as any).default).toBe(20);
  });

  test('execute searches with rg and returns results', async () => {
    const result = await rgToolDef.execute('c1', { pattern: 'TODO' }, undefined);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('rg.test.ts');
  });

  test('execute returns no hits', async () => {
    const result = await rgToolDef.execute('c2', { pattern: 'ZZZZ_NONEXISTENT_99999', path: 'package.json' }, undefined);
    expect(result.content[0].text).toBe('rg "ZZZZ_NONEXISTENT_99999"');
  });

  test('execute respects limit param', async () => {
    const result = await rgToolDef.execute('c3', { pattern: 'TODO', limit: 1 }, undefined);
    expect(result.content[0].text).toContain('[Limit: 1 results]');
  });

  test('execute respects ignore-case', async () => {
    const result = await rgToolDef.execute('c4', { pattern: 'todo', 'ignore-case': true }, undefined);
    expect(result.content[0].text.split('\n').length).toBeGreaterThan(1);
  });

  test('execute passes path param', async () => {
    const result = await rgToolDef.execute('c5', { pattern: 'describe', path: 'test/tools/rg.test.ts' }, undefined);
    expect(result.content[0].text).toContain('rg.test.ts');
  });

  test('execute respects glob filter', async () => {
    const result = await rgToolDef.execute('c6', { pattern: 'TODO', glob: '*.md' }, undefined);
    const lines = result.content[0].text.trim().split('\n');
    const mdLines = lines.filter((l: string) => l.includes('.md:'));
    expect(mdLines.length).toBeGreaterThan(0);
  });

  test('execute aborts on signal', async () => {
    const ac = new AbortController();
    ac.abort();
    await expect(
      rgToolDef.execute('c8', { pattern: 'TODO' }, ac.signal)
    ).rejects.toThrow('Operation aborted');
  });
});