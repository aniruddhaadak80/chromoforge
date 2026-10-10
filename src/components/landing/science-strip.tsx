import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

interface Formula {
  expression: string;
  label: string;
  note: string;
}

const FORMULAS: readonly Formula[] = [
  {
    expression: "T = 288 · S^¼",
    label: "Equilibrium temperature",
    note: "insolation S in Earth flux units, plus a fixed greenhouse assumption",
  },
  {
    expression: "g = M / R²",
    label: "Surface gravity",
    note: "mass over radius squared, in Earth units",
  },
  {
    expression: "R = class × √S",
    label: "Radiation index",
    note: "a lookup by star type — M dwarfs flare, G stars behave like ours",
  },
  {
    expression: "risk = blocks·0.5 + reviews·0.18",
    label: "Biosafety index",
    note: "aggregated from the published policy, capped at 1",
  },
];

export function ScienceStrip() {
  return (
    <Section
      id="science"
      eyebrow="No black boxes"
      title="The physics, stated plainly"
      description="Every derived number in this app comes from one of four formulas you can read in an afternoon. They are simple on purpose — and the limits are documented on the science page."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FORMULAS.map((formula) => (
          <Card key={formula.label} tone="raised" className="h-full space-y-2">
            <p className="font-mono text-lg text-bio">{formula.expression}</p>
            <p className="font-display text-sm font-semibold text-star">
              {formula.label}
            </p>
            <p className="text-xs leading-relaxed text-muted">{formula.note}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
