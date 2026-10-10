# ADR-0005 — SQLite-shaped domain, but no database in the demo path

- **Status:** Accepted
- **Date:** 2026-10-10

## Context

The bench state (genomes, strains, mission seeds) is small and personal. Requiring a database to
try the product adds a failure mode; pretending state never matters breaks the workflow.

## Decision

Client state is a persisted zustand store (localStorage, hydrated after mount so SSR HTML always
matches). The domain layer is pure and shaped so a SQLite/Postgres persistence adapter can be
added later without touching the simulation. There is no server database in v1.

## Consequences

- Clone → install → run, with zero services. Vercel deploy stays static-ish and cheap.
- Strain persistence is per-browser, which is honest for a toy and easy to fix later.
- The parity fixtures and seed data keep the "world" reproducible regardless of storage.
