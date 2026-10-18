export { PARTS, PART_BY_ID, getPart, partsByKind } from "./parts";
export type { Part, PartKind, TraitAxis, TraitEffect } from "./parts";
export {
  deriveTraits,
  genomeSequence,
  upkeep,
  validateGenome,
  TRAIT_AXES,
  ZERO_TRAITS,
  MAX_SLOTS,
  MAX_COPIES,
} from "./genome";
export type { Genome, GenomeSlot, TraitVector, GenomeValidation } from "./genome";
export {
  NUCLEASES,
  REPRESENTATIVE_PAM,
  countOffTargets,
  designGuides,
  hamming,
  scoreGuide,
} from "./crispr";
export type { GuideCandidate, NucleaseProfile, Endonuclease } from "./crispr";
export { BIOSAFETY_POLICY, evaluateBiosafety } from "./biosecurity";
export type { BiosafetyReport, Finding, PolicyRule, Verdict } from "./biosecurity";
export { decodeGenome, encodeGenome, genomeFromSearchParams } from "./codec";
export { AXIS_LABELS, buildLineage } from "./lineage";
export type { CommittedStrain, LineageNode } from "./lineage";
