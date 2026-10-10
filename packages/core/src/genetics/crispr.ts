/**
 * Guide-RNA design for SpCas9-class nucleases.
 *
 * Real rules, simplified: 20 nt protospacer followed by an NGG PAM, scored by
 * GC content, homopolymer runs, and self-complementarity. Off-targets are
 * counted by scanning the organism's actual assembled sequence (motif
 * concatenation from `parts.ts`) for ±2-mismatch near-matches — a genuine
 * in-silico specificity search, not theatre.
 */

import { createRng } from "../util/rng";
import { genomeSequence } from "./genome";
import { getPart } from "./parts";
import type { Genome } from "./genome";

export const GUIDE_LENGTH = 20;
export const REPRESENTATIVE_PAM = "NGG";

export type Endonuclease = "SpCas9" | "SaCas9" | "Cas12a";

export interface NucleaseProfile {
  id: Endonuclease;
  pam: string;
  guideLength: number;
  /** smaller = more tolerant of mismatches */
  specificityBias: number;
}

export const NUCLEASES: Record<Endonuclease, NucleaseProfile> = {
  SpCas9: { id: "SpCas9", pam: "NGG", guideLength: 20, specificityBias: 1 },
  SaCas9: { id: "SaCas9", pam: "NNGRRT", guideLength: 21, specificityBias: 1.25 },
  Cas12a: { id: "Cas12a", pam: "TTTV", guideLength: 23, specificityBias: 0.8 },
};

export function randomGuide(rng: () => number): string {
  const bases = ["A", "C", "G", "T"] as const;
  return Array.from({ length: GUIDE_LENGTH }, () => bases[Math.floor(rng() * 4)]).join("");
}

/** Count mismatches between equal-length sequences. */
export function hamming(a: string, b: string): number {
  let n = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) n++;
  }
  return n;
}

/** Scan the genome sequence for near-matches within `maxMismatches`. */
export function countOffTargets(genome: Genome, guide: string, maxMismatches = 2): number {
  const seq = genomeSequence(genome).toUpperCase();
  if (seq.length < guide.length) return 0;
  let hits = 0;
  for (let i = 0; i + guide.length <= seq.length; i++) {
    const window = seq.slice(i, i + guide.length);
    if (hamming(window, guide) <= maxMismatches) hits++;
  }
  return hits;
}

export interface GuideCandidate {
  sequence: string;
  pam: string;
  gc: number;
  homopolymerRun: number;
  selfComplementarity: number;
  offTargets: number;
  /** composite 0..1 score */
  score: number;
}

/** Score a candidate guide: GC near 50 % is ideal, long homopolymers and self-complementarity are bad. */
export function scoreGuide(sequence: string, pam: string, offTargets: number): GuideCandidate {
  const gc = (sequence.split("").filter((c) => c === "G" || c === "C").length / sequence.length);
  let homopolymerRun = 1;
  let run = 1;
  for (let i = 1; i < sequence.length; i++) {
    run = sequence[i] === sequence[i - 1] ? run + 1 : 1;
    homopolymerRun = Math.max(homopolymerRun, run);
  }
  const rev = sequence.split("").reverse().join("");
  const complement = rev.replace(/[ACGT]/g, (c) => ({ A: "T", C: "G", G: "C", T: "A" })[c] ?? "N");
  let selfComplementarity = 0;
  for (let i = 0; i + 8 <= sequence.length; i++) {
    if (sequence.slice(i, i + 8) === complement.slice(i, i + 8)) selfComplementarity++;
  }
  const gcScore = 1 - Math.min(1, Math.abs(gc - 0.5) / 0.35);
  const penalty =
    Math.max(0, homopolymerRun - 4) * 0.12 +
    selfComplementarity * 0.08 +
    offTargets * 0.15;
  const score = Math.max(0, Math.min(1, gcScore * 0.6 + 0.4 - penalty));
  return { sequence, pam, gc, homopolymerRun, selfComplementarity, offTargets, score };
}

/**
 * Find guides targeting a part inside a genome.
 *
 * We slide along the target part's motif and every in-frame 20-mer followed by
 * a PAM match becomes a candidate. Deterministic — the same genome yields the
 * same guide table.
 */
export function designGuides(
  genome: Genome,
  targetPartId: string,
  count = 5,
): GuideCandidate[] {
  const seq = genomeSequence(genome).toUpperCase();
  const target = genome.slots.find((s) => s.partId === targetPartId);
  if (!target) return [];
  // locate the first occurrence of the target part's motif
  const part = getPart(targetPartId);
  const start = seq.indexOf(part.sequence.toUpperCase());
  if (start < 0) return [];
  const end = Math.min(seq.length, start + part.sequence.length + GUIDE_LENGTH + 3);
  const candidates: GuideCandidate[] = [];
  for (let i = start; i + GUIDE_LENGTH + 3 <= end; i++) {
    const pam = seq.slice(i + GUIDE_LENGTH, i + GUIDE_LENGTH + 3);
    if (pam[1] === "G" && pam[2] === "G") {
      const g = seq.slice(i, i + GUIDE_LENGTH);
      if (/^[ACGT]+$/.test(g)) {
        const off = countOffTargets(genome, g, 2) - 1; // subtract the on-target occurrence
        candidates.push(scoreGuide(g, pam, Math.max(0, off)));
      }
    }
  }
  // no PAM found in-frame (short motifs can lack NGG): synthesize deterministic fallbacks
  if (candidates.length === 0) {
    const rng = createRng(targetPartId);
    for (let k = 0; k < count; k++) {
      const g = mutateTowards(part.sequence.toUpperCase(), rng.next, GUIDE_LENGTH);
      const off = Math.max(0, countOffTargets(genome, g, 2) - 1);
      candidates.push(scoreGuide(g, "NGG", off));
    }
  }
  return candidates.sort((a, b) => b.score - a.score).slice(0, count);
}

function mutateTowards(sequence: string, rng: () => number, length: number): string {
  const bases = ["A", "C", "G", "T"] as const;
  let out = sequence.slice(0, length);
  while (out.length < length) out += bases[Math.floor(rng() * 4)];
  return out.slice(0, length);
}
