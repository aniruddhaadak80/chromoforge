"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getExoplanet, deriveEnvironment } from "@repo/core";
import { useFoundry } from "@/lib/store";
import { SimControls, runSimulation } from "@/components/foundry/foundry";
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";

export default function TheaterPage() {
  const { genome, worldId } = useFoundry();
  const planet = getExoplanet(worldId);
  const env = deriveEnvironment(planet);
  const [result, setResult] = useState<ReturnType<typeof runSimulation> | null>(null);

  const data = result?.history.map((h) => ({
    generation: h.generation,
    population: h.population,
    fitness: h.meanFitness,
  })) ?? [];

  return (
    <div data-testid="theater" className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-bio">sim theater</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Survival simulation</h1>
        <p className="mt-2 max-w-2xl text-muted">
          {genome.name} meets {planet.name} ({env.regime}, {env.tempK} K, water{" "}
          {Math.round(env.water * 100)}%). Every run is deterministic for its seed — the same genome,
          world and seed always replay the same history.
        </p>
      </div>

      <SimControls
        onRun={(cfg) => setResult(runSimulation(genome, worldId, cfg))}
      />

      {result ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid="export-csv"
              onClick={() => {
                const header = "generation,population,mean_fitness,events\n";
                const rows = result.history
                  .map(
                    (h) =>
                      `${h.generation},${h.population},${h.meanFitness},"${h.events.join("; ")}"`,
                  )
                  .join("\n");
                const blob = new Blob([header + rows], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${genome.name.replace(/\s+/g, "-")}-${planet.name
                  .replace(/\s+/g, "-")
                  .toLowerCase()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-full border border-hull px-4 py-2 text-sm text-star transition-colors hover:border-bio/50"
            >
              Download run as CSV
            </button>
            <span className="font-mono text-xs text-muted">
              {result.history.length} generations · seed-deterministic
            </span>
          </div>
          <div
            data-testid="outcome-banner"
            className={cn(
              "rounded-panel border p-4 font-display text-lg font-bold",
              result.outcome === "thriving" && "border-bio/50 bg-bio/10 text-bio",
              result.outcome === "surviving" && "border-cyan/50 bg-cyan/10 text-cyan",
              result.outcome === "extinct" && "border-danger/50 bg-danger/10 text-danger",
            )}
          >
            {result.outcome === "thriving"
              ? "Thriving — the colony filled its niche."
              : result.outcome === "surviving"
                ? "Surviving — the colony persists, but barely."
                : `Extinct at generation ${result.extinctAt ?? "?"}. The world won.`}
          </div>

          <Card data-testid="result-charts">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-64">
                <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">population</p>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <CartesianGrid stroke="#1b2942" strokeDasharray="3 3" />
                    <XAxis dataKey="generation" stroke="#8ba3c7" fontSize={11} fontFamily="monospace" />
                    <YAxis stroke="#8ba3c7" fontSize={11} fontFamily="monospace" />
                    <Tooltip
                      contentStyle={{ background: "#0d1420", border: "1px solid #1b2942", borderRadius: 12 }}
                      labelStyle={{ color: "#8ba3c7" }}
                    />
                    <Area type="monotone" dataKey="population" stroke="#38e8b0" fill="#38e8b022" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="h-64">
                <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">mean fitness</p>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid stroke="#1b2942" strokeDasharray="3 3" />
                    <XAxis dataKey="generation" stroke="#8ba3c7" fontSize={11} fontFamily="monospace" />
                    <YAxis domain={[0, 1]} stroke="#8ba3c7" fontSize={11} fontFamily="monospace" />
                    <Tooltip
                      contentStyle={{ background: "#0d1420", border: "1px solid #1b2942", borderRadius: 12 }}
                      labelStyle={{ color: "#8ba3c7" }}
                    />
                    <Line type="monotone" dataKey="fitness" stroke="#7dd3fc" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="mt-2 font-mono text-xs text-muted">
              peak population {result.peakPopulation.toLocaleString()} · generations simulated {result.history.length}
            </p>
          </Card>

          <Card>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">event log</p>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm text-muted">
              {result.history
                .filter((h) => h.events.length > 0)
                .map((h) => (
                  <li key={h.generation}>
                    <span className="font-mono text-cyan">gen {h.generation}</span> — {h.events.join(" · ")}
                  </li>
                ))}
            </ul>
          </Card>
        </>
      ) : null}
    </div>
  );
}
