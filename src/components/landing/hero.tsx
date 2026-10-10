import { ArrowRight, BookOpen } from "lucide-react";
import { BIOSAFETY_POLICY, EXOPLANETS, PARTS } from "@repo/core";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Stat } from "@/components/ui/stat";

const SPEC_ITEMS = [
  "Next.js 16",
  "React 19",
  "TypeScript strict",
  "real NASA data",
  "zero API keys",
] as const;

export function Hero() {
  return (
    <div
      data-testid="landing-hero"
      className="grid gap-8 rounded-panel border border-hull bg-surface/80 p-6 sm:p-10 lg:grid-cols-[1.15fr_1fr]"
    >
      <div className="space-y-6">
        <Badge tone="bio">open source · synthetic biology lab</Badge>
        <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-star sm:text-5xl lg:text-6xl">
          Design life for <span className="text-bio">worlds we know exist.</span>
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          chromoforge is a synthetic-biology workbench that runs in your browser. Compose a
          genome from a real parts catalogue, design CRISPR guides behind a biosecurity gate
          that actually blocks hazardous constructs, then release the organism into the
          environment of a confirmed exoplanet — and watch the ecology run deterministically.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/dashboard" size="lg">
            Open the foundry
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
          <ButtonLink href="/about" size="lg" variant="secondary">
            <BookOpen className="h-4 w-4" aria-hidden />
            Read the science
          </ButtonLink>
        </div>
        <p className="font-mono text-xs uppercase tracking-wide text-muted">
          {SPEC_ITEMS.join(" · ")}
        </p>
      </div>

      <div className="flex flex-col justify-center gap-6 rounded-panel border border-hull bg-abyss/60 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-bio">
          On the bench today
        </p>
        <div className="grid grid-cols-2 gap-5">
          <Stat
            label="Worlds"
            value={EXOPLANETS.length}
            detail="seeded from the NASA Exoplanet Archive"
          />
          <Stat
            label="Gene parts"
            value={PARTS.length}
            detail="each carrying a real DNA motif"
          />
          <Stat
            label="Policy rules"
            value={BIOSAFETY_POLICY.length}
            detail="the safety gate is visible, not hidden"
          />
          <Stat label="API keys" value={0} detail="the simulation runs offline" />
        </div>
      </div>
    </div>
  );
}
