# ADR-0003 — Ship a biosecurity policy engine, and let it block

- **Status:** Accepted
- **Date:** 2026-10-10

## Context

Tools that compose genetic constructs carry reputational risk. A design toy that will happily
stack a toxin cassette onto an adhesion operon teaches exactly the wrong instinct.

## Decision

`packages/core/src/genetics/biosecurity.ts` implements six published rules with three verdicts
(`allow`, `review`, `block`). Blocked constructs cannot be released — the UI disables the gate —
and every verdict is written to a visible ledger with rationale and remediation.

## Consequences

- The constraint becomes a product feature: visitors learn that the interesting part is the
  tradeoff, not the stack.
- Rules are code, reviewed like code; changing severity requires an ADR.
- The gate is a community norm, not a biological containment control — stated plainly in
  SECURITY.md and in the app footer.
