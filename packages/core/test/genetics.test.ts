import { describe, expect, it } from "vitest";
import {
  BIOSAFETY_POLICY,
  deriveTraits,
  evaluateBiosafety,
  genomeSequence,
  upkeep,
  validateGenome,
  getPart,
  countOffTargets,
  designGuides,
  hamming,
  TRAIT_AXES,
} from "../src/genetics/index.js";
import type { Genome } from "../src/genetics/index.js";

const labGenome: Genome = {
  id: "g-lab",
  name: "Lab Reference Strain",
  chassis: "E. coli K-12 lab strain",
  slots: [
    { partId: "pLac", copies: 1 },
    { partId: "orfHsp", copies: 2 },
    { partId: "orfCarotenoid", copies: 1 },
    { partId: "tT1", copies: 1 },
  ],
};

describe("deriveTraits", () => {
  it("produces every axis", () => {
    const traits = deriveTraits(labGenome);
    for (const axis of TRAIT_AXES) {
      expect(typeof traits[axis]).toBe("number");
      expect(traits[axis]).toBeGreaterThanOrEqual(0);
      expect(traits[axis]).toBeLessThanOrEqual(1);
    }
  });

  it("heat-shock proteins raise thermotolerance", () => {
    const traits = deriveTraits(labGenome);
    expect(traits.thermotolerance).toBeGreaterThan(0.1);
    const carotenoidOnly = deriveTraits({
      id: "g-c",
      name: "carotenoid",
      chassis: "lab strain",
      slots: [{ partId: "orfCarotenoid", copies: 1 }],
    });
    expect(carotenoidOnly.pigmentation).toBeGreaterThan(0.2);
    expect(carotenoidOnly.thermotolerance).toBeLessThan(traits.thermotolerance);
  });

  it("more copies saturate rather than scale linearly", () => {
    const one = deriveTraits({ id: "a", name: "a", chassis: "s", slots: [{ partId: "orfHsp", copies: 1 }] });
    const three = deriveTraits({ id: "b", name: "b", chassis: "s", slots: [{ partId: "orfHsp", copies: 3 }] });
    expect(three.thermotolerance).toBeGreaterThan(one.thermotolerance);
    expect(three.thermotolerance).toBeLessThan(one.thermotolerance * 3);
  });
});

describe("genome assembly", () => {
  it("concatenates part motifs in slot order", () => {
    const seq = genomeSequence(labGenome);
    expect(seq.startsWith(getPart("pLac").sequence)).toBe(true);
    expect(seq).toContain(getPart("orfHsp").sequence);
    expect(seq.length).toBeGreaterThan(labGenome.slots.length * 20);
  });

  it("sums upkeep", () => {
    expect(upkeep(labGenome)).toBeGreaterThan(0);
    expect(upkeep({ id: "x", name: "x", chassis: "s", slots: [] })).toBe(0);
  });
});

describe("validateGenome", () => {
  it("accepts a sane design", () => {
    const v = validateGenome(labGenome);
    expect(v.ok).toBe(true);
    expect(v.errors).toEqual([]);
  });

  it("rejects copy-count overflow", () => {
    const v = validateGenome({ id: "x", name: "x", chassis: "s", slots: [{ partId: "orfHsp", copies: 9 }] });
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toMatch(/copies exceeds/);
  });

  it("warns when no promoter is present", () => {
    const v = validateGenome({ id: "x", name: "x", chassis: "s", slots: [{ partId: "orfHsp", copies: 1 }] });
    expect(v.warnings.join(" ")).toMatch(/No promoter/);
  });
});

describe("biosecurity policy", () => {
  it("allows the lab strain", () => {
    const report = evaluateBiosafety(labGenome);
    expect(report.verdict).toBe("allow");
    expect(report.findings).toEqual([]);
  });

  it("blocks toxin + transmission chassis (BS-01)", () => {
    const report = evaluateBiosafety({
      id: "evil",
      name: "Bad Idea",
      chassis: "field chassis",
      slots: [
        { partId: "pT7", copies: 1 },
        { partId: "orfCry", copies: 1 },
        { partId: "orfAero", copies: 1 },
      ],
    });
    expect(report.verdict).toBe("block");
    expect(report.findings.map((f) => f.ruleId)).toContain("BS-01");
    expect(report.riskIndex).toBeGreaterThanOrEqual(0.5);
  });

  it("flags resistance outside lab chassis (BS-02)", () => {
    const report = evaluateBiosafety({
      id: "x",
      name: "field strain with marker",
      chassis: "field chassis",
      slots: [{ partId: "pT7", copies: 1 }, { partId: "orfBla", copies: 1 }],
    });
    expect(report.verdict).toBe("review");
    const finding = report.findings.find((f) => f.ruleId === "BS-02");
    expect(finding?.remediation).toMatch(/lab strain/);
  });

  it("every rule has a unique id and a rationale", () => {
    const ids = BIOSAFETY_POLICY.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const rule of BIOSAFETY_POLICY) {
      expect(rule.rationale.length).toBeGreaterThan(20);
    }
  });
});

describe("guide design", () => {
  it("hamming counts positions", () => {
    expect(hamming("ACGT", "ACGT")).toBe(0);
    expect(hamming("ACGT", "TTTT")).toBe(3);
    expect(hamming("ACGT", "CGTA")).toBe(4);
  });

  it("finds near-matches in the assembled genome", () => {
    const seq = genomeSequence(labGenome);
    const guide = seq.slice(10, 30);
    expect(countOffTargets(labGenome, guide, 2)).toBeGreaterThanOrEqual(1);
  });

  it("designs scored guides for a real part", () => {
    const guides = designGuides(labGenome, "orfHsp", 5);
    expect(guides.length).toBeGreaterThan(0);
    for (const g of guides) {
      expect(g.sequence).toMatch(/^[ACGT]{20}$/);
      expect(g.score).toBeGreaterThanOrEqual(0);
      expect(g.score).toBeLessThanOrEqual(1);
    }
    // sorted descending by score
    const scores = guides.map((g) => g.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it("returns nothing for unknown parts", () => {
    expect(designGuides(labGenome, "nope", 3)).toEqual([]);
  });
});
