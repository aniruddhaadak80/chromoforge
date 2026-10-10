import { Cpu, Dna, Orbit, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

interface Capability {
  icon: typeof Dna;
  title: string;
  body: string;
}

const CAPABILITIES: readonly Capability[] = [
  {
    icon: Dna,
    title: "Genome composer",
    body: "Stack promoters, ORFs, terminators and regulators from a curated parts catalogue. Traits are derived with saturation — five chaperone copies help, with diminishing returns, the same way biology behaves.",
  },
  {
    icon: ShieldCheck,
    title: "Guides behind a gate",
    body: "Guide candidates are scored on GC content, homopolymer runs and self-complementarity, then off-target-scanned against the assembled sequence. A published policy engine blocks hazardous constructs outright.",
  },
  {
    icon: Orbit,
    title: "Only real worlds",
    body: "Every environment is derived from published exoplanet parameters: equilibrium temperature, gravity, a radiation index by star class and water availability. No invented planets, no hand-waved atmospheres.",
  },
  {
    icon: Cpu,
    title: "Deterministic sim",
    body: "Same seed, same ecology, same result. The simulation is pure functions over a seeded random source — reproducible in tests, with zero network calls anywhere in the app.",
  },
];

export function CapabilityGrid() {
  return (
    <Section
      id="capabilities"
      eyebrow="What you can do"
      title="A foundry, not a screensaver"
      description="Four working stations, one shared domain core. Everything below is implemented in the open — the numbers are in the code, not in marketing copy."
      data-testid="capability-grid"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CAPABILITIES.map(({ icon: Icon, title, body }) => (
          <Card key={title} tone="interactive" className="h-full space-y-3">
            <Icon className="h-6 w-6 text-bio" aria-hidden />
            <h3 className="font-display text-lg font-semibold text-star">{title}</h3>
            <p className="text-sm leading-relaxed text-muted">{body}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
