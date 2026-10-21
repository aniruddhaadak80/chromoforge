"use client";

import { useMemo, useState } from "react";
import { deriveEnvironment } from "@repo/core";
import type { Exoplanet } from "@repo/core";
import { cn } from "@/lib/cn";
import { Card, Badge } from "@/components/ui";
import { CopyButton } from "@/components/ui/copy-button";

export interface VaultRow {
  planet: Exoplanet;
  env: ReturnType<typeof deriveEnvironment>;
}

const REGIME_TONE: Record<string, "bio" | "cyan" | "amber" | "danger"> = {
  temperate: "bio",
  cool: "cyan",
  hot: "danger",
  sterilizing: "amber",
  "deep-freeze": "cyan",
};

type SortKey = "name" | "temperature" | "distance";

export function VaultFilters({ rows }: { rows: VaultRow[] }) {
  const [query, setQuery] = useState("");
  const [star, setStar] = useState<string>("all");
  const [tag, setTag] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [selectedId, setSelectedId] = useState<string>(rows[0]?.planet.id ?? "");

  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) for (const t of r.planet.tags) s.add(t);
    return [...s].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter(({ planet }) => {
      if (star !== "all" && planet.starType !== star) return false;
      if (tag !== "all" && !planet.tags.includes(tag)) return false;
      if (q && !(`${planet.name} ${planet.hostStar} ${planet.note}`.toLowerCase().includes(q))) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === "temperature") return a.env.tempK - b.env.tempK;
      if (sort === "distance") return a.planet.distanceLy - b.planet.distanceLy;
      return a.planet.name.localeCompare(b.planet.name);
    });
  }, [rows, query, star, tag, sort]);

  const selected = filtered.find((r) => r.planet.id === selectedId) ?? filtered[0];

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3" data-testid="vault-filter">
        <input
          type="search"
          placeholder="Search worlds…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search exoplanets"
          className="rounded-panel border border-hull bg-surface-2 px-3 py-2 font-mono text-sm text-star placeholder:text-muted/60 focus:border-bio/50 focus:outline-none"
        />
        <select
          value={star}
          onChange={(e) => setStar(e.target.value)}
          aria-label="Filter by star type"
          className="rounded-panel border border-hull bg-surface-2 px-3 py-2 font-mono text-sm text-star"
        >
          <option value="all">all star types</option>
          {["M", "K", "G", "F"].map((s) => (
            <option key={s} value={s}>{s}-dwarf</option>
          ))}
        </select>
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          aria-label="Filter by tag"
          className="rounded-panel border border-hull bg-surface-2 px-3 py-2 font-mono text-sm text-star"
        >
          <option value="all">all tags</option>
          {allTags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort worlds"
          className="ml-auto rounded-panel border border-hull bg-surface-2 px-3 py-2 font-mono text-sm text-star"
        >
          <option value="name">sort: name</option>
          <option value="temperature">sort: temperature</option>
          <option value="distance">sort: distance</option>
        </select>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ planet, env }) => (
            <li key={planet.id}>
              <button
                type="button"
                onClick={() => setSelectedId(planet.id)}
                className="w-full text-left"
                data-testid="planet-card"
                data-planet={planet.id}
              >
                <Card
                  className={cn(
                    "h-full",
                    planet.id === selected?.planet.id && "border-bio/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold leading-tight">{planet.name}</h3>
                    <Badge tone={REGIME_TONE[env.regime] ?? "neutral"}>{env.regime}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {planet.hostStar} · {planet.distanceLy} ly · {planet.discoveryYear}
                  </p>
                  <dl className="mt-3 grid grid-cols-3 gap-2 font-mono text-xs">
                    <div><dt className="text-muted">temp</dt><dd className="text-star">{env.tempK} K</dd></div>
                    <div><dt className="text-muted">grav</dt><dd className="text-star">{env.gravity.toFixed(2)}</dd></div>
                    <div><dt className="text-muted">water</dt><dd className="text-star">{Math.round(env.water * 100)}%</dd></div>
                  </dl>
                </Card>
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="text-muted">No worlds match those filters.</li>
          ) : null}
        </ul>

        {selected ? (
          <Card className="h-fit" data-testid="planet-detail">
            <p className="font-mono text-xs uppercase tracking-widest text-bio">{selected.planet.hostStar}</p>
            <h3 className="mt-1 font-display text-2xl font-bold">{selected.planet.name}</h3>
            <p className="mt-2 text-sm text-muted">{selected.planet.note}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs">
              {(
                [
                  ["mass", `${selected.planet.massEarth} M⊕`],
                  ["radius", `${selected.planet.radiusEarth} R⊕`],
                  ["period", `${selected.planet.periodDays} d`],
                  ["insolation", `${selected.planet.insolation} S⊕`],
                  ["star temp", `${selected.planet.starTempK} K`],
                  ["radiation", `${selected.env.radiationIndex.toFixed(2)}× Earth`],
                  ["atmosphere", `${Math.round(selected.env.atmosphere * 100)}%`],
                  ["RA / Dec", `${selected.planet.ra.toFixed(1)}° / ${selected.planet.dec.toFixed(1)}°`],
                ] satisfies Array<[string, string]>
              ).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-muted">{k}</dt>
                  <dd className="flex items-center gap-1.5 text-star">
                    <span>{v}</span>
                    <CopyButton value={v} label={k} />
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.planet.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
