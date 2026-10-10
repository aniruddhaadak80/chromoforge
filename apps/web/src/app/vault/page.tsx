import type { Metadata } from "next";
import { EXOPLANETS, deriveEnvironment } from "@repo/core";
import type { Exoplanet } from "@repo/core";
import { VaultFilters } from "@/components/vault/vault-filters";

export const metadata: Metadata = { title: "exoplanet vault" };

/** Serialize a planet for passing to the client island as plain data. */
export function serializePlanet(p: Exoplanet) {
  return {
    id: p.id,
    name: p.name,
    hostStar: p.hostStar,
    starType: p.starType,
    starTempK: p.starTempK,
    massEarth: p.massEarth,
    radiusEarth: p.radiusEarth,
    periodDays: p.periodDays,
    insolation: p.insolation,
    distanceLy: p.distanceLy,
    ra: p.ra,
    dec: p.dec,
    discoveryYear: p.discoveryYear,
    note: p.note,
    tags: p.tags,
  };
}

export default function VaultPage() {
  const rows = EXOPLANETS.map((planet) => {
    const env = deriveEnvironment(planet);
    return { planet: serializePlanet(planet), env };
  });
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-bio">vault</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Exoplanet vault</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {EXOPLANETS.length} confirmed worlds, seeded offline from the NASA Exoplanet Archive.
        Regime labels are derived from the same physics the simulator runs.
      </p>
      <div className="mt-6" data-testid="vault-grid">
        <VaultFilters rows={rows} />
      </div>
    </div>
  );
}
