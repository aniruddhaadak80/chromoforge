"use client";

import { useMemo } from "react";
import { validateGenome } from "@repo/core";
import { useFoundry } from "@/lib/store";
import { PartShelf, Tray, TraitBars, VerdictBadge } from "@/components/foundry/foundry";
import { Card } from "@/components/ui";

export default function ComposerPage() {
  const { genome } = useFoundry();
  const validation = useMemo(() => validateGenome(genome), [genome]);

  return (
    <div data-testid="composer" className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-bio">composer</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Genome composer</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Stack cassettes like a bench scientist. Traits derive from part effects with saturation —
          the second copy of a gene helps less than the first, and maintenance burden taxes
          everything you add.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[22rem_1fr_18rem]">
        <Card className="max-h-[36rem] overflow-y-auto">
          <PartShelf />
        </Card>
        <div className="space-y-4">
          <Tray />
          {(validation.errors.length > 0 || validation.warnings.length > 0) && !validation.ok ? (
            <Card className="border-danger/40">
              <p className="font-mono text-xs uppercase tracking-widest text-danger">errors</p>
              <ul className="mt-2 space-y-1 text-sm text-danger/90">
                {validation.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Card>
          ) : validation.warnings.length > 0 ? (
            <Card className="border-amber/40">
              <p className="font-mono text-xs uppercase tracking-widest text-amber">warnings</p>
              <ul className="mt-2 space-y-1 text-sm text-amber/90">
                {validation.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
        <div className="space-y-4">
          <TraitBars genome={genome} />
          <Card>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">policy engine</p>
            <div className="mt-2">
              <VerdictBadge genome={genome} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
