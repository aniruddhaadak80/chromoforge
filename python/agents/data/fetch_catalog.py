#!/usr/bin/env python3
"""Fetch the confirmed-planet table from the NASA Exoplanet Archive (TAP).

This is the *refresh* path for the exoplanet catalog: chromoforge ships a
curated offline seed in packages/core/src/exoplanets/catalog.ts (so the demo
and the test suite never need the network). Run this when you want to expand
or verify the seed against the live archive.

Usage:
    python data/fetch_catalog.py [--limit 60] [--out data/exoplanets.seed.json]

Query docs: https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html
"""

from __future__ import annotations

import argparse
import json
import urllib.parse
import urllib.request
from pathlib import Path

TAP_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

COLUMNS = [
    "pl_name",
    "hostname",
    "st_spectype",
    "st_teff",
    "pl_bmassj",  # converted to Earth masses below
    "pl_rade",
    "pl_orbper",
    "pl_insol",
    "sy_dist",
    "ra",
    "dec",
    "disc_year",
]

QUERY = (
    f"select {','.join(COLUMNS)} from ps where default_flag=1 and pl_rade is not null"
)

# Jupiter mass -> Earth mass
MJ_TO_MEARTH = 317.83


def fetch(limit: int) -> list[dict]:
    params = urllib.parse.urlencode(
        {
            "query": f"{QUERY} order by pl_insol desc",
            "format": "json",
            "maxrec": str(limit),
        }
    )
    with urllib.request.urlopen(f"{TAP_URL}?{params}", timeout=60) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return payload


def normalize(row: dict) -> dict:
    mass_earth = row.get("pl_bmassj")
    return {
        "name": row.get("pl_name", "unknown"),
        "hostStar": row.get("hostname", "unknown"),
        "starType": (row.get("st_spectype") or "G")[:1].upper() or "G",
        "starTempK": row.get("st_teff"),
        "massEarth": round(mass_earth * MJ_TO_MEARTH, 2) if mass_earth else None,
        "radiusEarth": row.get("pl_rade"),
        "periodDays": row.get("pl_orbper"),
        "insolation": row.get("pl_insol"),
        "distanceLy": round(row.get("sy_dist") or 0, 1),
        "ra": row.get("ra"),
        "dec": row.get("dec"),
        "discoveryYear": row.get("disc_year"),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=60)
    parser.add_argument(
        "--out", default=str(Path(__file__).parent / "exoplanets.seed.json")
    )
    args = parser.parse_args()

    rows = fetch(args.limit)
    normalized = [normalize(r) for r in rows]
    Path(args.out).write_text(json.dumps(normalized, indent=2), encoding="utf-8")
    print(f"wrote {len(normalized)} planets -> {args.out}")
    print(
        "note: values come straight from the archive; re-curate before trusting in the seed"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
