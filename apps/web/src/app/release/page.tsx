"use client";

import { useMemo, useState } from "react";
import { getExoplanet, deriveEnvironment, fitnessOf, deriveTraits, evaluateBiosafety } from "@repo/core";
import { useFoundry } from "@/lib/store";
import { WorldPicker, BriefingPanel } from "@/components/foundry/foundry";
import { Card, Badge, Meter } from "@/components/ui";

export default function ReleasePage() {
  const { genome, worldId, commitStrain } = useFoundry();
  const planet = useMemo(() => getExoplanet(worldId), [worldId]);
  const env = useMemo(() => deriveEnvironment(planet), [planet]);
  const fitness = useMemo(() => fitnessOf(deriveTraits(genome), env), [genome, env]);
  const verdict = useMemo(() => evaluateBiosafety(genome), [genome]);
  const [committed, setCommitted] = useState<string | null>(null);

  return (
    <div data-testid="release-bay" className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-bio">release bay</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Release gate</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Nothing leaves the foundry without a crew briefing. If the policy engine blocks the
          construct, the gate stays shut — the constraint is the feature.
        </p>
      </div>

      <Card className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">organism</p>
          <p className="font-display text-xl font-bold">{genome.name}</p>
          <p className="font-mono text-xs text-muted">{genome.slots.length} parts</p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">predicted fitness</p>
          <p className="font-display text-xl font-bold text-star">{Math.round(fitness * 100)}%</p>
          <Meter value={fitness} label="predicted fitness" />
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">policy verdict</p>
          <Badge tone={verdict.verdict === "block" ? "danger" : verdict.verdict === "review" ? "amber" : "bio"}>
            {verdict.verdict}
          </Badge>
        </div>
        <div className="md:col-span-3">
          <WorldPicker />
        </div>
      </Card>

      <BriefingPanel genome={genome} worldId={worldId} />

      <Card className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">commit release</p>
        {verdict.verdict === "block" ? (
          <p className="text-sm text-danger">
            Locked: the policy engine blocked this construct. Redesign in the Composer and clear
            every blocked rule first.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              commitStrain(crypto.randomUUID());
              setCommitted(genome.name);
            }}
            className="rounded-full bg-bio px-4 py-2 text-sm font-semibold text-abyss hover:bg-bio/85"
          >
            Commit release
          </button>
        )}
        {committed ? (
          <p className="font-mono text-xs text-bio">
            {committed} released to {planet.name}. Logged in the strain history.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
