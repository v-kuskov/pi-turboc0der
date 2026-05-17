import { promises as fs } from 'fs';
import {
  createAgentSession,
  DefaultResourceLoader,
  getAgentDir,
} from '@earendil-works/pi-coding-agent';

jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return { ...actual, promises: { readFile: jest.fn() } };
});

// Mock prompts to avoid get-os-info dynamic import in test env
jest.mock('../src/prompts', () => ({
  CAVEMAN_PROMPT: '# Response style',
  SECURITY_PROMPT: '# Security **MANDATORY RULES**',
  TOOLS_PROMPT: '# Tool usage',
  systemStatePrompt: jest
    .fn()
    .mockResolvedValue('OS: Windows 10\nCWD: /test'),
}));

import { runWithPrompt, loadAgent } from '../src/runner';
import { discoverAgent } from '../src/discover-agent';
import { BUILDIN_AGENTS } from '../src/buildin-agents';

jest.mock('../src/discover-agent');

// ─── Test data ──────────────────────────────────────────────────
const PROMPTS = ['# Agent Rules\nDo the thing.'];
const ASSISTANT_RESPONSE = 'Task completed.';

// ─── Helpers ─────────────────────────────────────────────────────
function createMockSession(responseText?: string) {
  let subFn: ((event: { type: string }) => void) | null = null;

  return {
    subscribe: jest.fn((fn: typeof subFn) => {
      subFn = fn;
      return jest.fn();
    }),
    getLastAssistantText: jest.fn(() => responseText),
    agent: { state: { errorMessage: undefined as string | undefined } },
    prompt: jest.fn(async () => {
      if (subFn) subFn({ type: 'agent_end' });
    }),
    dispose: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('runWithPrompt', () => {
  test('prepends essential prompts, appends system state, returns assistant text', async () => {
    const mockSession = createMockSession(ASSISTANT_RESPONSE);
    (getAgentDir as jest.Mock).mockReturnValue('/fake/agent/dir');
    (createAgentSession as jest.Mock).mockResolvedValue({ session: mockSession });

    const result = await runWithPrompt(PROMPTS);

    expect(result).toBe(ASSISTANT_RESPONSE);
    expect(getAgentDir).toHaveBeenCalledTimes(1);
    // Check that the joined system prompt starts with essential prompts and contains user prompt
    const systemPromptArg = (DefaultResourceLoader as jest.Mock).mock
      .calls[0][0].systemPrompt;
    expect(systemPromptArg).toContain('# Response style');
    expect(systemPromptArg).toContain('# Security **MANDATORY RULES**');
    expect(systemPromptArg).toContain('# Tool usage');
    expect(systemPromptArg).toContain('# Agent Rules\nDo the thing.');
    expect(systemPromptArg).toContain('OS: Windows 10');
    // Essential prompts come before user prompts, system state at end
    const essentialIdx = systemPromptArg.indexOf('# Response style');
    const userIdx = systemPromptArg.indexOf('# Agent Rules');
    const stateIdx = systemPromptArg.indexOf('OS: Windows 10');
    expect(essentialIdx).toBeLessThan(userIdx);
    expect(userIdx).toBeLessThan(stateIdx);
    expect(DefaultResourceLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        noExtensions: true,
        noPromptTemplates: true,
        noThemes: true,
        noContextFiles: true,
      })
    );
    expect(createAgentSession).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceLoader: expect.anything(),
        tools: undefined,
      })
    );
    expect(mockSession.prompt).toHaveBeenCalledWith('', {
      expandPromptTemplates: true,
    });
  });

  test('joins multiple prompts between essential prompts and system state', async () => {
    const mockSession = createMockSession(ASSISTANT_RESPONSE);
    (getAgentDir as jest.Mock).mockReturnValue('/fake/agent/dir');
    (createAgentSession as jest.Mock).mockResolvedValue({ session: mockSession });
    const multiPrompts = ['# Part 1', '# Part 2'];

    await runWithPrompt(multiPrompts);

    const systemPromptArg = (DefaultResourceLoader as jest.Mock).mock
      .calls[0][0].systemPrompt;
    // User prompts between essentials and system state
    const part1Idx = systemPromptArg.indexOf('# Part 1');
    const part2Idx = systemPromptArg.indexOf('# Part 2');
    const stateIdx = systemPromptArg.indexOf('OS: Windows 10');
    expect(part1Idx).toBeLessThan(part2Idx);
    expect(part2Idx).toBeLessThan(stateIdx);
    // Essential prompts come before user prompts
    const securityIdx = systemPromptArg.indexOf('# Security');
    expect(securityIdx).toBeLessThan(part1Idx);
  });

  test('throws when agent returns no text', async () => {
    const mockSession = createMockSession(undefined);
    mockSession.agent.state.errorMessage = 'Model did not respond';
    (getAgentDir as jest.Mock).mockReturnValue('/fake/agent/dir');
    (createAgentSession as jest.Mock).mockResolvedValue({ session: mockSession });

    await expect(runWithPrompt(PROMPTS)).rejects.toThrow(
      'Model did not respond'
    );
  });

  test('throws "No assistant response" when both text and errorMessage are absent', async () => {
    const mockSession = createMockSession(undefined);
    (getAgentDir as jest.Mock).mockReturnValue('/fake/agent/dir');
    (createAgentSession as jest.Mock).mockResolvedValue({ session: mockSession });

    await expect(runWithPrompt(PROMPTS)).rejects.toThrow(
      'No assistant response'
    );
  });

  test('passes allowedTools to createAgentSession', async () => {
    const mockSession = createMockSession(ASSISTANT_RESPONSE);
    (getAgentDir as jest.Mock).mockReturnValue('/fake/agent/dir');
    (createAgentSession as jest.Mock).mockResolvedValue({ session: mockSession });
    const allowed = ['read', 'bash'];

    await runWithPrompt(PROMPTS, allowed);

    expect(createAgentSession).toHaveBeenCalledWith(
      expect.objectContaining({ tools: ['read', 'bash'] })
    );
  });

  test('calls session.dispose after completion', async () => {
    const mockSession = createMockSession(ASSISTANT_RESPONSE);
    (getAgentDir as jest.Mock).mockReturnValue('/fake/agent/dir');
    (createAgentSession as jest.Mock).mockResolvedValue({ session: mockSession });

    await runWithPrompt(PROMPTS);

    expect(mockSession.dispose).toHaveBeenCalledTimes(1);
  });

  test('calls session.dispose even when agent returns no text', async () => {
    const mockSession = createMockSession(undefined);
    (getAgentDir as jest.Mock).mockReturnValue('/fake/agent/dir');
    (createAgentSession as jest.Mock).mockResolvedValue({ session: mockSession });

    await expect(runWithPrompt(PROMPTS)).rejects.toThrow();

    expect(mockSession.dispose).toHaveBeenCalledTimes(1);
  });
});

describe('loadAgent', () => {
  const AGENT_NAME = 'test-agent';
  const AGENT_CONTENT = '# Test Agent\nDo the thing.';

  test('discovers agent via discoverAgent, reads file, returns prompts', async () => {
    (discoverAgent as jest.Mock).mockReturnValue('/path/to/test-agent.md');
    (fs.readFile as jest.Mock).mockResolvedValue(AGENT_CONTENT);

    const result = await loadAgent(AGENT_NAME);

    expect(result).toEqual([AGENT_CONTENT]);
    expect(discoverAgent).toHaveBeenCalledWith(AGENT_NAME);
    expect(fs.readFile).toHaveBeenCalledWith('/path/to/test-agent.md', 'utf-8');
  });

  test('falls back to BUILDIN_AGENTS when discoverAgent returns undefined', async () => {
    (discoverAgent as jest.Mock).mockReturnValue(undefined);
    BUILDIN_AGENTS[AGENT_NAME] = [AGENT_CONTENT];

    const result = await loadAgent(AGENT_NAME);

    expect(result).toEqual([AGENT_CONTENT]);
    expect(discoverAgent).toHaveBeenCalledWith(AGENT_NAME);
    expect(fs.readFile).not.toHaveBeenCalled();

    delete BUILDIN_AGENTS[AGENT_NAME];
  });

  test('throws when agent not found anywhere', async () => {
    (discoverAgent as jest.Mock).mockReturnValue(undefined);

    await expect(loadAgent('nonexistent-agent')).rejects.toThrow(
      'Agent not found: nonexistent-agent'
    );
  });
});