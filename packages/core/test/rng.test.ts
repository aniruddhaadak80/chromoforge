import { describe, expect, it } from "vitest";
import { createRng, hashSeed, mulberry32 } from "../src/util/rng.js";
import { clamp, mismatch, saturatingSum } from "../src/util/math.js";

describe("rng", () => {
  it("is deterministic for a given seed", () => {
    const a = createRng("chromoforge");
    const b = createRng("chromoforge");
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("produces different streams for different seeds", () => {
    const a = createRng("alpha");
    const b = createRng("beta");
    expect(a.next()).not.toBe(b.next());
  });

  it("stays in [0,1) and ranges stay in bounds", () => {
    const rng = createRng(42);
    for (let i = 0; i < 500; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      const r = rng.range(-2, 3);
      expect(r).toBeGreaterThanOrEqual(-2);
      expect(r).toBeLessThan(3);
      const n = rng.int(1, 6);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(6);
    }
  });

  it("hashSeed is stable and yields uint32", () => {
    expect(hashSeed("abc")).toBe(hashSeed("abc"));
    expect(hashSeed("abc")).not.toBe(hashSeed("abd"));
    expect(hashSeed("x")).toBeLessThan(2 ** 32);
  });

  it("mulberry32 raw matches", () => {
    expect(mulberry32(7)()).toBe(mulberry32(7)());
  });
});

describe("math", () => {
  it("clamps", () => {
    expect(clamp(-1)).toBe(0);
    expect(clamp(2)).toBe(1);
    expect(clamp(5, 1, 10)).toBe(5);
  });

  it("mismatch is 0 at ideal and 1 far beyond tolerance", () => {
    expect(mismatch(0.5, 0.5, 0.5)).toBe(0);
    expect(mismatch(1.0, 0.5, 0.5)).toBe(1);
    expect(mismatch(0.75, 0.5, 0.5)).toBeCloseTo(0.5, 5);
  });

  it("saturatingSum has diminishing returns", () => {
    const single = saturatingSum([0.3]);
    const double = saturatingSum([0.3, 0.3]);
    const triple = saturatingSum([0.3, 0.3, 0.3]);
    expect(single).toBeCloseTo(0.3, 5);
    expect(double).toBeGreaterThan(single);
    expect(triple).toBeGreaterThan(double);
    expect(triple).toBeLessThan(0.9); // saturation forbids going to 3×0.3
  });
});
