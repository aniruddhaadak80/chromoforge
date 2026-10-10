import { describe, expect, it } from "vitest";
import { briefCrew, createCrew } from "../src/agents/index.js";
import { evaluateBiosafety } from "../src/genetics/index.js";
import type { Genome } from "../src/genetics/index.js";

const genome: Genome = {
  id: "g-1",
  name: "Prototype",
  chassis: "synthetic minimal cell",
  slots: [
    { partId: "pHeat", copies: 1 },
    { partId: "orfHsp", copies: 2 },
    { partId: "orfDsup", copies: 1 },
    { partId: "orfAero", copies: 1 },
    { partId: "tT7", copies: 1 },
  ],
};

describe("crew", () => {
  it("builds three deterministic agents", () => {
    const crew = createCrew("mission-1");
    expect(crew.map((a) => a.role)).toEqual(["navigator", "xenobiologist", "ethicist"]);
    const again = createCrew("mission-1");
    expect(again).toEqual(crew);
    expect(crew[0]?.stubbornness).toBeGreaterThan(0);
    expect(crew[0]?.stubbornness).toBeLessThan(1);
  });

  it("blocks transit when biosafety says block", () => {
    const blockedGenome: Genome = {
      id: "g-bad",
      name: "Bad",
      chassis: "field chassis",
      slots: [{ partId: "pT7", copies: 1 }, { partId: "orfCry", copies: 1 }, { partId: "orfAero", copies: 1 }],
    };
    const report = evaluateBiosafety(blockedGenome);
    expect(report.verdict).toBe("block");
    const brief = briefCrew({
      seed: "m1",
      action: "release",
      organism: blockedGenome.name,
      world: "TRAPPIST-1 e",
      fitness: 0.9,
      biosafety: report.verdict,
      complexity: blockedGenome.slots.length,
    });
    expect(brief.recommendation).toBe("hold");
    expect(brief.conditions.length).toBeGreaterThan(0);
    expect(brief.steps.some((s) => s.state === "dissenting")).toBe(true);
  });

  it("proceeds with conditions when review is needed", () => {
    const report = evaluateBiosafety(genome);
    const brief = briefCrew({
      seed: "m2",
      action: "release",
      organism: genome.name,
      world: "Kepler-442 b",
      fitness: 0.3,
      biosafety: report.verdict,
      complexity: genome.slots.length + 10,
    });
    expect(brief.recommendation).toBe("proceed-with-conditions");
    expect(brief.positions).toHaveLength(3);
  });

  it("briefings are deterministic per seed", () => {
    const ctx = {
      seed: "m3",
      action: "release",
      organism: "X",
      world: "TOI-700 d",
      fitness: 0.6,
      biosafety: "allow",
      complexity: 4,
    };
    expect(briefCrew(ctx)).toEqual(briefCrew(ctx));
  });
});
