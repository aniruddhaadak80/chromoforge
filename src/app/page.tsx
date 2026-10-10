import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, Orbit, ShieldCheck, Sparkles, Dna, LineChart } from "lucide-react";
import { ButtonLink, Card, Section } from "@/components/ui";
import { EXOPLANETS, deriveEnvironment } from "@repo/core";

export const metadata: Metadata = {
  title: "chromoforge — design life for worlds we know exist",
  description:
    "A synthetic-biology foundry: compose genomes, design CRISPR guides behind a biosecurity gate, and release organisms into real exoplanet environments.",
};

const FEATURED = ["trappist-1e", "proxima-b", "toi-700d", "kepler-442b"];

export default function LandingPage() {
  const featured = FEATURED.map((id) => {
    const planet = EXOPLANETS.find((p) => p.id === id);
    if (!planet) return null;
    return { planet, env: deriveEnvironment(planet) };
  }).filter((x): x is { planet: (typeof EXOPLANETS)[number]; env: ReturnType<typeof deriveEnvironment> } => x !== null);

  return (
    <div data-testid="landing-hero">
      {/* Hero */}
      <div className="grid gap-10 pt-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-bio/30 bg-bio/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-bio">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden />
            open source · synthetic biology lab
          </p>
          <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Design life for
            <br />
            <span className="text-bio">worlds we know exist.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            chromoforge is a foundry for xenobiology: compose a genome from real gene parts, screen
            every design through a published biosafety policy, then release it into a real exoplanet
            from NASA&apos;s archive and watch the generations decide whether it survives.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/dashboard">Open the foundry</ButtonLink>
            <ButtonLink href="/about" variant="ghost">
              Read the science
            </ButtonLink>
          </div>
          <p className="mt-6 font-mono text-xs uppercase tracking-widest text-muted">
            Next.js 16 · React 19 · TypeScript strict · real NASA data · zero API keys
          </p>
        </div>
        <Card className="relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-bio/10 blur-3xl" aria-hidden />
          <p className="font-mono text-xs uppercase tracking-widest text-muted">featured worlds</p>
          <ul className="mt-4 space-y-3">
            {featured.map(({ planet, env }) => (
              <li
                key={planet.id}
                data-testid="featured-worlds"
                className="flex items-center justify-between gap-4 rounded-panel border border-hull bg-surface-2/60 p-3"
              >
                <div>
                  <p className="font-display font-bold">{planet.name}</p>
                  <p className="font-mono text-xs text-muted">{planet.hostStar} · {planet.distanceLy} ly</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <p className="text-cyan">{env.tempK} K</p>
                  <p className="text-muted">water {Math.round(env.water * 100)}%</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Capabilities */}
      <Section kicker="workbench" title="Everything a foundry needs">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="capability-grid">
          {[
            { href: "/composer", icon: Dna, title: "Genome Composer", copy: "Drag-together cassettes with live trait derivation and saturation math." },
            { href: "/crispr", icon: Sparkles, title: "Guide Bench", copy: "Real SpCas9 guide scoring and off-target scans over the assembled sequence." },
            { href: "/release", icon: Orbit, title: "Release Bay", copy: "A crew of local agents briefs you before any organism leaves containment." },
            { href: "/theater", icon: LineChart, title: "Sim Theater", copy: "Generation-by-generation population and fitness charts from a seeded RNG." },
            { href: "/safety", icon: ShieldCheck, title: "Safety Ledger", copy: "A published rule engine that blocks the bad ideas — on purpose." },
            { href: "/atlas", icon: Orbit, title: "Sky Atlas", copy: "Every world on a Hammer equal-area map at its J2000 coordinates." },
            { href: "/vault", icon: FlaskConical, title: "Exoplanet Vault", copy: "The seeded catalog: temperature, gravity, radiation, water for each world." },
            { href: "/crew", icon: FlaskConical, title: "Crew Room", copy: "Watch the Navigator, Xenobiologist and Ethicist argue about your design." },
          ].map(({ href, icon: Icon, title, copy }) => (
            <Link key={href} href={href}>
              <Card className="h-full hover:border-bio/40">
                <Icon className="h-6 w-6 text-bio" aria-hidden />
                <h3 className="mt-3 font-display font-bold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{copy}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      {/* Science strip */}
      <Section kicker="how it works" title="Compose → screen → release">
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            { n: "01", t: "Compose", d: "Pick promoters, ORFs and terminators. Traits derive from part effects with diminishing returns — biology, not addition." },
            { n: "02", t: "Screen", d: "Every genome passes the biosecurity policy engine. Some combinations are blocked. That constraint is the feature." },
            { n: "03", t: "Release", d: "Drop the organism on a real world. Equilibrium temperature, gravity and radiation decide the rest, one generation at a time." },
          ].map((s) => (
            <li key={s.n}>
              <Card className="h-full">
                <p className="font-mono text-3xl text-bio/60">{s.n}</p>
                <h3 className="mt-2 font-display text-xl font-bold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted">{s.d}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
