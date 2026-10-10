"use client";

import { useMemo } from "react";
import Link from "next/link";
import { deriveEnvironment, getExoplanet, fitnessOf, deriveTraits, upkeep, EXOPLANETS } from "@repo/core";
import { useFoundry } from "@/lib/store";
import { Card, Stat, Badge } from "@/components/ui";
import { VerdictBadge } from "@/components/foundry/foundry";
import { Dna, FlaskConical, Orbit, ShieldCheck, Sparkles, LineChart, Radio } from "lucide-react";

const STATIONS = [
  { href: "/composer", icon: Dna, label: "Compose the genome", copy: "Cassettes, copies, live traits" },
  { href: "/crispr", icon: Sparkles, label: "Design guides", copy: "Scoring + off-target scan" },
  { href: "/release", icon: FlaskConical, label: "Run the release gate", copy: "Crew briefing + policy" },
  { href: "/theater", icon: LineChart, label: "Open the sim theater", copy: "Generations, population, fate" },
  { href: "/safety", icon: ShieldCheck, label: "Read the safety ledger", copy: "Every rule, every verdict" },
  { href: "/crew", icon: Radio, label: "Meet the crew", copy: "Three local agents, no API keys" },
];

export default function DashboardPage() {
  const { genome, worldId, strains } = useFoundry();
  const planet = useMemo(() => getExoplanet(worldId), [worldId]);
  const env = useMemo(() => deriveEnvironment(planet), [planet]);
  const fitness = useMemo(() => fitnessOf(deriveTraits(genome), env), [genome, env]);

  return (
    <div data-testid="dashboard" className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-bio">foundry</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
          {genome.name}
        </h1>
        <p className="mt-1 font-mono text-xs text-muted">
          {genome.chassis} · {genome.slots.length} slots · upkeep {upkeep(genome)} · heading to{" "}
          <Link href="/atlas" className="text-cyan underline decoration-cyan/40">{planet.name}</Link>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="predicted fitness" value={`${Math.round(fitness * 100)}%`} hint={`on ${planet.name}`} />
        <Stat label="world regime" value={env.regime} hint={`${env.tempK} K equilibrium`} />
        <Stat label="radiation" value={`${env.radiationIndex.toFixed(1)}×`} hint="relative to Earth" />
        <Stat label="verdict" value={<Badge tone="bio">{genome.slots.length} parts</Badge>} hint={`${EXOPLANETS.length} worlds in the vault`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="grid gap-3 sm:grid-cols-2">
          {STATIONS.map(({ href, icon: Icon, label, copy }) => (
            <Link key={href} href={href}>
              <Card className="h-full hover:border-bio/40">
                <Icon className="h-5 w-5 text-bio" aria-hidden />
                <h2 className="mt-2 font-display font-bold">{label}</h2>
                <p className="text-sm text-muted">{copy}</p>
              </Card>
            </Link>
          ))}
        </div>
        <div className="space-y-4">
          <Card>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">biosafety</p>
            <div className="mt-2">
              <VerdictBadge genome={genome} />
            </div>
          </Card>
          <Card>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">released strains</p>
            {strains.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Nothing released yet — the gate is in the Release Bay.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {strains.map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm">
                    <span className="font-display font-semibold">{s.genome.name}</span>
                    <Orbit className="h-4 w-4 text-cyan" aria-hidden />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
