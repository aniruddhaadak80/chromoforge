/**
 * The survival simulation.
 *
 * Per generation:
 *   1. fitness = match between organism traits and the environment's demands,
 *      discounted by maintenance burden
 *   2. growth = logistic expansion gated by fitness (and by water/energy
 *      availability)
 *   3. selection: next generation's mean traits drift toward the fittest,
 *      with seeded mutation noise (this is descent with modification, not
 *      random walk)
 *   4. extinction when population < 1 or fitness stays below the lethality
 *      floor
 *
 * Deterministic for a given seed: the same genome + world + seed always
 * replays the same history. The Rust crate `crates/ecology` implements the
 * identical RNG and update order — `cargo run -- --parity-check` asserts the
 * two engines agree, and packages/core has a conformance test against the
 * same vectors.
 */

import { clamp, mismatch } from "../util/math";
import type { EnvironmentProfile } from "./environment";
import { deriveEnvironment } from "./environment";
import { getExoplanet } from "../exoplanets/index";
import type { TraitVector } from "../genetics/index";
import { TRAIT_AXES } from "../genetics/index";
import type { Genome } from "../genetics/index";
import { deriveTraits, upkeep } from "../genetics/index";
import { createRng } from "../util/rng";

export interface SimConfig {
  generations: number;
  /** founding population */
  founders: number;
  /** mutation standard deviation per generation */
  mutationStdDev: number;
  seed: number;
  /** carrying-capacity multiplier of the world */
  worldFertility?: number;
}

export interface GenerationPoint {
  generation: number;
  population: number;
  meanFitness: number;
  meanTraits: TraitVector;
  events: string[];
}

export type SimOutcome = "thriving" | "surviving" | "extinct";

export interface SimResult {
  config: SimConfig;
  environment: EnvironmentProfile;
  history: GenerationPoint[];
  outcome: SimOutcome;
  extinctAt: number | null;
  finalTraits: TraitVector;
  peakPopulation: number;
}

const DEMAND: { axis: keyof TraitVector; tolerance: number; demandOf: (env: EnvironmentProfile) => number }[] = [
  { axis: "thermotolerance", tolerance: 0.45, demandOf: (e) => clamp((e.tempK - 288) / 160) },
  { axis: "radioresistance", tolerance: 0.4, demandOf: (e) => clamp((e.radiationIndex - 1) / 8) },
  { axis: "photosyntheticEfficiency", tolerance: 0.5, demandOf: (e) => clamp(e.water * 1.1) },
  { axis: "osmoticTolerance", tolerance: 0.5, demandOf: (e) => clamp((1 - e.water) * 1.2) },
  { axis: "nitrogenFixation", tolerance: 0.6, demandOf: (e) => clamp((1 - e.water) * 0.8) },
];

/** Fitness of a trait vector against an environment, 0..1. */
export function fitnessOf(traits: TraitVector, env: EnvironmentProfile): number {
  let total = 0;
  let weight = 0;
  for (const d of DEMAND) {
    const demand = d.demandOf(env);
    const importance = 0.4 + demand * 0.6;
    total += (1 - mismatch(traits[d.axis], demand, d.tolerance)) * importance;
    weight += importance;
  }
  // metabolic cost: high upkeep burns hard-won fitness
  const vitality = clamp(1 - Math.max(0, (traits.metabolicRate - 0.5)) * 0.8);
  return clamp(total / weight * vitality);
}

/** Full simulation run. Pure, deterministic, side-effect free. */
export function simulate(
  genome: Genome,
  planetId: string,
  config: SimConfig,
): SimResult {
  const planet = getExoplanet(planetId);
  const env = deriveEnvironment(planet);
  const rng = createRng(config.seed);
  const maintenance = upkeep(genome) / 100;
  const fertility = config.worldFertility ?? clamp(env.water * 1.2 + 0.05);
  const carrying = Math.max(10, Math.round(config.founders * 60 * fertility));

  let traits = deriveTraits(genome);
  let population = config.founders;
  const history: GenerationPoint[] = [];
  let extinctAt: number | null = null;
  let peakPopulation = population;
  let stagnant = 0;

  for (let gen = 0; gen <= config.generations; gen++) {
    const fitness = fitnessOf(traits, env) * clamp(1 - maintenance * 0.7);
    const events: string[] = [];

    if (population < 1) {
      extinctAt = extinctAt ?? gen;
      history.push({ generation: gen, population: 0, meanFitness: 0, meanTraits: { ...traits }, events: ["Colony extinct."] });
      break;
    }

    // logistic growth gated by fitness
    const r = Math.max(0, (fitness - 0.25) * 3.2);
    population = population + Math.round(r * population * (1 - population / carrying));
    peakPopulation = Math.max(peakPopulation, population);

    // narrative beats
    if (fitness < 0.3 && population < config.founders / 2) events.push("Mass die-off: traits barely meet the world.");
    if (env.radiationIndex > 2 && traits.radioresistance > 0.4) events.push("Radiation-resistant strains sweep the population.");
    if (env.tempK > 400 && traits.thermotolerance > 0.35) events.push("Hyperthermophilic clade dominates.");
    if (env.tempK < 250 && traits.sporeFormation > 0.3) events.push("Population enters spore dormancy through the long winter.");
    if (rng.chance(0.02)) events.push("Beneficial mutation resolves in a fitter subpopulation.");

    history.push({ generation: gen, population, meanFitness: Number(fitness.toFixed(4)), meanTraits: { ...traits }, events });

    // selection + mutation for the next generation
    const next: TraitVector = { ...traits };
    for (const axis of TRAIT_AXES) {
      const drift = rng.gauss() * config.mutationStdDev * 0.05;
      const selectivePull = selectiveDrift(axis, traits[axis], env);
      next[axis] = clamp(traits[axis] + drift + selectivePull);
    }
    traits = next;

    stagnant = fitness < 0.28 ? stagnant + 1 : 0;
    if (stagnant >= 6) {
      extinctAt = gen + 1;
      history.push({ generation: gen + 1, population: 0, meanFitness: fitness, meanTraits: { ...traits }, events: ["Sustained sub-lethal fitness; the colony fades."] });
      break;
    }
  }

  const last = history[history.length - 1];
  const outcome: SimOutcome =
    last === undefined || last.population === 0
      ? "extinct"
      : last.meanFitness > 0.55 && last.population > carrying * 0.25
        ? "thriving"
        : "surviving";

  return {
    config,
    environment: env,
    history,
    outcome,
    extinctAt,
    finalTraits: traits,
    peakPopulation,
  };
}

/** Selection pushes traits toward what the environment rewards. */
function selectiveDrift(axis: keyof TraitVector, current: number, env: EnvironmentProfile): number {
  const demand = DEMAND.find((d) => d.axis === axis)?.demandOf(env);
  if (demand === undefined) return 0;
  return (demand - current) * 0.08;
}
