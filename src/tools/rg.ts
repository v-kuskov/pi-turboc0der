import { Type } from 'typebox';
import { spawn } from 'child_process';
import { createInterface } from 'readline';

const RgSchema = Type.Object({
  pattern: Type.String({ description: 'Search pattern (regex by default)' }),
  path: Type.Optional(Type.String({ description: 'Dir or file to search (default: CWD)' })),
  'ignore-case': Type.Optional(Type.Boolean({ description: 'Case-insensitive search (-i)', default: false })),
  glob: Type.Optional(Type.String({ description: 'File glob filter, e.g. *.ts' })),
  context: Type.Optional(Type.Number({ description: 'Context lines before/after match (-C)', default: 0 })),
  fixed: Type.Optional(Type.Boolean({ description: 'Literal search, not regex (-F)', default: false })),
  limit: Type.Optional(Type.Number({ description: 'Max results (default: 20)', default: 20 })),
});

export type RgInput = {
  pattern: string;
  path?: string;
  'ignore-case'?: boolean;
  glob?: string;
  context?: number;
  fixed?: boolean;
  limit?: number;
};

function buildArgs(params: RgInput): string[] {
  const args: string[] = ['--line-number', '--color=never', '--hidden'];
  if (params['ignore-case']) args.push('--ignore-case');
  if (params.glob) args.push('--glob', params.glob);
  if (params.context && params.context > 0) args.push('-C', String(params.context));
  if (params.fixed) args.push('--fixed-strings');
  const limit = params.limit ?? 20;
  if (limit > 0) args.push('--max-count', String(limit));
  args.push('--', params.pattern);
  return args;
}

export const rgToolDef = {
  name: 'rg',
  label: 'rg',
  description: 'Search file contents by pattern → [printed/total].',
  promptSnippet: 'search file contents by pattern',
  parameters: RgSchema,
  execute: async (
    _toolCallId: string,
    params: RgInput,
    signal: AbortSignal | undefined,
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (fn: () => void) => {
        if (!settled) { settled = true; fn(); }
      };

      if (signal?.aborted) {
        settle(() => reject(new Error('Operation aborted')));
        return;
      }

      const limit = params.limit ?? 20;
      const args = buildArgs(params);
      const searchPath = params.path || '.';
      args.push(searchPath);

      const proc = spawn('rg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      const rl = createInterface({ input: proc.stdout });
      const lines: string[] = [];
      let stderr = '';

      proc.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
      rl.on('line', (line: string) => { lines.push(line); });

      const cleanup = () => { rl.close(); };

      proc.on('error', (err: Error) => {
        cleanup();
        settle(() => reject(new Error(`rg binary not available: ${err.message}`)));
      });

      proc.on('close', (code: number | null) => {
        cleanup();
        if (settled) return;
        if (signal?.aborted) {
          settle(() => reject(new Error('Operation aborted')));
          return;
        }

        // rg exit: 0 = hits, 1 = no hits, >1 = error
        if (code !== null && code > 1) {
          const msg = stderr.trim() || `rg exited with code ${code}`;
          settle(() => resolve({ content: [{ type: 'text', text: `ERROR: ${msg}` }], details: undefined }));
          return;
        }

        const header = `rg "${params.pattern}"`;

        if (lines.length === 0) {
          settle(() => resolve({ content: [{ type: 'text', text: header }], details: undefined }));
          return;
        }

        const result = [header, ...lines].join('\n');

        if (lines.length >= limit) {
          settle(() => resolve({ content: [{ type: 'text', text: result + '\n[Limit: ' + limit + ' results]' }], details: undefined }));
          return;
        }

        settle(() => resolve({ content: [{ type: 'text', text: result }], details: undefined }));
      });
    });
  },
};
