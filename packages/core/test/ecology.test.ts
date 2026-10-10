import { describe, expect, it } from "vitest";
import { EXOPLANETS, getExoplanet, hammerProject, hammerUnproject, skyGrid, HAMMER_BOUNDS } from "../src/exoplanets/index.js";
import { deriveEnvironment, deriveGravity, idealTraits, fitTrait } from "../src/ecology/environment.js";
import { simulate, fitnessOf } from "../src/ecology/simulate.js";
import { deriveTraits } from "../src/genetics/index.js";
import type { Genome } from "../src/genetics/index.js";

describe("exoplanet catalog", () => {
  it("has a healthy seeded catalog with unique ids", () => {
    expect(EXOPLANETS.length).toBeGreaterThanOrEqual(20);
    const ids = EXOPLANETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("holds published parameters for landmark worlds", () => {
    const tr = getExoplanet("trappist-1e");
    expect(tr.radiusEarth).toBeCloseTo(0.92, 1);
    expect(tr.starTempK).toBeGreaterThan(2500);
    const prox = getExoplanet("proxima-b");
    expect(prox.distanceLy).toBeLessThan(5);
    expect(prox.insolation).toBeGreaterThan(0.4);
  });

  it("has physically sane coordinates", () => {
    for (const p of EXOPLANETS) {
      expect(p.ra).toBeGreaterThanOrEqual(0);
      expect(p.ra).toBeLessThan(360);
      expect(p.dec).toBeGreaterThanOrEqual(-90);
      expect(p.dec).toBeLessThanOrEqual(90);
      expect(p.massEarth).toBeGreaterThan(0);
    }
  });

  it("throws for unknown planets", () => {
    expect(() => getExoplanet("not-a-world")).toThrow(/Unknown exoplanet/);
  });
});

describe("hammer projection", () => {
  it("round-trips coordinates within a degree", () => {
    const samples: [number, number][] = [
      [0, 0],
      [346.62, -5.04],
      [217.39, -62.68],
      [97.13, -65.58],
      [284.51, 44.28],
      [180, 45],
      [12, -33],
    ];
    for (const [ra, dec] of samples) {
      const { x, y } = hammerProject(ra, dec);
      expect(x).toBeGreaterThanOrEqual(-HAMMER_BOUNDS.xMax - 0.001);
      expect(x).toBeLessThanOrEqual(HAMMER_BOUNDS.xMax + 0.001);
      expect(Math.abs(y)).toBeLessThanOrEqual(HAMMER_BOUNDS.yMax + 0.001);
      const back = hammerUnproject(x, y);
      expect(Math.abs(back.ra - ra)).toBeLessThan(1);
      expect(Math.abs(back.dec - dec)).toBeLessThan(1);
    }
  });

  it("maps the celestial equator and poles correctly", () => {
    const center = hammerProject(0, 0);
    expect(center.x).toBeCloseTo(0, 6);
    expect(center.y).toBeCloseTo(0, 6);
    const north = hammerProject(123, 90);
    expect(north.y).toBeCloseTo(1, 6);
  });

  it("builds sky gridlines", () => {
    const grid = skyGrid();
    expect(grid.meridians.length).toBe(12);
    expect(grid.parallels.length).toBe(5);
  });
});

describe("environment derivation", () => {
  it("scales equilibrium temperature with insolation", () => {
    const hot = deriveEnvironment(getExoplanet("55-cnc-e"));
    const cold = deriveEnvironment(getExoplanet("trappist-1g"));
    const temp = deriveEnvironment(getExoplanet("trappist-1e"));
    expect(hot.tempK).toBeGreaterThan(temp.tempK);
    expect(cold.tempK).toBeLessThan(temp.tempK);
  });

  it("computes gravity in Earth units", () => {
    expect(deriveGravity(getExoplanet("proxima-b"))).toBeCloseTo(1.07 / (0.94 * 0.94), 2);
  });

  it("labels fiery worlds sterilizing and temperate worlds temperate", () => {
    expect(deriveEnvironment(getExoplanet("wasp-12b")).regime).toBe("sterilizing");
    expect(deriveEnvironment(getExoplanet("trappist-1e")).regime).toBe("temperate");
  });

  it("fitTrait peaks when trait matches demand", () => {
    expect(fitTrait(0.5, 0.5, 0.4)).toBeCloseTo(1, 5);
    expect(fitTrait(0.0, 0.5, 0.4)).toBeLessThan(0.5);
  });

  it("idealTraits demands heat resistance on hot worlds", () => {
    const env = deriveEnvironment(getExoplanet("55-cnc-e"));
    expect(idealTraits(env).thermotolerance).toBeGreaterThan(0.8);
    expect(idealTraits(env).photosyntheticEfficiency).toBeLessThan(0.2);
  });
});

const hardy: Genome = {
  id: "g-hardy",
  name: "Extremophile Prototype",
  chassis: "synthetic minimal cell",
  slots: [
    { partId: "pHeat", copies: 1 },
    { partId: "orfHsp", copies: 3 },
    { partId: "orfDsup", copies: 2 },
    { partId: "orfPsbA", copies: 2 },
    { partId: "tT7", copies: 1 },
  ],
};

describe("simulation", () => {
  it("is deterministic for a seed", () => {
    const cfg = { generations: 50, founders: 100, mutationStdDev: 0.4, seed: 7331 };
    const a = simulate(hardy, "trappist-1e", cfg);
    const b = simulate(hardy, "trappist-1e", cfg);
    expect(a).toEqual(b);
    expect(a.history.length).toBe(51);
  });

  it("different seeds produce different mutation histories", () => {
    const a = simulate(hardy, "kepler-442b", { generations: 30, founders: 50, mutationStdDev: 0.9, seed: 1 });
    const b = simulate(hardy, "kepler-442b", { generations: 30, founders: 50, mutationStdDev: 0.9, seed: 2 });
    expect(a.finalTraits).not.toEqual(b.finalTraits);
  });

  it("a stress-hardened organism survives a temperate world, a naked one dies on a lava world", () => {
    const naked: Genome = { id: "g-naked", name: "Naked", chassis: "lab strain", slots: [] };
    const temper = simulate(hardy, "trappist-1e", { generations: 40, founders: 100, mutationStdDev: 0.3, seed: 5 });
    expect(temper.outcome).not.toBe("extinct");
    const lava = simulate(naked, "55-cnc-e", { generations: 40, founders: 20, mutationStdDev: 0.05, seed: 5 });
    expect(lava.outcome).toBe("extinct");
    expect(lava.extinctAt).not.toBeNull();
  });

  it("fitnessOf is bounded and environment-aware", () => {
    const traits = deriveTraits(hardy);
    const env = deriveEnvironment(getExoplanet("trappist-1e"));
    const f = fitnessOf(traits, env);
    expect(f).toBeGreaterThan(0.4);
    expect(f).toBeLessThanOrEqual(1);
  });

  it("tracks a peak population above founders when thriving", () => {
    const r = simulate(hardy, "teegarden-b", { generations: 60, founders: 50, mutationStdDev: 0.2, seed: 11 });
    expect(r.peakPopulation).toBeGreaterThanOrEqual(50);
  });
});
