/**
 * Deterministic, seedable PRNG utilities.
 *
 * Everything user-visible in chromoforge that looks random — mutations, agent
 * phrasing, star placement jitter — must be reproducible from a seed. Public
 * repos get audited, and "the same seed produces the same universe" is both a
 * testing contract and a demo feature.
 */

/** mulberry32: small, fast, statistically decent for simulation work. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a: turn a string seed into a 32-bit integer. */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface Rng {
  /** float in [0, 1) */
  next(): number;
  /** float in [min, max) */
  range(min: number, max: number): number;
  /** integer in [min, max] inclusive */
  int(min: number, max: number): number;
  /** approximately normal, mean 0 stddev 1 (sum of 3 uniforms) */
  gauss(): number;
  /** pick one element */
  pick<T>(items: readonly T[]): T;
  /** true with probability p */
  chance(p: number): boolean;
}

export function createRng(seed: number | string): Rng {
  const next = mulberry32(typeof seed === "string" ? hashSeed(seed) : seed);
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    gauss: () => (next() + next() + next() - 1.5) * 1.1547,
    pick: (items) => {
      if (items.length === 0) throw new Error("createRng: pick from empty list");
      return items[Math.floor(next() * items.length)] as (typeof items)[number];
    },
    chance: (p) => next() < p,
  };
}
