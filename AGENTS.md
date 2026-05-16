# pi-turboc0der

PI coding agent extension. Hooks `before_agent_start` to inject hacker persona system prompt.

## Stack

- TypeScript 5.x — source + tests
- Jest + ts-jest — testing
- `@earendil-works/pi-coding-agent` — PI ExtensionAPI

## Structure

```
src/
  index.ts          — entry point, registers ExtensionAPI hook
  prompts.ts        — prompt templates (identity, caveman, code, think, tools, security, workflow)
  prompt-builder.ts — IPrompt interface, combine/select/compose helpers
  tool-installer.ts — IToolInstaller interface
  tools/index.ts    — tool implementations
  plan-enforcer.ts  — plan state machine
test/
  prompt-builder.test.ts
```

## Commands

| Command | Action |
|---------|--------|
| `npm test` | Run Jest tests with ts-jest |
| `npm run build` | Compile TS with `tsc` |

## Conventions

- **Prompt composition**: Use `prompt()` factory, `combine()` to merge, `select()` for mode-gated prompts. See `prompt-builder.ts`.
- **Mode-gating**: Prompts accept `Mode` for conditional resolution based on read/write/execute capabilities.
- **No config in prompts**: `SystemStatePrompt` resolves at injection time, pulls OS info via `get-os-info`.
- **Output dir**: `dist/` (compiled JS mirrors `src/` and `test/` layout).