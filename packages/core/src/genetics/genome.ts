/**
 * Genome composition and trait derivation.
 *
 * A genome is an ordered list of part instantiations. Traits are derived by
 * summing effect weights with saturation — stacking five chaperone copies
 * helps, but with diminishing returns, the same way biology behaves.
 */

import { clamp, saturatingSum } from "../util/math";
import { getPart } from "./parts";
import type { Part, TraitAxis } from "./parts";

export interface GenomeSlot {
  partId: string;
  /** copy number; multiple copies stack with saturation */
  copies: number;
}

export interface Genome {
  id: string;
  name: string;
  /** chassis label, e.g. "E. coli K-12" or "synthetic minimal cell" */
  chassis: string;
  slots: GenomeSlot[];
}

export const TRAIT_AXES: readonly TraitAxis[] = [
  "thermotolerance",
  "radioresistance",
  "photosyntheticEfficiency",
  "osmoticTolerance",
  "metabolicRate",
  "pigmentation",
  "sporeFormation",
  "nitrogenFixation",
  "toxinProduction",
];

export type TraitVector = Record<TraitAxis, number>;

export const ZERO_TRAITS: TraitVector = {
  thermotolerance: 0,
  radioresistance: 0,
  photosyntheticEfficiency: 0,
  osmoticTolerance: 0,
  metabolicRate: 0.15,
  pigmentation: 0,
  sporeFormation: 0,
  nitrogenFixation: 0,
  toxinProduction: 0,
};

/** Derive the phenotype vector from a genotype. Deterministic and pure. */
export function deriveTraits(genome: Genome): TraitVector {
  const byAxis = new Map<TraitAxis, number[]>();
  for (const slot of genome.slots) {
    const part: Part = getPart(slot.partId);
    for (const effect of part.effects ?? []) {
      const list = byAxis.get(effect.axis) ?? [];
      for (let i = 0; i < slot.copies; i++) list.push(effect.weight);
      byAxis.set(effect.axis, list);
    }
  }
  const traits: TraitVector = { ...ZERO_TRAITS };
  for (const axis of TRAIT_AXES) {
    const effects = byAxis.get(axis);
    if (!effects || effects.length === 0) continue;
    traits[axis] = clamp(ZERO_TRAITS[axis] + saturatingSum(effects, 0.55));
  }
  return traits;
}

/** Total maintenance burden of a genome in arbitrary ATP units. */
export function upkeep(genome: Genome): number {
  let total = 0;
  for (const slot of genome.slots) {
    total += getPart(slot.partId).upkeep * slot.copies;
  }
  return total;
}

/** Instantiate the genome's full DNA by concatenating part motifs. */
export function genomeSequence(genome: Genome): string {
  return genome.slots
    .flatMap((slot) => {
      const seq = getPart(slot.partId).sequence;
      return Array.from({ length: slot.copies }, () => seq);
    })
    .join("");
}

export interface GenomeValidation {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export const MAX_SLOTS = 24;
export const MAX_COPIES = 3;

/** A design must be constructible: no unknown ids, no runaway copy counts. */
export function validateGenome(genome: Genome): GenomeValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (genome.slots.length > MAX_SLOTS) {
    errors.push(`Genome has ${genome.slots.length} slots; the foundry cap is ${MAX_SLOTS}.`);
  }
  const seen = new Set<string>();
  for (const slot of genome.slots) {
    if (!Number.isInteger(slot.copies) || slot.copies < 1) {
      errors.push(`Slot ${slot.partId}: copies must be a positive integer.`);
    }
    if (slot.copies > MAX_COPIES) {
      errors.push(`Slot ${slot.partId}: ${slot.copies} copies exceeds the ${MAX_COPIES}-copy cap.`);
    }
    if (seen.has(slot.partId)) {
      warnings.push(`Part ${slot.partId} appears twice as separate slots; consider merging copies.`);
    }
    seen.add(slot.partId);
  }
  if (!genome.slots.some((s) => getPart(s.partId).kind === "promoter")) {
    warnings.push("No promoter included; expression cassettes will not transcribe.");
  }
  if (upkeep(genome) > 120) {
    warnings.push("Maintenance burden is high; expect slow growth and unhappy cultures.");
  }
  return { ok: errors.length === 0, errors, warnings };
}
