import { Type } from 'typebox';
import { spawn } from 'child_process';
import { createInterface } from 'readline';

const FdSchema = Type.Object({
  pattern: Type.String({ description: 'File name pattern (glob or regex)' }),
  path: Type.Optional(Type.String({ description: 'Dir to search (default: CWD)' })),
  type: Type.Optional(Type.String({ description: 'File type: f (file), d (dir), l (symlink)' })),
  extension: Type.Optional(Type.String({ description: 'Filter by extension, e.g. ts, md' })),
  hidden: Type.Optional(Type.Boolean({ description: 'Include hidden files/dirs', default: false })),
  maxDepth: Type.Optional(Type.Number({ description: 'Max dir depth' })),
});

export type FdInput = {
  pattern: string;
  path?: string;
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
  args.push('--', params.pattern);
  return args;
}

export const fdToolDef = {
  name: 'fd',
  label: 'fd',
  description: 'Find files by glob → [printed/total].',
  promptSnippet: 'find files by pattern',
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

      const proc = spawn('fd', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      const rl = createInterface({ input: proc.stdout });
      const lines: string[] = [];
      let stderr = '';

      proc.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
      rl.on('line', (line: string) => { lines.push(line); });

      const cleanup = () => { rl.close(); };

      proc.on('error', (err: Error) => {
        cleanup();
        settle(() => reject(new Error(`fd binary not available: ${err.message}`)));
      });

      proc.on('close', (code: number | null) => {
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

        const header = `fd "${params.pattern}"`;

        if (lines.length === 0) {
          settle(() => resolve({ content: [{ type: 'text', text: header }], details: undefined }));
          return;
        }

        const result = [header, ...lines].join('\n');
        settle(() => resolve({ content: [{ type: 'text', text: result }], details: undefined }));
      });
    });
  },
};
