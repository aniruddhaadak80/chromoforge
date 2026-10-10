/**
 * Biosecurity policy engine.
 *
 * Design toys get a bad name when they hand out recipes. Chromoforge ships a
 * real rule engine that evaluates every genome against a published policy:
 * some constructs are blocked outright, some require an explicit ethics-review
 * sign-off, and every verdict is written to an auditable ledger.
 *
 * The policy is intentionally visible and editable — safety through
 * transparency, not obscurity.
 */

import type { Genome } from "./genome";

export type Verdict = "allow" | "review" | "block";

export interface PolicyRule {
  id: string;
  /** what the rule watches */
  title: string;
  severity: Exclude<Verdict, "allow">;
  /** predicate over the genome */
  test: (genome: Genome) => boolean;
  /** why this rule exists, shown to the user */
  rationale: string;
  /** mitigation the user can apply to clear a review */
  remediation?: string;
}

export interface Finding {
  ruleId: string;
  title: string;
  severity: Exclude<Verdict, "allow">;
  rationale: string;
  remediation?: string;
}

export interface BiosafetyReport {
  verdict: Verdict;
  findings: Finding[];
  /** 0..1 aggregate risk index for dashboards */
  riskIndex: number;
}

export const BIOSAFETY_POLICY: readonly PolicyRule[] = [
  {
    id: "BS-01",
    title: "Toxin + transmission chassis",
    severity: "block",
    rationale:
      "Combining a toxin cassette with an adhesion/biofilm operon produces an aerosol-competent toxic organism. This combination is never constructible."
    ,
    test: (g) => has(g, "orfCry") && has(g, "orfAero"),
  },
  {
    id: "BS-02",
    title: "Antibiotic resistance outside lab chassis",
    severity: "review",
    rationale:
      "Resistance markers are standard lab practice but must not leave containment. Review required unless the chassis is explicitly a lab strain.",
    remediation: "Switch chassis to 'E. coli K-12 lab strain' or swap the marker for auxotrophic selection.",
    test: (g) => has(g, "orfBla") && !g.chassis.toLowerCase().includes("lab"),
  },
  {
    id: "BS-03",
    title: "Nitrogen fixation + sporulation",
    severity: "review",
    rationale:
      "A dormant, self-feeding organism can seed itself across sterile environments. Ecological review required before release.",
    remediation: "Drop the spo0A phosphorelay or add an inducible kill-switch cassette.",
    test: (g) => has(g, "orfNifH") && has(g, "orfSpo0A"),
  },
  {
    id: "BS-04",
    title: "Unregulated high-impact stress stack",
    severity: "review",
    rationale:
      "Stacking DNA-repair and radiation-suppression genes past policy thresholds creates an organism calibrated for post-nuclear niches.",
    remediation: "Reduce Dsup copies to 1 or switch expression to the heat-shock promoter.",
    test: (g) => copies(g, "orfDsup") + copies(g, "orfRecA") >= 4,
  },
  {
    id: "BS-05",
    title: "Photosynthesis disclosure",
    severity: "review",
    rationale:
      "Photosynthetic organisms release O₂ as a metabolic byproduct — a planetary-scale terraforming side effect that must be logged, not blocked.",
    remediation: "Log the release in the biosafety ledger; O₂ flux is shown on the mission page.",
    test: (g) => has(g, "orfPsbA") || has(g, "orfRuBisCO"),
  },
  {
    id: "BS-06",
    title: "Regulated part without promoter",
    severity: "review",
    rationale:
      "A regulated part (toxin, resistance, adhesion) with no promoter cannot express — but its presence in the sequence table still requires register entry.",
    remediation: "Add a promoter to the cassette or remove the regulated part.",
    test: (g) => g.slots.some((s) => isRegulated(s.partId)) && !g.slots.some((s) => s.partId.startsWith("p")),
  },
];

function has(genome: Genome, partId: string): boolean {
  return genome.slots.some((s) => s.partId === partId);
}

function copies(genome: Genome, partId: string): number {
  return genome.slots.filter((s) => s.partId === partId).reduce((n, s) => n + s.copies, 0);
}

function isRegulated(partId: string): boolean {
  // import-free check keeps this module dependency-light for the ledger service
  return ["orfCry", "orfBla", "orfAero", "orfDsup"].includes(partId);
}

/** Evaluate a genome against the published policy. Pure and deterministic. */
export function evaluateBiosafety(genome: Genome, policy = BIOSAFETY_POLICY): BiosafetyReport {
  const findings: Finding[] = [];
  for (const rule of policy) {
    if (rule.test(genome)) {
      findings.push({
        ruleId: rule.id,
        title: rule.title,
        severity: rule.severity,
        rationale: rule.rationale,
        ...(rule.remediation ? { remediation: rule.remediation } : {}),
      });
    }
  }
  const blocking = findings.filter((f) => f.severity === "block").length;
  const reviews = findings.filter((f) => f.severity === "review").length;
  const verdict: Verdict = blocking > 0 ? "block" : reviews > 0 ? "review" : "allow";
  const riskIndex = Math.min(1, blocking * 0.5 + reviews * 0.18);
  return { verdict, findings, riskIndex };
}
