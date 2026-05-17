jest.mock('typebox', () => {
  const TObject = (props: Record<string, any>) => ({ type: 'object', properties: props });
  const TString = (opts: Record<string, any> = {}) => ({ type: 'string', ...opts });
  const TNumber = (opts: Record<string, any> = {}) => ({ type: 'number', ...opts });
  const TBoolean = (opts: Record<string, any> = {}) => ({ type: 'boolean', ...opts });
  const TOptional = (s: Record<string, any>) => ({ ...s });
  return { Type: { Object: TObject, String: TString, Number: TNumber, Boolean: TBoolean, Optional: TOptional }, Static: class Static {} };
});

import { fdToolDef } from '../../src/tools/fd';

describe('fd tool', () => {
  test('name and params', () => {
    expect(fdToolDef.name).toBe('fd');
    expect(fdToolDef.label).toBe('fd');
    expect(fdToolDef.description).toBeTruthy();

    const props = fdToolDef.parameters.properties;
    expect(props.pattern).toBeDefined();
    expect(props.path).toBeDefined();
    expect(props.type).toBeDefined();
    expect(props.extension).toBeDefined();
    expect(props.hidden).toBeDefined();
    expect(props.maxDepth).toBeDefined();
  });

  test('execute finds files by glob', async () => {
    const result = await fdToolDef.execute('c1', { pattern: '*.md' }, undefined);
    expect(result.content[0].text).toContain('AGENTS.md');
  });

  test('execute returns no results', async () => {
    const result = await fdToolDef.execute('c2', { pattern: 'ZZZZ_NONEXISTENT_99999', path: 'package.json' }, undefined);
    expect(result.content[0].text).toBe('fd "ZZZZ_NONEXISTENT_99999"');
  });

  test('execute filters by extension', async () => {
    const result = await fdToolDef.execute('c4', { pattern: '*', extension: 'md' }, undefined);
    const lines = result.content[0].text.trim().split('\n').filter((l: string) => l);
    for (const line of lines) {
      if (line.startsWith('fd "')) continue;
      expect(line.endsWith('.md')).toBeTruthy();
    }
  });

  test('execute filters by type dir', async () => {
    const result = await fdToolDef.execute('c5', { pattern: '*', type: 'd' }, undefined);
    expect(result.content[0].text).toContain('src');
  });

  test('execute aborts on signal', async () => {
    const ac = new AbortController();
    ac.abort();
    await expect(
      fdToolDef.execute('c6', { pattern: '*' }, ac.signal)
    ).rejects.toThrow('Operation aborted');
  });
});