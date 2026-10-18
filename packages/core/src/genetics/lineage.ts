/**
 * Lineage reconstruction.
 *
 * The bench keeps an ordered history of committed releases; lineage rebuilds
 * the evolutionary story from it: which traits drifted, by how much, against
 * each strain's direct parent. Pure and deterministic so the tree can be
 * tested without a browser.
 */

import { deriveTraits, upkeep } from "./genome";
import type { Genome, GenomeSlot, TraitVector } from "./genome";
import { TRAIT_AXES } from "./genome";
import type { TraitAxis } from "./parts";

export interface CommittedStrain {
  id: string;
  genome: Genome;
  createdAt: number;
}

export interface LineageNode {
  id: string;
  name: string;
  chassis: string;
  createdAt: number;
  slots: GenomeSlot[];
  partCount: number;
  upkeep: number;
  /** trait drift against the parent, in human terms */
  innovations: string[];
  /** generation index (0 = root) */
  depth: number;
}

/** Human labels for the axes, used in the tree annotations. */
export const AXIS_LABELS: Record<TraitAxis, string> = {
  thermotolerance: "heat",
  radioresistance: "radiation",
  photosyntheticEfficiency: "light capture",
  osmoticTolerance: "osmotic",
  metabolicRate: "metabolism",
  pigmentation: "pigment",
  sporeFormation: "spores",
  nitrogenFixation: "N-fixation",
  toxinProduction: "toxin",
};

/** Variation below this is not worth reporting as drift. */
const DRIFT_THRESHOLD = 0.05;

/**
 * Build the lineage tree from a strain history. Input may be in any order —
 * the function sorts by creation time so the tree is chronological.
 */
export function buildLineage(strains: readonly CommittedStrain[]): LineageNode[] {
  const ordered = [...strains].sort((a, b) => a.createdAt - b.createdAt);
  return ordered.map((s, i) => {
    const traits: TraitVector = deriveTraits(s.genome);
    const parent = i > 0 ? deriveTraits(ordered[i - 1]!.genome) : null;
    const innovations: string[] = [];
    if (parent) {
      for (const axis of TRAIT_AXES) {
        const before = parent[axis];
        const after = traits[axis];
        if (Math.abs(after - before) >= DRIFT_THRESHOLD) {
          innovations.push(`${AXIS_LABELS[axis]} ${before.toFixed(2)}→${after.toFixed(2)}`);
        }
      }
    }
    return {
      id: s.id,
      name: s.genome.name,
      chassis: s.genome.chassis,
      createdAt: s.createdAt,
      slots: s.genome.slots,
      partCount: s.genome.slots.length,
      upkeep: upkeep(s.genome),
      innovations,
      depth: i,
    };
  });
}
