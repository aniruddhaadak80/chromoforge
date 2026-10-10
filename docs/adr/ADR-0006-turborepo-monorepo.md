# ADR-0006 — Turborepo workspace with a workspace protocol for @repo/core

- **Status:** Accepted
- **Date:** 2026-10-10

## Context

The domain logic is shared by the web app today and by tooling (fixtures, services) tomorrow.
Duplicating it or publishing it prematurely are both worse options.

## Decision

One Turborepo: `apps/web`, `packages/core`, `packages/config`. The web app depends on core via
the `workspace:*` protocol; core has no runtime dependencies beyond zod. Internal imports in
core use extensionless specifiers so TypeScript, Turbopack, and Vitest all resolve identically
(`.js`-suffixed imports pass `tsc` but fail Turbopack's re-export chains — caught by the build
gate, fixed in one sweep).

## Consequences

- `bun run build` at the root type-checks, tests, and builds every workspace.
- CI caches Turbo artifacts per workspace for fast PR feedback.
- Adding `packages/ui` or `apps/docs` later is mechanical.
