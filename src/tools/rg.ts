import { Type } from 'typebox';
import { spawn } from 'child_process';
import { createInterface } from 'readline';

/**
 * rg tool — search file contents using ripgrep.
 * Minimal, agent-friendly wrapper around `rg` binary.
 */

const RgSchema = Type.Object({
  pattern: Type.String({ description: 'Search pattern (regex by default)' }),
  path: Type.Optional(Type.String({ description: 'Directory or file to search (default: CWD)' })),
  limit: Type.Optional(Type.Number({ description: 'Max results (default: 20)', default: 20 })),
  'ignore-case': Type.Optional(Type.Boolean({ description: 'Case-insensitive search (-i)', default: false })),
  glob: Type.Optional(Type.String({ description: 'File glob filter, e.g. *.ts' })),
  context: Type.Optional(Type.Number({ description: 'Context lines before/after match (-C)', default: 0 })),
  fixed: Type.Optional(Type.Boolean({ description: 'Literal search, not regex (-F)', default: false })),
});

export type RgInput = {
  pattern: string;
  path?: string;
  limit?: number;
  'ignore-case'?: boolean;
  glob?: string;
  context?: number;
  fixed?: boolean;
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
  description: 'Search file contents for a pattern using ripgrep. Returns matching lines with file:line:content. Respects .gitignore.',
  promptSnippet: 'Search file contents with ripgrep (respects .gitignore)',
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

      const args = buildArgs(params);
      const searchPath = params.path || '.';
      args.push(searchPath);

      const rg = spawn('rg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      const rl = createInterface({ input: rg.stdout });
      const lines: string[] = [];
      let stderr = '';

      rg.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

      rl.on('line', (line: string) => { lines.push(line); });

      const cleanup = () => { rl.close(); };

      rg.on('error', (err: Error) => {
        cleanup();
        settle(() => reject(new Error(`rg binary not available: ${err.message}`)));
      });

      rg.on('close', (code: number | null) => {
        cleanup();
        if (settled) return;
        if (signal?.aborted) {
          settle(() => reject(new Error('Operation aborted')));
          return;
        }

        // rg exit code: 0 = hits, 1 = no hits, >1 = error
        if (code !== null && code > 1) {
          const msg = stderr.trim() || `rg exited with code ${code}`;
          settle(() => resolve({ content: [{ type: 'text', text: `ERROR: ${msg}` }], details: undefined }));
          return;
        }

        if (lines.length === 0) {
          settle(() => resolve({ content: [{ type: 'text', text: 'NO MATCHES:' }], details: undefined }));
          return;
        }

        const limit = params.limit ?? 20;
        const output = lines.join('\n');
        const result = lines.length >= limit
          ? `${output}\n[Limit: ${limit} results]`
          : output;
        settle(() => resolve({ content: [{ type: 'text', text: result }], details: undefined }));
      });
    });
  },
};
