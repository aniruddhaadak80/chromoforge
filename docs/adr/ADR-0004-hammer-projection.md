# ADR-0004 — Hammer equal-area projection for the Sky Atlas

- **Status:** Accepted
- **Date:** 2026-10-10

## Context

The Atlas maps exoplanets by their real J2000 right ascension and declination. The classic
choices are Mercator (familiar, but polar distortion) or Hammer–Aitoff (equal-area, whole-sky,
mild edge distortion — the convention of the real star atlases).

## Decision

Use Hammer, with RA normalized into [-180°, 180°) before halving. Normalization matters: `sin`
and `cos` of `ra/2` are not 360°-periodic, so skipping the fold maps ra=0° and ra=360° to
different points and lets |y| exceed the map boundary. With the fold, `cos(ra/2) ≥ 0`, the
denominator never dips below 1, and the map stays inside the ellipse `x²/4 + y² = 1`.

## Consequences

- Pins are tiny circles with `<title>` elements (keyboard/screen-reader accessible).
- The projection is unit-tested round-trip to within one degree.
- The inverse exists (`hammerUnproject`) for future click-to-locate.
