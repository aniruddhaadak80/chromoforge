# Data provenance

## Exoplanet catalog

`packages/core/src/exoplanets/catalog.ts` seeds 22 confirmed exoplanets with parameters curated
from the [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/): mass, radius,
orbital period, insolation, stellar effective temperature, J2000 RA/Dec, distance, discovery
year. Values are rounded for legibility; coordinates are approximate to the precision shown.

The demo and the test suite never touch the network. To refresh or expand the seed against the
live archive:

```bash
python services/agents/data/fetch_catalog.py --limit 60
```

The fetcher queries the TAP service (`ps` table, `default_flag=1`) and writes
`exoplanets.seed.json`. **Re-curate by hand before trusting a refresh** — automated rows have
different units, missing values, and naming conventions.

## Gene parts

`packages/core/src/genetics/parts.ts` is illustrative teaching material: promoters, ORFs,
terminators and regulators with short DNA motifs and per-part upkeep. It is a design toy, not a
synthesis order form. The biosecurity engine exists to keep the dangerous combinations
unreachable.
