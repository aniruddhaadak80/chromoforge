## What

One sentence: what this changes.

## Why

The tradeoff or bug this buys/fixes. If it changes behavior that has a fixture
(`services/agents/parity/fixtures.json`), say which engine and why.

## How to test

```powershell
bun run typecheck && bun run lint && bun run test && bun run build && bunx playwright test
```

- [ ] Gates pass locally (paste the failing line if any)
- [ ] Tests cover the new behavior (unit for core, e2e for top flows)
- [ ] Architecture change? The matching `docs/diagrams/*.mmd` was updated
- [ ] Docs updated (science page for any modeling change; ADR for policy changes)
- [ ] No secrets, no lorem ipsum, no `any`, no `eslint-disable`
