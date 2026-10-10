/**
 * Environment derivation.
 *
 * Given a real exoplanet's published parameters, derive the environment an
 * organism actually experiences. The physics is deliberately simple and
 * stated: equilibrium temperature from stellar flux, gravity from mass and
 * radius, radiation and water availability from the star type and insolation.
 * Every heuristic is documented so a visitor can argue with it — that's the
 * point of a research workbench.
 */

import { clamp, mismatch } from "../util/math";
import { getExoplanet } from "../exoplanets/index";
import type { Exoplanet, StarType } from "../exoplanets/index";

export interface EnvironmentProfile {
  planetId: string;
  /** equilibrium surface temperature, K */
  tempK: number;
  /** surface gravity, Earth units */
  gravity: number;
  /** stellar radiation dose index, 1 = Earth's sun */
  radiationIndex: number;
  /** subsurface/surface water availability, 0..1 */
  water: number;
  /** atmospheric density proxy, 0..1 */
  atmosphere: number;
  /** dominant biochemistry constraint label */
  regime: string;
}

/** Radiative flux per star class (Sun = 1.0), a coarse flare/UV proxy. */
const RADIATION_BY_STAR: Record<StarType, number> = {
  G: 1.0,
  K: 1.4,
  M: 3.2,
  F: 1.6,
};

/**
 * Equilibrium temperature: T = T_star · sqrt(R_star / 2a) expressed through
 * insolation S relative to Earth via T_eq = 288 · S^0.25 (Earth's balance at
 * 1 S⊕), with a greenhouse uplift when an atmosphere is plausible.
 */
export function deriveTemperature(planet: Exoplanet): number {
  const base = 288 * Math.sqrt(Math.sqrt(Math.max(0.01, planet.insolation)));
  const greenhouse = greenhouseAssumption(planet);
  return Math.round(base + greenhouse);
}

/**
 * Habitable-zone worlds near 1 R⊕ around M/K dwarfs usually keep some
 * atmosphere; this is a deliberately generous but documented guess.
 */
function greenhouseAssumption(planet: Exoplanet): number {
  if (planet.radiusEarth < 1.6 && planet.insolation > 0.15 && planet.insolation < 3) return 22;
  if (planet.radiusEarth < 2.5) return 40;
  return 0;
}

/** g = M/R² in Earth units. */
export function deriveGravity(planet: Exoplanet): number {
  return planet.massEarth / (planet.radiusEarth * planet.radiusEarth);
}

export function deriveEnvironment(planet: Exoplanet): EnvironmentProfile {
  const tempK = deriveTemperature(planet);
  const gravity = deriveGravity(planet);
  const radiationIndex =
    RADIATION_BY_STAR[planet.starType] * Math.max(0.2, Math.sqrt(planet.insolation));
  const water = clamp(
    (planet.insolation < 3 ? 1 - (planet.insolation - 1) * 0.45 : 0) *
      (planet.radiusEarth < 1.8 ? 1 : 0.35) *
      (planet.insolation > 0.2 ? 1 : 0.1),
  );
  const atmosphere = clamp(planet.radiusEarth < 1.2 ? 0.35 : planet.radiusEarth < 2.5 ? 1 : 0.9);
  const regime =
    tempK < 200
      ? "deep-freeze"
      : tempK < 320
        ? "temperate"
        : tempK < 500
          ? "hot"
          : "sterilizing";
  return { planetId: planet.id, tempK, gravity, radiationIndex, water, atmosphere, regime };
}

export function environmentFor(planetId: string): EnvironmentProfile {
  return deriveEnvironment(getExoplanet(planetId));
}

/**
 * How well a tolerance level fits an environmental demand, 0..1.
 * The ideal trait level for a given environment is derived, not guessed.
 */
export function fitTrait(trait: number, demand: number, tolerance: number): number {
  return 1 - mismatch(trait, demand, tolerance);
}

/** Ideal organism traits for surviving on this world (for the "what should I build?" hints). */
export function idealTraits(env: EnvironmentProfile): {
  thermotolerance: number;
  radioresistance: number;
  photosyntheticEfficiency: number;
  osmoticTolerance: number;
} {
  return {
    thermotolerance: clamp((env.tempK - 280) / 120),
    radioresistance: clamp((env.radiationIndex - 1) / 6),
    photosyntheticEfficiency: clamp(env.water * (env.tempK > 200 ? 1 : 0.1)),
    osmoticTolerance: clamp(1 - env.water),
  };
}
