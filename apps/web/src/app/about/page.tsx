import type { Metadata } from "next";
import { Card, Section, Badge } from "@/components/ui";
import { BIOSAFETY_POLICY, EXOPLANETS } from "@repo/core";

export const metadata: Metadata = { title: "the science" };

export default function AboutPage() {
  return (
    <div data-testid="about-page" className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-widest text-bio">about chromoforge</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">
        An honest simulator, not a wet lab
      </h1>
      <p className="mt-4 text-muted">
        I built chromoforge because the interesting part of astrobiology is the <em>constraint</em>:
        real organisms don&apos;t get to be good at everything. Every joule spent on radiation repair
        is a joule not spent growing. Below is exactly what the simulation models, what it ignores,
        and where the numbers come from — so you can argue with it.
      </p>

      <Section kicker="the physics" title="What a world actually does to an organism">
        <Card className="space-y-3 text-sm text-muted">
          <p>
            <span className="text-star font-semibold">Equilibrium temperature.</span> We balance
            absorbed stellar flux against blackbody re-radiation: 288 K × S^0.25, where S is the
            planet&apos;s insolation in Earth units. Worlds that plausibly keep an atmosphere get a
            documented +22 K greenhouse assumption — deliberately generous, deliberately stated.
          </p>
          <p>
            <span className="text-star font-semibold">Gravity.</span> g = M/R² in Earth units, from
            the catalog&apos;s mass and radius. Nothing in the current model uses it except display —
            it&apos;s groundwork, not a fake lever.
          </p>
          <p>
            <span className="text-star font-semibold">Radiation.</span> A coarse UV/X-ray proxy per
            star class (G: 1.0, K: 1.4, M: 3.2, F: 1.6) scaled by √insolation. M dwarfs are the
            worst neighbours, which is why the habitable-zone worlds around them are such an
            interesting design problem.
          </p>
          <p>
            <span className="text-star font-semibold">Water.</span> From insolation and radius:
            small worlds in the temperate band keep water; hot or Neptune-class worlds don&apos;t
            report any.
          </p>
        </Card>
      </Section>

      <Section kicker="the genetics" title="Parts, traits, and saturation">
        <Card className="space-y-3 text-sm text-muted">
          <p>
            <span className="text-star font-semibold">Parts.</span> Promoters, ORFs, terminators and
            regulators with real DNA motifs and per-part upkeep. A genome&apos;s full sequence is the
            concatenation of its parts&apos; motifs — which is what makes the off-target scanner a
            genuine search rather than a coin flip.
          </p>
          <p>
            <span className="text-star font-semibold">Trait derivation.</span> Each ORF contributes
            signed effects on trait axes (thermotolerance, radioresistance, and friends). Copies
            stack with <em>saturation</em>: the second copy of hsp70 helps less than the first.
            Metabolic rate taxes overall fitness, so maximalism is punished.
          </p>
          <p>
            <span className="text-star font-semibold">Guides.</span> 20 nt protospacers with an NGG
            PAM, scored by GC content (50% ideal), homopolymer runs and self-complementarity, then
            ranked after scanning the assembled genome for near-matches within two mismatches.
          </p>
        </Card>
      </Section>

      <Section kicker="the rules" title="The biosafety policy is published and enforced">
        <p className="mb-4 text-sm text-muted">
          Design toys get a bad name when they hand out recipes. Every genome in chromoforge is
          evaluated against these {BIOSAFETY_POLICY.length} rules before it can be released. Some
          outcomes are blocked outright — by design.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="policy-table">
            <thead>
              <tr className="border-b border-hull font-mono text-xs uppercase tracking-widest text-muted">
                <th className="py-2 pr-4">Rule</th>
                <th className="py-2 pr-4">Severity</th>
                <th className="py-2">Why it exists</th>
              </tr>
            </thead>
            <tbody>
              {BIOSAFETY_POLICY.map((rule) => (
                <tr key={rule.id} className="border-b border-hull/60 align-top">
                  <td className="py-3 pr-4 font-mono text-cyan">{rule.id}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={rule.severity === "block" ? "danger" : "amber"}>{rule.severity}</Badge>
                  </td>
                  <td className="py-3 text-muted">{rule.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section kicker="the data" title="Where the numbers come from">
        <Card className="space-y-3 text-sm text-muted">
          <p>
            The catalog holds {EXOPLANETS.length} confirmed exoplanets with published parameters
            (mass, radius, period, insolation, stellar class, J2000 coordinates) curated from the{" "}
            <a
              className="text-bio underline decoration-bio/40 hover:decoration-bio"
              href="https://exoplanetarchive.ipac.caltech.edu/"
              target="_blank"
              rel="noreferrer"
            >
              NASA Exoplanet Archive
            </a>
            . Values are rounded for legibility and seeded offline so the demo and the test suite
            never depend on the network. <code className="font-mono text-cyan">services/agents/data/fetch_catalog.py</code>{" "}
            re-fetches the full archive.
          </p>
          <p className="text-amber">
            This is an educational simulation. It models copy-number saturation and logistic
            population dynamics, not biochemistry. No sequence here is an instruction, and the
            biosecurity engine exists precisely to keep the dangerous ones out of reach.
          </p>
        </Card>
      </Section>
    </div>
  );
}
