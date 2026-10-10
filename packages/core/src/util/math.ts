export { createRng, hashSeed, mulberry32 } from "./rng";
export type { Rng } from "./rng";

/** Clamp helper used across the domain to keep traits in [min, max]. */
export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

/** Weighted linear blend with saturation (diminishing returns for stacked effects). */
export function saturatingSum(effects: readonly number[], absorption = 0.6): number {
  let acc = 0;
  let absorbed = 0;
  for (const e of effects) {
    const remaining = 1 - absorbed;
    acc += e * remaining;
    absorbed = Math.min(1, absorbed + Math.abs(e) * absorption);
  }
  return clamp(acc);
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/** Inverse-gaussian-shaped "how far is x from ideal", returns 0 (perfect) .. 1 (terrible). */
export function mismatch(x: number, ideal: number, tolerance: number): number {
  if (tolerance <= 0) return x === ideal ? 0 : 1;
  return clamp(Math.abs(x - ideal) / tolerance);
}

/** Format seconds as a mission clock string HH:MM:SS. */
export function missionClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
