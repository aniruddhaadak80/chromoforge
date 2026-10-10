# ADR-0002 — The demo must run with zero API keys

- **Status:** Accepted
- **Date:** 2026-10-10

## Context

Agent demos that need an LLM key break at the worst moment: the conference wifi, the hiring
manager's laptop, three years later when the key rotates. This repo's job is to be *played with*.

## Decision

Every "AI" behavior is a deterministic finite-state simulation: `packages/core/agents/crew.ts`
implements the crew with rubric-driven templates and seeded phrasing. No network calls exist in
the runtime path. Data is a curated offline seed of the NASA Exoplanet Archive
(`python/agents/data/fetch_catalog.py` is the optional refresh path).

## Consequences

- The product is honest about being a simulation — which is also its thesis.
- Determinism makes the whole system testable and the history replayable.
- A future LLM-backed crew can slot in behind the same interface without changing the contract.
