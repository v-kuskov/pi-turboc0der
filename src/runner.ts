import { promises as fs } from 'fs';
import {
  createAgentSession,
  DefaultResourceLoader,
  getAgentDir,
} from '@earendil-works/pi-coding-agent';
import { discoverAgent } from './discover-agent';
import { BUILDIN_AGENTS } from './buildin-agents';
import {
  CAVEMAN_PROMPT,
  SECURITY_PROMPT,
  TOOLS_PROMPT,
  systemStatePrompt,
} from './prompts';

/**
 * Run pi instance with given prompts as system prompt.
 *
 * Creates minimal pi session — no extensions, no prompt templates, no themes.
 * `@` references in prompt text are expanded via pi's built-in template expansion.
 *
 * @param prompts — Array of prompt strings joined with \n\n to form system prompt.
 * @param allowedTools — Optional tool allowlist. Default (undefined) = all tools.
 *                       Pass empty array for no tools.
 * @returns Assistant's full text response.
 */
export async function runWithPrompt(
  prompts: string[],
  allowedTools?: string[]
): Promise<string> {
  const cwd = process.cwd();
  const agentDir = getAgentDir();

  // 1. Build full prompt stack: essential prompts → user prompts → system state
  const systemPromptContent = [
    CAVEMAN_PROMPT,
    SECURITY_PROMPT,
    TOOLS_PROMPT,
    ...prompts,
    await systemStatePrompt(),
  ].join('\n\n');

  // 2. Minimal resource loader: no extensions, no prompt templates, no themes
  const resourceLoader = new DefaultResourceLoader({
    cwd,
    agentDir,
    systemPrompt: systemPromptContent,
    noExtensions: true,
    noPromptTemplates: true,
    noThemes: true,
    noContextFiles: true,
  });
  await resourceLoader.reload();

  // 3. Create session
  const { session } = await createAgentSession({
    cwd,
    resourceLoader,
    tools: allowedTools,
  });

  // 4. Send prompt, capture assistant response via events
  try {
    return await new Promise<string>((resolve, reject) => {
      const unsub = session.subscribe((event) => {
        if (event.type === 'agent_end') {
          unsub();
          const text = session.getLastAssistantText();
          if (text !== undefined) {
            resolve(text);
          } else {
            reject(
              new Error(
                session.agent.state.errorMessage ?? 'No assistant response'
              )
            );
          }
        }
      });

      session
        .prompt('', { expandPromptTemplates: true })
        .catch((err: unknown) => {
          unsub();
          reject(err);
        });
    });
  } finally {
    session.dispose();
  }
}

/**
 * Resolve agent prompts by name.
 *
 * Priority:
 * 1. discoverAgent(name) — filesystem lookup (global ~/.pi/agents/, then local .pi/agents/)
 * 2. BUILDIN_AGENTS[name] — built-in table
 *
 * @param name — Agent name (without .md extension).
 * @returns Array of prompt strings ready for runWithPrompt.
 * @throws If no agent found by name.
 */
export async function loadAgent(name: string): Promise<string[]> {
  // Priority 1: filesystem
  const agentPath = discoverAgent(name);
  if (agentPath !== undefined) {
    const content = await fs.readFile(agentPath, 'utf-8');
    return [content];
  }

  // Priority 2: built-in table
  const builtin = BUILDIN_AGENTS[name];
  if (builtin !== undefined) {
    return builtin;
  }

  throw new Error(`Agent not found: ${name}`);
}