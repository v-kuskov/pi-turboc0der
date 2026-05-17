import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export function discoverAgent(name: string): string | undefined {
  // Priority 1: global agents ~/.pi/agents/{name}.md
  const globalPath = path.join(os.homedir(), '.pi', 'agents', `${name}.md`);
  if (fs.existsSync(globalPath)) return globalPath;

  // Priority 2: project-local agents .pi/agents/{name}.md
  const localPath = path.join(process.cwd(), '.pi', 'agents', `${name}.md`);
  if (fs.existsSync(localPath)) return localPath;

  return undefined;
}
