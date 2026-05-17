import { Type } from 'typebox';
import { spawn } from 'child_process';
import { createInterface } from 'readline';

/**
 * fd tool — find files by name using fd.
 * Minimal, agent-friendly wrapper around `fd` binary.
 */

const FdSchema = Type.Object({
  pattern: Type.String({ description: 'File name pattern (glob or regex)' }),
  path: Type.Optional(Type.String({ description: 'Directory to search (default: CWD)' })),
  limit: Type.Optional(Type.Number({ description: 'Max results (default: 20)', default: 20 })),
  type: Type.Optional(Type.String({ description: 'File type: f (file), d (dir), l (symlink)' })),
  extension: Type.Optional(Type.String({ description: 'Filter by extension, e.g. ts, md' })),
  hidden: Type.Optional(Type.Boolean({ description: 'Include hidden files/dirs', default: false })),
  maxDepth: Type.Optional(Type.Number({ description: 'Max directory depth' })),
});

export type FdInput = {
  pattern: string;
  path?: string;
  limit?: number;
  type?: string;
  extension?: string;
  hidden?: boolean;
  maxDepth?: number;
};

function buildArgs(params: FdInput): string[] {
  const args: string[] = ['--glob', '--color=never'];
  if (params.hidden) args.push('--hidden');
  if (params.type) args.push('--type', params.type);
  if (params.extension) args.push('--extension', params.extension);
  if (params.maxDepth !== undefined) args.push('--max-depth', String(params.maxDepth));
  const limit = params.limit ?? 20;
  if (limit > 0) args.push('--max-results', String(limit));
  args.push('--', params.pattern);
  return args;
}

export const fdToolDef = {
  name: 'fd',
  label: 'fd',
  description: 'Find files by glob pattern using fd. Returns file paths relative to search directory. Respects .gitignore.',
  promptSnippet: 'Find files by glob pattern (respects .gitignore)',
  parameters: FdSchema,
  execute: async (
    _toolCallId: string,
    params: FdInput,
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

      const fd = spawn('fd', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      const rl = createInterface({ input: fd.stdout });
      const lines: string[] = [];
      let stderr = '';

      fd.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

      rl.on('line', (line: string) => { lines.push(line); });

      const cleanup = () => { rl.close(); };

      fd.on('error', (err: Error) => {
        cleanup();
        settle(() => reject(new Error(`fd binary not available: ${err.message}`)));
      });

      fd.on('close', (code: number | null) => {
        cleanup();
        if (settled) return;
        if (signal?.aborted) {
          settle(() => reject(new Error('Operation aborted')));
          return;
        }

        if (code !== null && code > 1) {
          const msg = stderr.trim() || `fd exited with code ${code}`;
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
