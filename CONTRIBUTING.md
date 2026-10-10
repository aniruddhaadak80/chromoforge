# Contributing to chromoforge

Thanks for helping build the foundry. This is an educational simulator; the bar is honesty about
what it models and quality in what it ships.

## Ground rules

1. **The gate is the feature.** `BIOSAFETY_POLICY` blocks dangerous constructs on purpose. Do not
   weaken rules to make a demo pass — policy changes go through an ADR in `docs/adr/`.
2. **Zero API keys.** Every feature must work with no network and no secrets. "AI" behavior is
   deterministic local simulation (`packages/core/agents`).
3. **Real content only.** No lorem ipsum, no `any`, no `eslint-disable` carpet. Every line should
   mean something.
4. **One logical change per commit**, Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`).

## Setup

```powershell
git clone https://github.com/aniruddhaadak80/chromoforge.git
cd chromoforge
bun install
bun run dev
```

## Before you push

```powershell
bun run typecheck   # strict, verbatimModuleSyntax
bun run lint        # zero warnings
bun run test        # vitest (domain) 
bun run build       # next build must pass
bunx playwright test   # e2e includes an axe accessibility scan
```

Service-side checks (optional but appreciated):

```bash
cargo check --tests --manifest-path crates/ecology/Cargo.toml   # full `cargo test` in CI (ubuntu)
cd python/agents && python -m pytest tests -q                 # parity vs typescript fixtures
bin/parity.sh                                                  # regenerate fixtures + diff engines
```

## Layout

```
apps/web/       Next.js 16 app — pages, API routes, components
packages/core   pure domain logic (genetics, exoplanets, ecology, agents)
crates/ecology  Rust reference engine (parity oracle)
python/agents Python service + parity harness + catalog fetcher
docs/           diagrams (.mmd), ADRs, guides, runbooks
scripts/        gen-assets.mjs (SVGs), loc-count.mjs (scale measure)
```

## Where to start

Look for issues labeled `good first issue`. Most involve the simulator or the docs. If you touch
the physics, read `docs/guides/the-science.md` first and say in the PR which assumption you changed
and why — the assumptions are stated precisely so they can be argued with.

## Code of conduct

By participating you agree to the [Contributor Covenant v2.1](CODE_OF_CONDUCT.md).
