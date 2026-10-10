# ADR-0001 — Keep a Rust reference engine for the simulation

- **Status:** Accepted
- **Date:** 2026-10-10

## Context

The survival simulation is the heart of the product. It will be argued about, tweaked, and
trusted only as far as it is *reproducible*. A single implementation means a regression anywhere
silently changes the science, and the demo cannot prove anything about correctness.

## Decision

Maintain three implementations of the identical algorithm, operation-for-operation:

1. `packages/core/src/ecology/simulate.ts` — the source of truth, used by the app.
2. `crates/ecology` — Rust reference engine, zero dependencies.
3. `python/agents/sim.py` — Python port used by the batch service.

`packages/core/scripts/gen-vectors.ts` emits fixtures from the TypeScript engine; the Rust and
Python implementations are diffed against those fixtures (`bin/parity.sh`, pytest, cargo tests).
Parity requires bit-level care: the same mulberry32 stream (including JS `Math.imul` semantics)
and JavaScript's `Math.round` (floor(x+0.5), not round-half-away-from-zero).

## Consequences

- Correctness changes must land in all three engines plus fixtures, in the same PR.
- A subtle behavioral rule documented in one place (the TS source) drives everything.
- Rust cannot be *run* on Windows hosts without an MSVC linker; it is verified with
  `cargo check --tests` locally and full `cargo test` in CI (ubuntu-latest). This is documented in
  `crates/ecology/.cargo/config.toml` and its README rather than papered over with fake C-runtime
  stubs.
