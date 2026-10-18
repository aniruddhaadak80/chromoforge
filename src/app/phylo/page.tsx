"use client";

import { useMemo } from "react";
import { deriveTraits, buildLineage, AXIS_LABELS, getPart, TRAIT_AXES } from "@repo/core";
import { useFoundry } from "@/lib/store";
import { Card, Badge, Meter } from "@/components/ui";
import { cn } from "@/lib/cn";

export default function PhyloPage() {
  const { strains } = useFoundry();
  const lineage = useMemo(() => buildLineage(strains), [strains]);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-bio">phylogeny</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Strain lineage</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Every committed release joins the tree. Each node shows what changed against its parent —
          the evolutionary path your bench actually took, not a decorative chart.
        </p>
      </div>

      {lineage.length === 0 ? (
        <Card className="text-sm text-muted">
          No releases committed yet. Design an organism in the{" "}
          <a href="/composer" className="text-bio underline decoration-bio/40">Composer</a>, clear the
          gate in the{" "}
          <a href="/release" className="text-bio underline decoration-bio/40">Release Bay</a>, and it
          lands here.
        </Card>
      ) : (
        <ol className="relative space-y-4 border-l border-hull pl-6" data-testid="lineage-tree">
          {lineage.map((node) => {
            const traits = deriveTraits({
              id: node.id,
              name: node.name,
              chassis: node.chassis,
              slots: node.slots,
            });
            const isCurrent = node.depth === lineage.length - 1;
            return (
              <li key={node.id} className="relative" data-testid="lineage-node">
                <span
                  className={cn(
                    "absolute -left-[1.9rem] top-4 h-3 w-3 rounded-full border-2 border-abyss",
                    isCurrent ? "bg-bio" : "bg-cyan",
                  )}
                  aria-hidden
                />
                <Card className={cn(isCurrent && "border-bio/40")}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted">
                        gen {String(node.depth).padStart(2, "0")}
                      </span>
                      <h2 className="font-display text-lg font-bold">{node.name}</h2>
                      {isCurrent ? <Badge tone="bio">current</Badge> : null}
                    </div>
                    <span className="font-mono text-xs text-muted">
                      {new Date(node.createdAt).toLocaleTimeString()} · {node.partCount} parts · upkeep{" "}
                      {node.upkeep}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted">{node.chassis}</p>

                  {node.innovations.length > 0 ? (
                    <p className="mt-2 text-xs text-cyan">drift: {node.innovations.join(" · ")}</p>
                  ) : node.depth === 0 ? (
                    <p className="mt-2 text-xs text-muted">
                      root of the lineage — the first release of this bench.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted">no measurable trait drift from its parent.</p>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {TRAIT_AXES.filter((axis) => axis !== "toxinProduction")
                      .slice(0, 6)
                      .map((axis) => (
                        <div key={axis}>
                          <p className="font-mono text-[10px] uppercase tracking-wide text-muted">
                            {AXIS_LABELS[axis]}
                          </p>
                          <Meter value={traits[axis]} label={axis} tone="bio" />
                        </div>
                      ))}
                  </div>

                  <ul className="mt-3 flex flex-wrap gap-1">
                    {node.slots.map((slot) => (
                      <li
                        key={slot.partId}
                        className="rounded border border-hull px-1.5 py-0.5 font-mono text-[10px] text-muted"
                        title={getPart(slot.partId).name}
                      >
                        {slot.partId}
                        {slot.copies > 1 ? `×${slot.copies}` : ""}
                      </li>
                    ))}
                  </ul>
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
