"""Deterministic agent crew — Python mirror of packages/core/src/agents/crew.ts.

Three specialists that reason about a release the way a lab team would, and
disagree on purpose. No API keys, no network: finite-state templates with
seeded phrasing and rubric-driven stances.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class TraceStep:
    agent_id: str
    state: str
    text: str
    elapsed_ms: int


@dataclass(frozen=True)
class BriefingContext:
    seed: str
    action: str
    organism: str
    world: str
    fitness: float
    biosafety: str
    complexity: int


@dataclass
class CrewBriefing:
    seed: str
    steps: list[TraceStep]
    recommendation: str
    conditions: list[str] = field(default_factory=list)
    positions: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "seed": self.seed,
            "steps": [step.__dict__ for step in self.steps],
            "recommendation": self.recommendation,
            "conditions": list(self.conditions),
            "positions": list(self.positions),
        }


AGENTS = {
    "navigator": {"id": "navigator-1", "name": "NAVA", "title": "Mission Navigator"},
    "xenobiologist": {
        "id": "xenobiologist-1",
        "name": "XYLO",
        "title": "Xenobiologist",
    },
    "ethicist": {"id": "ethicist-1", "name": "ETHOS", "title": "Biosafety Officer"},
}


def _lcg(seed_text: str) -> int:
    h = 0x811C9DC5
    for ch in seed_text:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def brief_crew(ctx: BriefingContext) -> CrewBriefing:
    state = _lcg(f"{ctx.seed}:brief")
    steps: list[TraceStep] = []

    # deterministic "elapsed" values derived from the seed hash
    nav_ms = 120 + state % 281
    state = (state * 1103515245 + 12345) & 0x7FFFFFFF
    xylo_ms = 200 + state % 301
    state = (state * 1103515245 + 12345) & 0x7FFFFFFF
    ethos_ms = 300 + state % 351
    state = (state * 1103515245 + 12345) & 0x7FFFFFFF
    sols = 2 + state % 8

    steps.append(
        TraceStep(
            "navigator-1",
            "thinking",
            f"Plotting transit window for {ctx.world}. Delta-v budget adequate. {ctx.action} window opens in {sols} sols.",
            nav_ms,
        )
    )
    steps.append(
        TraceStep(
            "xenobiologist-1",
            "thinking",
            f"Reading {ctx.organism}: {ctx.complexity} editing events on record. Modeled fitness {round(ctx.fitness * 100):.0f}% on {ctx.world}.",
            xylo_ms,
        )
    )

    blocked = ctx.biosafety == "block"
    needs_review = ctx.biosafety == "review"
    steps.append(
        TraceStep(
            "ethicist-1",
            "dissenting" if (needs_review or blocked) else "reporting",
            (
                "Stop. This construct trips a hard rule in the biosafety policy. No transit until redesign."
                if blocked
                else "Flagging for review: policy conditions apply. I want containment before transit and a post-release census."
                if needs_review
                else "Policy check clean. I'll still log the release — every organism leaves a paper trail."
            ),
            ethos_ms,
        )
    )

    quotes = [
        {
            "role": "navigator",
            "quote": f"The window is open and the sky is ready. {ctx.world} won't visit itself.",
        },
        {
            "role": "xenobiologist",
            "quote": (
                f"This one breathes {ctx.world}'s air like it was born there. Release it."
                if ctx.fitness > 0.55
                else "Honestly? It's marginal. I'd fold in two more stress cassettes first."
            ),
        },
        {
            "role": "ethicist",
            "quote": (
                "Absolutely not. We don't open apertures on blocked constructs."
                if blocked
                else "With conditions — containment, census, and an off-switch that actually works."
                if needs_review
                else "Cleared. But I'm writing it down either way."
            ),
        },
    ]
    for quote in quotes:
        agent = AGENTS[quote["role"]]
        steps.append(
            TraceStep(
                agent["id"],
                "reporting",
                quote["quote"],
                700 + (len(quote["quote"]) % 400),
            )
        )

    conditions: list[str] = []
    if blocked:
        conditions.append("Redesign to clear every blocked policy rule")
        conditions.append("Re-run the safety evaluation before any transit")
    else:
        if needs_review:
            conditions.append("Ethics-review sign-off recorded in the biosafety ledger")
            conditions.append("Containment protocol armed at the landing site")
        if ctx.fitness < 0.45:
            conditions.append("Second founding population to hedge early extinction")
        if ctx.complexity > 12:
            conditions.append(
                "Simplify the design — marginal fitness comes from overloaded genomes"
            )

    recommendation = (
        "hold" if blocked else ("proceed-with-conditions" if conditions else "proceed")
    )
    return CrewBriefing(ctx.seed, steps, recommendation, conditions, quotes)
