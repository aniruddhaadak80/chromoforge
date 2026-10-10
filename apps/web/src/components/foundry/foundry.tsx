"use client";

import { useMemo, useState } from "react";
import {
  partsByKind,
  evaluateBiosafety,
  deriveTraits,
  upkeep,
  TRAIT_AXES,
  designGuides,
  briefCrew,
  createCrew,
  hashSeed,
  simulate,
  fitnessOf,
  getExoplanet,
  deriveEnvironment,
} from "@repo/core";
import type { Genome, GuideCandidate, TraitAxis } from "@repo/core";
import { EXOPLANETS } from "@repo/core";
import { useFoundry } from "@/lib/store";
import { cn } from "@/lib/cn";
import { Card, Badge, Meter } from "@/components/ui";

/* ------------------------------------------------------------------ */
/* Part shelf + tray                                                    */
/* ------------------------------------------------------------------ */

export function PartShelf() {
  const { genome, addSlot } = useFoundry();
  const [query, setQuery] = useState("");
  const inTray = new Set(genome.slots.map((s) => s.partId));
  const groups = useMemo(
    () => [
      { kind: "promoter" as const, label: "promoters" },
      { kind: "orf" as const, label: "genes (ORFs)" },
      { kind: "terminator" as const, label: "terminators" },
      { kind: "regulatory" as const, label: "regulatory" },
    ],
    [],
  );
  return (
    <div data-testid="part-shelf" className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search 20+ gene parts…"
        aria-label="Search gene parts"
        className="w-full rounded-panel border border-hull bg-surface-2 px-3 py-2 font-mono text-sm text-star placeholder:text-muted/60 focus:border-bio/50 focus:outline-none"
      />
      {groups.map(({ kind, label }) => {
        const parts = partsByKind(kind).filter((p) =>
          `${p.id} ${p.name} ${p.family} ${p.description}`.toLowerCase().includes(query.toLowerCase()),
        );
        if (parts.length === 0) return null;
        return (
          <div key={kind}>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">{label}</p>
            <ul className="mt-2 space-y-2">
              {parts.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    data-part={p.id}
                    data-testid="part-card"
                    disabled={inTray.has(p.id)}
                    onClick={() => addSlot({ partId: p.id, copies: 1 })}
                    className={cn(
                      "w-full rounded-panel border p-3 text-left transition-colors",
                      inTray.has(p.id)
                        ? "border-hull/50 bg-surface/40 opacity-50"
                        : "border-hull bg-surface/70 hover:border-bio/40",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-bold">{p.name}</span>
                      {p.regulated ? <Badge tone="amber">regulated</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs text-muted">{p.description}</p>
                    <p className="mt-1 font-mono text-[10px] text-muted/70">upkeep {p.upkeep} · {p.family}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function Tray() {
  const { genome, removeSlot, setCopies, rename, setChassis } = useFoundry();
  return (
    <Card data-testid="tray" className="space-y-3">
      <div className="space-y-2">
        <label className="block font-mono text-xs uppercase tracking-widest text-muted" htmlFor="strain-name">
          strain name
        </label>
        <input
          id="strain-name"
          value={genome.name}
          onChange={(e) => rename(e.target.value)}
          className="w-full rounded-panel border border-hull bg-surface-2 px-3 py-2 font-display text-star focus:border-bio/50 focus:outline-none"
        />
        <label className="block font-mono text-xs uppercase tracking-widest text-muted" htmlFor="chassis">
          chassis
        </label>
        <input
          id="chassis"
          value={genome.chassis}
          onChange={(e) => setChassis(e.target.value)}
          className="w-full rounded-panel border border-hull bg-surface-2 px-3 py-2 font-mono text-sm text-star focus:border-bio/50 focus:outline-none"
        />
      </div>
      <ul className="space-y-2">
        {genome.slots.map((slot) => (
          <li
            key={slot.partId}
            className="flex items-center gap-2 rounded-panel border border-hull bg-surface-2/60 p-2"
          >
            <span className="flex-1 font-mono text-xs text-star">{slot.partId}</span>
            <button
              type="button"
              aria-label={`decrease copies of ${slot.partId}`}
              onClick={() => setCopies(slot.partId, Math.max(1, slot.copies - 1))}
              className="h-6 w-6 rounded border border-hull font-mono text-star hover:border-bio/50"
            >
              −
            </button>
            <span className="w-6 text-center font-mono text-sm" aria-label={`${slot.copies} copies`}>
              {slot.copies}
            </span>
            <button
              type="button"
              aria-label={`increase copies of ${slot.partId}`}
              onClick={() => setCopies(slot.partId, Math.min(3, slot.copies + 1))}
              className="h-6 w-6 rounded border border-hull font-mono text-star hover:border-bio/50"
            >
              +
            </button>
            <button
              type="button"
              aria-label={`remove ${slot.partId}`}
              onClick={() => removeSlot(slot.partId)}
              className="h-6 w-6 rounded border border-danger/40 font-mono text-danger hover:bg-danger/10"
            >
              ×
            </button>
          </li>
        ))}
        {genome.slots.length === 0 ? (
          <li className="text-sm text-muted">Empty bench — add parts from the shelf.</li>
        ) : null}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Traits                                                               */
/* ------------------------------------------------------------------ */

const TRAIT_LABELS: Record<TraitAxis, string> = {
  thermotolerance: "thermotolerance",
  radioresistance: "radioresistance",
  photosyntheticEfficiency: "photosynthesis",
  osmoticTolerance: "osmotic tolerance",
  metabolicRate: "metabolic rate",
  pigmentation: "pigmentation",
  sporeFormation: "spore formation",
  nitrogenFixation: "nitrogen fixation",
  toxinProduction: "toxin production",
};

export function TraitBars({ genome }: { genome: Genome }) {
  const traits = useMemo(() => deriveTraits(genome), [genome]);
  return (
    <Card data-testid="trait-bars" className="space-y-2">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">derived phenotype</p>
      <ul className="space-y-2">
        {TRAIT_AXES.map((axis) => (
          <li key={axis}>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-muted">{TRAIT_LABELS[axis]}</span>
              <span className="text-star">{Math.round(traits[axis] * 100)}</span>
            </div>
            <Meter value={traits[axis]} tone={axis === "toxinProduction" ? "danger" : "bio"} label={TRAIT_LABELS[axis]} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Biosafety verdict                                                    */
/* ------------------------------------------------------------------ */

export function VerdictBadge({ genome }: { genome: Genome }) {
  const report = useMemo(() => evaluateBiosafety(genome), [genome]);
  return (
    <div data-testid="verdict-badge" className="space-y-2">
      <div className="flex items-center gap-3">
        <Badge tone={report.verdict === "block" ? "danger" : report.verdict === "review" ? "amber" : "bio"}>
          {report.verdict}
        </Badge>
        <span className="font-mono text-xs text-muted">
          risk index {Math.round(report.riskIndex * 100)} · upkeep {upkeep(genome)}
        </span>
      </div>
      {report.findings.length > 0 ? (
        <ul className="space-y-1">
          {report.findings.map((f) => (
            <li key={f.ruleId} className="font-mono text-xs text-muted">
              <span className={f.severity === "block" ? "text-danger" : "text-amber"}>{f.ruleId}</span>{" "}
              {f.title}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Guide bench                                                          */
/* ------------------------------------------------------------------ */

export function GuideTable({ genome }: { genome: Genome }) {
  const orfs = genome.slots.filter((s) => s.partId.startsWith("orf"));
  const [target, setTarget] = useState<string>(orfs[0]?.partId ?? "");
  const guides: GuideCandidate[] = useMemo(
    () => (target ? designGuides(genome, target, 5) : []),
    [genome, target],
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="target" className="font-mono text-xs uppercase tracking-widest text-muted">
          target gene
        </label>
        <select
          id="target"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="rounded-panel border border-hull bg-surface-2 px-3 py-2 font-mono text-sm text-star"
        >
          {orfs.map((s) => (
            <option key={s.partId} value={s.partId}>{s.partId}</option>
          ))}
        </select>
      </div>
      {guides.length === 0 ? (
        <p className="text-sm text-muted">No ORF in the bench yet — add a gene in the Composer.</p>
      ) : (
        <div className="overflow-x-auto" data-testid="guide-table">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="font-mono text-xs uppercase tracking-widest text-muted">
                <th className="py-2 pr-4">protospacer</th>
                <th className="py-2 pr-4">PAM</th>
                <th className="py-2 pr-4">GC%</th>
                <th className="py-2 pr-4">poly</th>
                <th className="py-2 pr-4">self</th>
                <th className="py-2 pr-4">off-target</th>
                <th className="py-2">score</th>
              </tr>
            </thead>
            <tbody>
              {guides.map((g) => (
                <tr key={g.sequence} data-testid="guide-row" className="border-t border-hull/60">
                  <td className="py-2 pr-4 font-mono text-cyan">{g.sequence}</td>
                  <td className="py-2 pr-4 font-mono text-muted">{g.pam}</td>
                  <td className="py-2 pr-4 font-mono">{Math.round(g.gc * 100)}</td>
                  <td className="py-2 pr-4 font-mono">{g.homopolymerRun}</td>
                  <td className="py-2 pr-4 font-mono">{g.selfComplementarity}</td>
                  <td className="py-2 pr-4 font-mono">{g.offTargets}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <Meter value={g.score} label={`score ${g.score.toFixed(2)}`} />
                      <span className="font-mono text-xs text-muted">{g.score.toFixed(2)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* World picker                                                         */
/* ------------------------------------------------------------------ */

export function WorldPicker() {
  const { worldId, setWorld } = useFoundry();
  return (
    <label className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted">
      target world
      <select
        value={worldId}
        onChange={(e) => setWorld(e.target.value)}
        aria-label="Target world"
        data-testid="world-picker"
        className="rounded-panel border border-hull bg-surface-2 px-3 py-2 font-mono text-sm text-star"
      >
        {EXOPLANETS.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Briefing panel                                                       */
/* ------------------------------------------------------------------ */

export function BriefingPanel({ genome, worldId }: { genome: Genome; worldId: string }) {
  const [briefing, setBriefing] = useState<ReturnType<typeof briefCrew> | null>(null);
  const planet = getExoplanet(worldId);
  const env = deriveEnvironment(planet);
  const fitness = fitnessOf(deriveTraits(genome), env);
  const verdict = evaluateBiosafety(genome).verdict;
  const crewNames: Record<string, string> = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of createCrew("brief")) m[a.id] = a.name;
    return m;
  }, []);

  return (
    <Card data-testid="briefing-panel" className="space-y-3">
      <button
        type="button"
        data-testid="crew-brief"
        onClick={() =>
          setBriefing(
            briefCrew({
              seed: `release-${genome.id}-${worldId}`,
              action: "release",
              organism: genome.name,
              world: planet.name,
              fitness,
              biosafety: verdict,
              complexity: genome.slots.length,
            }),
          )
        }
        className="rounded-full bg-bio px-4 py-2 text-sm font-semibold text-abyss hover:bg-bio/85"
      >
        Request crew briefing
      </button>
      {briefing ? (
        <ol className="space-y-2">
          {briefing.steps.map((s, i) => (
            <li key={`${s.agentId}-${i}`} className="flex gap-3 text-sm">
              <span className="font-mono text-xs text-muted">{(s.elapsedMs / 1000).toFixed(2)}s</span>
              <span
                className={cn(
                  "font-mono text-xs uppercase",
                  s.state === "thinking" && "text-cyan",
                  s.state === "reporting" && "text-bio",
                  s.state === "dissenting" && "text-danger",
                  s.state === "idle" && "text-muted",
                )}
              >
                {crewNames[s.agentId] ?? s.agentId}
              </span>
              <span className="text-muted">{s.text}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted">
          The crew will review {genome.name} for release at {planet.name} (predicted fitness{" "}
          {Math.round(fitness * 100)}%).
        </p>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Crew room                                                            */
/* ------------------------------------------------------------------ */

export function CrewCard({ genome, worldId }: { genome: Genome; worldId: string }) {
  const crew = useMemo(() => createCrew(`crew-${genome.id}`), [genome.id]);
  const planet = getExoplanet(worldId);
  return (
    <div className="grid gap-4 md:grid-cols-3" data-testid="crew-room">
      {crew.map((agent) => (
        <Card key={agent.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold">{agent.name}</h3>
            <Badge tone={agent.role === "ethicist" ? "amber" : "cyan"}>{agent.role}</Badge>
          </div>
          <p className="text-sm text-muted">{agent.title}</p>
          <div className="font-mono text-xs text-muted">
            stubbornness {Math.round(agent.stubbornness * 100)} · deference {Math.round(agent.deference * 100)}
          </div>
          <p className="text-xs text-muted/80">
            Next stop: {planet.name}.
          </p>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Simulation controls + charts                                         */
/* ------------------------------------------------------------------ */

export function SimControls({ onRun }: { onRun: (cfg: { generations: number; founders: number; mutationStdDev: number; seed: number }) => void }) {
  const [generations, setGenerations] = useState(60);
  const [founders, setFounders] = useState(100);
  const [mutation, setMutation] = useState(0.4);
  return (
    <Card data-testid="sim-controls" className="flex flex-wrap items-end gap-4">
      <label className="font-mono text-xs uppercase tracking-widest text-muted">
        generations
        <input
          type="number"
          min={20}
          max={200}
          value={generations}
          onChange={(e) => setGenerations(Number(e.target.value))}
          className="mt-1 block w-24 rounded-panel border border-hull bg-surface-2 px-2 py-1 font-mono text-star"
        />
      </label>
      <label className="font-mono text-xs uppercase tracking-widest text-muted">
        founders
        <input
          type="number"
          min={10}
          max={500}
          value={founders}
          onChange={(e) => setFounders(Number(e.target.value))}
          className="mt-1 block w-24 rounded-panel border border-hull bg-surface-2 px-2 py-1 font-mono text-star"
        />
      </label>
      <label className="font-mono text-xs uppercase tracking-widest text-muted">
        mutation σ
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={mutation}
          onChange={(e) => setMutation(Number(e.target.value))}
          className="mt-2 block w-32 accent-bio"
        />
      </label>
      <button
        type="button"
        data-testid="sim-run"
        onClick={() => onRun({ generations, founders, mutationStdDev: mutation, seed: hashSeed(`run-${generations}-${founders}-${mutation}`) })}
        className="rounded-full bg-bio px-4 py-2 text-sm font-semibold text-abyss hover:bg-bio/85"
      >
        Run simulation
      </button>
    </Card>
  );
}

export function runSimulation(genome: Genome, worldId: string, cfg: { generations: number; founders: number; mutationStdDev: number; seed: number }) {
  return simulate(genome, worldId, cfg);
}
