"use client";

import { useMemo, useState } from "react";
import { EXOPLANETS, deriveEnvironment, hammerProject, HAMMER_BOUNDS, skyGrid } from "@repo/core";
import type { Exoplanet } from "@repo/core";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui";

const REGIME_TONE: Record<string, string> = {
  temperate: "#38e8b0",
  cool: "#7dd3fc",
  hot: "#f87171",
  sterilizing: "#fbbf24",
  "deep-freeze": "#7dd3fc",
};

const width = HAMMER_BOUNDS.xMax * 2.1;
const height = HAMMER_BOUNDS.yMax * 2.1;

export function SkyMap() {
  const [selected, setSelected] = useState<string | null>(null);
  const grid = useMemo(() => skyGrid(), []);
  const pins = useMemo(
    () =>
      EXOPLANETS.map((p) => ({ planet: p, env: deriveEnvironment(p), at: hammerProject(p.ra, p.dec) })),
    [],
  );
  const selectedEntry = pins.find((p) => p.planet.id === selected) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <Card className="overflow-hidden p-2">
        <svg
          viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label="Hammer equal-area projection of confirmed exoplanets"
          data-testid="sky-map"
        >
          <defs>
            <radialGradient id="sky-glow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#111a2b" />
              <stop offset="100%" stopColor="#070b12" />
            </radialGradient>
          </defs>
          <ellipse cx={0} cy={0} rx={HAMMER_BOUNDS.xMax} ry={HAMMER_BOUNDS.yMax} fill="url(#sky-glow)" stroke="#1b2942" strokeWidth={0.02} />
          {grid.parallels.map((line, i) => (
            <polyline
              key={`p-${i}`}
              points={line.map((v) => `${v.x},${v.y}`).join(" ")}
              fill="none"
              stroke="#1b2942"
              strokeWidth={0.008}
              opacity={0.5}
            />
          ))}
          {grid.meridians.map((line, i) => (
            <polyline
              key={`m-${i}`}
              points={line.map((v) => `${v.x},${v.y}`).join(" ")}
              fill="none"
              stroke="#1b2942"
              strokeWidth={0.008}
              opacity={0.5}
            />
          ))}
          {pins.map(({ planet, env, at }) => {
            const tone = REGIME_TONE[env.regime] ?? "#7dd3fc";
            const active = planet.id === selected;
            return (
              <g key={planet.id}>
                <circle
                  cx={at.x}
                  cy={at.y}
                  r={active ? 0.05 : 0.03}
                  fill={tone}
                  stroke={active ? "#e8eefc" : "transparent"}
                  strokeWidth={0.012}
                  className="cursor-pointer transition-all"
                  onClick={() => setSelected(planet.id)}
                  data-testid="atlas-pin"
                  data-planet={planet.id}
                >
                  <title>{planet.name}</title>
                </circle>
                {active ? (
                  <text x={at.x + 0.06} y={at.y - 0.05} fill="#e8eefc" fontSize={0.09} fontFamily="monospace">
                    {planet.name}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </Card>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 font-mono text-xs text-muted">
          {Object.entries(REGIME_TONE).map(([r, c]) => (
            <span key={r} className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: c }} aria-hidden />
              {r}
            </span>
          ))}
        </div>
        <ul className="max-h-[26rem] space-y-1 overflow-y-auto pr-1">
          {pins.map(({ planet, env }) => (
            <li key={planet.id}>
              <button
                type="button"
                onMouseEnter={() => setSelected(planet.id)}
                onClick={() => setSelected(planet.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-panel border px-3 py-2 text-left text-sm transition-colors",
                  planet.id === selected
                    ? "border-bio/50 bg-bio/10 text-star"
                    : "border-hull bg-surface/60 text-muted hover:border-hull/80 hover:text-star",
                )}
              >
                <span className="font-display font-semibold">{planet.name}</span>
                <span className="font-mono text-xs">{env.tempK} K</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">
          Hammer equal-area projection · J2000 coordinates · {EXOPLANETS.length} worlds from the
          NASA Exoplanet Archive (seeded).
        </p>
        {selectedEntry ? (
          <Card className="text-sm" data-testid="atlas-detail">
            <p className="font-display text-lg font-bold">{selectedEntry.planet.name}</p>
            <p className="mt-1 text-muted">{selectedEntry.planet.note}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
              <div><dt className="text-muted">regime</dt><dd className="text-cyan">{selectedEntry.env.regime}</dd></div>
              <div><dt className="text-muted">gravity</dt><dd className="text-cyan">{selectedEntry.env.gravity.toFixed(2)} g</dd></div>
              <div><dt className="text-muted">radiation</dt><dd className="text-cyan">{selectedEntry.env.radiationIndex.toFixed(2)}×</dd></div>
              <div><dt className="text-muted">water</dt><dd className="text-cyan">{Math.round(selectedEntry.env.water * 100)}%</dd></div>
            </dl>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

export function AtlasPanel() {
  return <SkyMap />;
}

export type { Exoplanet };
