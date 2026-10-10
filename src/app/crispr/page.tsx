"use client";

import { useFoundry } from "@/lib/store";
import { GuideTable } from "@/components/foundry/foundry";
import { Card } from "@/components/ui";
import { genomeSequence } from "@repo/core";

export default function CrisprPage() {
  const { genome } = useFoundry();
  return (
    <div data-testid="crispr" className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-bio">guide bench</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">CRISPR guide design</h1>
        <p className="mt-2 max-w-2xl text-muted">
          SpCas9 wants a 20 nt protospacer followed by an NGG PAM. We score candidates by GC content
          (50% is ideal), penalize homopolymer runs and self-complementarity, then rank them after
          scanning the organism&apos;s assembled sequence for near-matches within two mismatches — a
          real off-target search, not a coin flip.
        </p>
      </div>
      <Card>
        <GuideTable genome={genome} />
      </Card>
      <p className="font-mono text-xs text-muted">
        assembled sequence: {genomeSequence(genome).length.toLocaleString()} bp
      </p>
    </div>
  );
}
