/**
 * Generates parity fixtures for the cross-language parity harness.
 *
 * The TypeScript engine is the source of truth: this script runs canonical
 * scenarios through packages/core and writes them (inputs + expected output)
 * to services/agents/parity/fixtures.json. The Rust crate and the Python
 * service are then diffed against these vectors.
 *
 * Usage: bun scripts/gen-vectors.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  deriveTraits,
  upkeep,
  simulate,
  getExoplanet,
  deriveEnvironment,
  genomeSequence,
} from "../src/index.js";
import type { Genome } from "../src/index.js";

interface Fixture {
  name: string;
  input: {
    traits: Record<string, number>;
    environment: { temp_k: number; radiation_index: number; water: number };
    upkeep: number;
    config: {
      generations: number;
      founders: number;
      mutation_std_dev: number;
      seed: number;
      world_fertility: number | null;
    };
  };
  expected: {
    history: { generation: number; population: number; mean_fitness: number; events: string[] }[];
    outcome: string;
    extinct_at: number | null;
    peak_population: number;
  };
}

const GENOMES: Record<string, Genome> = {
  hardy: {
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
  },
  naked: {
    id: "g-naked",
    name: "Naked Minimal Cell",
    chassis: "lab strain",
    slots: [],
  },
  balanced: {
    id: "g-balanced",
    name: "Balanced Generalist",
    chassis: "synthetic minimal cell",
    slots: [
      { partId: "pLac", copies: 1 },
      { partId: "orfHsp", copies: 1 },
      { partId: "orfRecA", copies: 2 },
      { partId: "orfProP", copies: 1 },
      { partId: "tT1", copies: 1 },
    ],
  },
};

const SCENARIOS: { name: string; genome: keyof typeof GENOMES; planetId: string; seed: number }[] = [
  { name: "hardy-on-trappist-1e", genome: "hardy", planetId: "trappist-1e", seed: 7331 },
  { name: "naked-on-55-cnc-e", genome: "naked", planetId: "55-cnc-e", seed: 5 },
  { name: "balanced-on-kepler-442b", genome: "balanced", planetId: "kepler-442b", seed: 4242 },
  { name: "hardy-on-proxima-b", genome: "hardy", planetId: "proxima-b", seed: 99 },
];

const fixtures: Fixture[] = SCENARIOS.map(({ name, genome: genomeKey, planetId, seed }) => {
  const genome = GENOMES[genomeKey];
  if (!genome) throw new Error(`unknown genome ${genomeKey}`);
  const planet = getExoplanet(planetId);
  const env = deriveEnvironment(planet);
  const traits = deriveTraits(genome);
  const config = { generations: 60, founders: 100, mutationStdDev: 0.4, seed };
  const result = simulate(genome, planetId, config);
  return {
    name,
    input: {
      traits: { ...traits },
      environment: { temp_k: env.tempK, radiation_index: env.radiationIndex, water: env.water },
      upkeep: upkeep(genome),
      config: {
        generations: config.generations,
        founders: config.founders,
        mutation_std_dev: config.mutationStdDev,
        seed: config.seed,
        world_fertility: null,
      },
    },
    expected: {
      history: result.history.map((h) => ({
        generation: h.generation,
        population: h.population,
        mean_fitness: h.meanFitness,
        events: h.events,
      })),
      outcome: result.outcome,
      extinct_at: result.extinctAt,
      peak_population: result.peakPopulation,
    },
  };
});

const HERE = dirname(fileURLToPath(import.meta.url));
const out = resolve(HERE, "../../../services/agents/parity/fixtures.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify({ generated_by: "packages/core/scripts/gen-vectors.ts", engine: "typescript", fixtures }, null, 2)}\n`);
console.log(`wrote ${fixtures.length} fixtures -> ${out}`);
console.log(`genome sequence length (hardy): ${genomeSequence(GENOMES.hardy!).length} bp`);
