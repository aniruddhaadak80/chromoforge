import { describe, expect, it } from "vitest";
import { AXIS_LABELS, buildLineage } from "../src/genetics/lineage.js";
import type { Genome } from "../src/genetics/index.js";

function strain(id: string, createdAt: number, slots: { partId: string; copies: number }[], name = id): {
  id: string;
  genome: Genome;
  createdAt: number;
} {
  return {
    id,
    createdAt,
    genome: { id, name, chassis: "synthetic minimal cell", slots },
  };
}

describe("lineage", () => {
  it("returns an empty tree for an empty bench", () => {
    expect(buildLineage([])).toEqual([]);
  });

  it("treats the earliest strain as the root with no innovations", () => {
    const tree = buildLineage([
      strain("a", 1000, [{ partId: "pT7", copies: 1 }, { partId: "orfHsp", copies: 1 }]),
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0]?.depth).toBe(0);
    expect(tree[0]?.innovations).toEqual([]);
    expect(tree[0]?.partCount).toBe(2);
    expect(tree[0]?.upkeep).toBeGreaterThan(0);
  });

  it("reports trait drift against the parent", () => {
    const tree = buildLineage([
      strain("parent", 1000, [{ partId: "pT7", copies: 1 }, { partId: "orfHsp", copies: 1 }]),
      strain("child", 2000, [
        { partId: "pT7", copies: 1 },
        { partId: "orfHsp", copies: 1 },
        { partId: "orfSod", copies: 2 },
      ]),
    ]);
    expect(tree).toHaveLength(2);
    expect(tree[1]?.depth).toBe(1);
    // adding superoxide dismutase moves the radiation axis
    expect(tree[1]?.innovations.join(" ")).toMatch(/radiation/);
  });

  it("sorts unsorted input into chronological order", () => {
    const tree = buildLineage([
      strain("late", 3000, [{ partId: "pT7", copies: 1 }]),
      strain("early", 1000, [{ partId: "pT7", copies: 1 }]),
      strain("mid", 2000, [{ partId: "pT7", copies: 1 }]),
    ]);
    expect(tree.map((n) => n.id)).toEqual(["early", "mid", "late"]);
    expect(tree.map((n) => n.depth)).toEqual([0, 1, 2]);
  });

  it("reports no drift for an identical child", () => {
    const slots = [{ partId: "pLac", copies: 1 }, { partId: "orfHsp", copies: 1 }];
    const tree = buildLineage([strain("a", 1000, slots), strain("b", 2000, slots)]);
    expect(tree[1]?.innovations).toEqual([]);
  });

  it("labels every axis", () => {
    for (const label of Object.values(AXIS_LABELS)) {
      expect(label.length).toBeGreaterThan(0);
    }
  });
});
