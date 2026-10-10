/**
 * The agent crew.
 *
 * Three deterministic specialists that reason about a design the way a lab
 * team would — and, crucially, disagree. No API keys, no network: each agent
 * is a finite-state machine with a rubric, seeded phrasing, and a stance.
 * The Ethicist's veto is a real constraint the UI honours, which is what
 * makes the crew feel like colleagues instead of autocomplete.
 */

import { createRng } from "../util/rng";

export type CrewRole = "navigator" | "xenobiologist" | "ethicist";

export interface CrewAgent {
  id: string;
  role: CrewRole;
  name: string;
  title: string;
  /** 0..1 — how strongly this agent pushes its agenda */
  stubbornness: number;
  /** 0..1 — how much it trusts the safety officer */
  deference: number;
}

export type AgentState = "idle" | "thinking" | "reporting" | "dissenting";

export interface TraceStep {
  agentId: string;
  state: AgentState;
  text: string;
  /** ms into the briefing */
  elapsedMs: number;
}

export interface CrewBriefing {
  seed: string;
  steps: TraceStep[];
  /** the crew's merged recommendation */
  recommendation: "proceed" | "proceed-with-conditions" | "hold";
  conditions: string[];
  /** headline each agent would give */
  positions: { role: CrewRole; quote: string }[];
}

const AGENT_DEFS: { role: CrewRole; name: string; title: string }[] = [
  { role: "navigator", name: "NAVA", title: "Mission Navigator" },
  { role: "xenobiologist", name: "XYLO", title: "Xenobiologist" },
  { role: "ethicist", name: "ETHOS", title: "Biosafety Officer" },
];

export function createCrew(seed: string): CrewAgent[] {
  const rng = createRng(seed);
  return AGENT_DEFS.map(({ role, name, title }) => ({
    id: `${role}-1`,
    role,
    name,
    title,
    stubbornness: Number(rng.range(0.3, 0.9).toFixed(2)),
    deference: Number(rng.range(0.4, 0.95).toFixed(2)),
  }));
}

export interface BriefingContext {
  seed: string;
  /** what the operator is about to do */
  action: string;
  /** organism name */
  organism: string;
  /** target planet name */
  world: string;
  /** predicted fitness 0..1 from the simulation */
  fitness: number;
  /** biosafety verdict: allow | review | block */
  biosafety: string;
  /** mutations, parts count — anything that moves a rubric */
  complexity: number;
}

export function briefCrew(context: BriefingContext, crew = createCrew(context.seed)): CrewBriefing {
  const rng = createRng(`${context.seed}:brief`);
  const steps: TraceStep[] = [];
  const conditions: string[] = [];

  const nav = crew.find((a) => a.role === "navigator") as CrewAgent;
  const xylo = crew.find((a) => a.role === "xenobiologist") as CrewAgent;
  const ethos = crew.find((a) => a.role === "ethicist") as CrewAgent;

  steps.push({
    agentId: nav.id,
    state: "thinking",
    text: `Plotting transit window for ${context.world}. Delta-v budget adequate. ${context.action} window opens in ${rng.int(2, 9)} sols.`,
    elapsedMs: rng.int(120, 400),
  });

  steps.push({
    agentId: xylo.id,
    state: "thinking",
    text: `Reading ${context.organism}: ${context.complexity} editing events on record. Modeled fitness ${(context.fitness * 100).toFixed(0)}% on ${context.world}.`,
    elapsedMs: rng.int(200, 500),
  });

  const blocked = context.biosafety === "block";
  const needsReview = context.biosafety === "review";
  steps.push({
    agentId: ethos.id,
    state: needsReview || blocked ? "dissenting" : "reporting",
    text: blocked
      ? `Stop. This construct trips a hard rule in the biosafety policy. No transit until redesign.`
      : needsReview
        ? `Flagging for review: policy conditions apply. I want containment before transit and a post-release census.`
        : `Policy check clean. I'll still log the release — every organism leaves a paper trail.`,
    elapsedMs: rng.int(300, 650),
  });

  const quotes: { role: CrewRole; quote: string }[] = [
    { role: "navigator", quote: `The window is open and the sky is ready. ${context.world} won't visit itself.` },
    {
      role: "xenobiologist",
      quote:
        context.fitness > 0.55
          ? `This one breathes ${context.world}'s air like it was born there. Release it.`
          : `Honestly? It's marginal. I'd fold in two more stress cassettes first.`,
    },
    {
      role: "ethicist",
      quote: blocked
        ? `Absolutely not. We don't open apertures on blocked constructs.`
        : needsReview
          ? `With conditions — containment, census, and an off-switch that actually works.`
          : `Cleared. But I'm writing it down either way.`,
    },
  ];
  for (const q of quotes) {
    const agent = crew.find((a) => a.role === q.role) as CrewAgent;
    steps.push({ agentId: agent.id, state: "reporting", text: q.quote, elapsedMs: rng.int(700, 1100) });
  }

  if (blocked) {
    conditions.push("Redesign to clear every blocked policy rule");
    conditions.push("Re-run the safety evaluation before any transit");
  } else {
    if (needsReview) {
      conditions.push("Ethics-review sign-off recorded in the biosafety ledger");
      conditions.push("Containment protocol armed at the landing site");
    }
    if (context.fitness < 0.45) {
      conditions.push("Second founding population to hedge early extinction");
    }
    if (context.complexity > 12) {
      conditions.push("Simplify the design — marginal fitness comes from overloaded genomes");
    }
  }

  return {
    seed: context.seed,
    steps,
    recommendation: blocked ? "hold" : conditions.length > 0 ? "proceed-with-conditions" : "proceed",
    conditions,
    positions: quotes,
  };
}
