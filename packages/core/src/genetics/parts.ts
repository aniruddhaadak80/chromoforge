/**
 * The gene-parts catalog.
 *
 * Each part carries a *real* short DNA sequence motif. A composed genome's full
 * sequence is the concatenation of its parts' motifs, which is what makes the
 * CRISPR off-target scanner in `crispr.ts` a genuine in-silico search rather
 * than a random number generator.
 *
 * Motifs are illustrative teaching sequences (and real terminator/promoter
 * motifs where noted) — this is a design toy, not a synthesis order form.
 */

export type PartKind = "promoter" | "orf" | "terminator" | "regulatory";

export type TraitAxis =
  | "thermotolerance"
  | "radioresistance"
  | "photosyntheticEfficiency"
  | "osmoticTolerance"
  | "metabolicRate"
  | "pigmentation"
  | "sporeFormation"
  | "nitrogenFixation"
  | "toxinProduction";

export interface TraitEffect {
  axis: TraitAxis;
  /** signed effect on the axis, roughly in [-0.5, 0.5] */
  weight: number;
}

export interface Part {
  id: string;
  name: string;
  kind: PartKind;
  /** DNA motif; compositions concatenate these */
  sequence: string;
  /** human description */
  description: string;
  /** biological role for grouping in the UI */
  family: string;
  /** trait contributions when present in the genome */
  effects?: TraitEffect[];
  /** rough ATP/maintenance cost in arbitrary units */
  upkeep: number;
  /** true for the handful of parts the biosecurity gate watches */
  regulated?: boolean;
}

const PROMOTERS: Part[] = [
  {
    id: "pT7",
    name: "T7 Promoter",
    kind: "promoter",
    sequence: "TAATACGACTCACTATAGGGAGA",
    description: "Strong constitutive bacteriophage promoter; high expression, no regulation.",
    family: "constitutive",
    upkeep: 2,
  },
  {
    id: "pLac",
    name: "lac Promoter",
    kind: "promoter",
    sequence: "TTTACACTTTATGCTTCCGGCTCGTATAATGTGTGGA",
    description: "IPTG-inducible; tight off-state, medium expression. The classic workhorse.",
    family: "inducible",
    upkeep: 3,
  },
  {
    id: "pTac",
    name: "tac Promoter",
    kind: "promoter",
    sequence: "AATTGTGAGCGGATAACAATTTCACACAGGAAACAGCTATGACCATG",
    description: "Hybrid trp/lac promoter: stronger than lac, still IPTG-inducible. The loud one.",
    family: "inducible",
    upkeep: 3,
  },
  {
    id: "pCold",
    name: "Cold-shock Promoter",
    kind: "promoter",
    sequence: "ATGTAACTATTATTGCAGGCATCAAATGTAACTATTATTGCAGG",
    description: "Activates at low temperature; temperature shut-off above 20 °C.",
    family: "inducible",
    effects: [{ axis: "thermotolerance", weight: 0.04 }],
    upkeep: 3,
  },
  {
    id: "pHeat",
    name: "Heat-shock Promoter (dnaK)",
    kind: "promoter",
    sequence: "ATGTAACTATTATTGCAGGCATCAAATGTAACTATTATTGCAGGCTGT",
    description: "Fires under heat stress; drives chaperone and repair expression when it matters.",
    family: "inducible",
    effects: [{ axis: "thermotolerance", weight: 0.06 }],
    upkeep: 3,
  },
  {
    id: "pBad",
    name: "araBAD Promoter",
    kind: "promoter",
    sequence: "ATGTAACTATTATTGCAGGCATCAAATGTAACTATTATTGCAGGCCGT",
    description: "Arabinose-inducible with catabolite repression tuning.",
    family: "inducible",
    upkeep: 3,
  },
  {
    id: "pPhoto",
    name: "Photosynthetic operon promoter",
    kind: "promoter",
    sequence: "AAGGTTTGCGCAATAAAGCGATAACTATGTAACTATTATTGCAGG",
    description: "Light-responsive promoter from a cyanobacterial operon; gates photosynthesis genes.",
    family: "inducible",
    effects: [{ axis: "photosyntheticEfficiency", weight: 0.05 }],
    upkeep: 4,
  },
];

const ORFS: Part[] = [
  {
    id: "orfHsp",
    name: "hsp70 chaperone",
    kind: "orf",
    sequence: "ATGGCCTTGAAATTAGGCGGCAGCACCATGGCTGAAGGCAAAGGC",
    description: "Heat-shock protein; refolds denatured proteins. The single best thermotolerance investment.",
    family: "stress response",
    effects: [{ axis: "thermotolerance", weight: 0.22 }],
    upkeep: 5,
  },
  {
    id: "orfSod",
    name: "sodA superoxide dismutase",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGGCTATTAAAGCGGCGATTGCAACGC",
    description: "Scavenges superoxide radicals — the first line against ionizing and UV damage.",
    family: "stress response",
    effects: [{ axis: "radioresistance", weight: 0.16 }],
    upkeep: 4,
  },
  {
    id: "orfKatG",
    name: "katG catalase-peroxidase",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGCGCATTAAAGCGGCGATTGCGCAAC",
    description: "Breaks down hydrogen peroxide; complements recA by removing the damage at its source.",
    family: "stress response",
    effects: [
      { axis: "radioresistance", weight: 0.14 },
      { axis: "metabolicRate", weight: -0.04 },
    ],
    upkeep: 4,
  },
  {
    id: "orfIce",
    name: "afp antifreeze protein",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGCAACTGGCTAACCGTAAAGCGACT",
    description: "Inhibits ice recrystallization — the cold-adapted organism's answer to freezing.",
    family: "stress response",
    effects: [
      { axis: "thermotolerance", weight: 0.06 },
      { axis: "osmoticTolerance", weight: 0.1 },
    ],
    upkeep: 3,
  },
  {
    id: "orfOsm",
    name: "ectAB ectoine synthase",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGGCTATTAAAGCGGCGATTGCGCAAC",
    description: "Synthesizes ectoine, the compatible solute of halophiles. Brine worlds, solved.",
    family: "osmotic",
    effects: [{ axis: "osmoticTolerance", weight: 0.2 }],
    upkeep: 6,
  },
  {
    id: "orfCco",
    name: "ccoNO cytochrome c oxidase",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGCAGTTAGCGCGCGATTGCGCAACT",
    description: "High-affinity respiratory oxidase — squeezes energy out of thin atmospheres.",
    family: "energy",
    effects: [
      { axis: "metabolicRate", weight: 0.24 },
      { axis: "thermotolerance", weight: -0.04 },
    ],
    upkeep: 7,
  },
  {
    id: "orfHup",
    name: "hupSL uptake hydrogenase",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGACTGAAGGCATTAAACGCAACTGT",
    description: "Oxidizes atmospheric H₂ for energy — a niche that pays brilliantly on reducing worlds.",
    family: "energy",
    effects: [
      { axis: "metabolicRate", weight: 0.16 },
      { axis: "nitrogenFixation", weight: 0.05 },
    ],
    upkeep: 6,
  },
  {
    id: "orfMcr",
    name: "mcrABCD methyl-reductase complex",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGCGCATTAAAGCGGCGATTGCGCAAC",
    description: "Methanogenesis: the deepest-branching metabolism on Earth. Lives where nothing else will.",
    family: "metabolism",
    effects: [
      { axis: "nitrogenFixation", weight: 0.12 },
      { axis: "metabolicRate", weight: 0.08 },
      { axis: "thermotolerance", weight: 0.04 },
    ],
    upkeep: 9,
  },
  {
    id: "orfGvp",
    name: "gvp gas-vesicle protein cluster",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGCAGTTAGCGCGCTCGCGCAACTGAT",
    description: "Protein gas vesicles for buoyancy — drift to the photic zone instead of sinking.",
    family: "ecology",
    effects: [
      { axis: "sporeFormation", weight: 0.1 },
      { axis: "metabolicRate", weight: -0.06 },
    ],
    upkeep: 5,
  },
  {
    id: "orfRecA",
    name: "recA repair recombinase",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGAAAGCGGCACTGGCACT",
    description: "SOS response hub: homologous recombination, DNA repair, damage checkpoint.",
    family: "stress response",
    effects: [{ axis: "radioresistance", weight: 0.2 }],
    upkeep: 4,
  },
  {
    id: "orfDsup",
    name: "Dsup (damage suppression)",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGATCGGCGATTTAGCCTGATG",
    description: "Tardigrade radiotolerance protein; binds chromatin and reduces double-strand breaks.",
    family: "stress response",
    effects: [{ axis: "radioresistance", weight: 0.18 }],
    upkeep: 3,
    regulated: true,
  },
  {
    id: "orfPsbA",
    name: "psbA (D1 reaction-center protein)",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGCAACTGGCTAACCGTAAAGCG",
    description: "Core of photosystem II; sets the ceiling on photon capture efficiency.",
    family: "energy",
    effects: [{ axis: "photosyntheticEfficiency", weight: 0.24 }],
    upkeep: 6,
  },
  {
    id: "orfRuBisCO",
    name: "rbcL/cbbL (RuBisCO large subunit)",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGCAACTGGCTAACCGTAAAGCGACT",
    description: "Carbon fixation engine; converts captured light into biomass. Slow but essential.",
    family: "energy",
    effects: [
      { axis: "photosyntheticEfficiency", weight: 0.14 },
      { axis: "metabolicRate", weight: -0.06 },
    ],
    upkeep: 8,
  },
  {
    id: "orfProP",
    name: "proP (proline/betaine importer)",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGATTTAATTGCGAAAGGCATT",
    description: "Osmoprotectant uptake; survives brine and desiccation by balancing turgor.",
    family: "osmotic",
    effects: [{ axis: "osmoticTolerance", weight: 0.26 }],
    upkeep: 4,
  },
  {
    id: "orfCarotenoid",
    name: "crtI carotenoid pathway",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGATTGCGAAAGGCATTAAACGT",
    description: "Pigment synthesis; antioxidant shield and photoprotection. Tints the culture gold.",
    family: "pigment",
    effects: [
      { axis: "pigmentation", weight: 0.4 },
      { axis: "radioresistance", weight: 0.05 },
    ],
    upkeep: 3,
  },
  {
    id: "orfSpo0A",
    name: "spo0A phosphorelay",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGCGCATTAAAGCGGCGATTGCA",
    description: "Master regulator of sporulation; endospores ride out almost anything — slowly.",
    family: "dormancy",
    effects: [
      { axis: "sporeFormation", weight: 0.45 },
      { axis: "metabolicRate", weight: -0.18 },
    ],
    upkeep: 5,
  },
  {
    id: "orfNifH",
    name: "nifH nitrogenase reductase",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGGCTATTAAAGCGGCGATTGCAAC",
    description: "Fixes atmospheric N₂ into ammonia. Oxygen-sensitive, but lifesaving on barren worlds.",
    family: "metabolism",
    effects: [{ axis: "nitrogenFixation", weight: 0.35 }],
    upkeep: 9,
  },
  {
    id: "orfAtp",
    name: "atpAGD synthase operon",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGACTGAAGGCATTAAACGCAAC",
    description: "Energy currency synthase; raises metabolic ceiling, raises hunger equally.",
    family: "metabolism",
    effects: [{ axis: "metabolicRate", weight: 0.3 }],
    upkeep: 7,
  },
  {
    id: "orfCry",
    name: "cry toxin cassette",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGCAGTTAGCGCATTAAAGCGCGT",
    description: "Delta-endotoxin crystal protein. Insecticidal. Watch-list material.",
    family: "defense",
    effects: [{ axis: "toxinProduction", weight: 0.6 }],
    upkeep: 6,
    regulated: true,
  },
  {
    id: "orfBla",
    name: "bla antibiotic resistance marker",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGCAGTTAGCGCGCGATTGCAACT",
    description: "Selection marker. Indispensable in the lab; a headline risk outside it.",
    family: "selection",
    effects: [],
    upkeep: 2,
    regulated: true,
  },
  {
    id: "orfAero",
    name: "biofilm/adhesion operon",
    kind: "orf",
    sequence: "ATGAGCGAACGATTTAGCGCAGTTAGCGCGCTCGCGCAACT",
    description: "Surface adhesion and biofilm matrix; also the chassis of airborne transmission.",
    family: "ecology",
    effects: [
      { axis: "osmoticTolerance", weight: 0.08 },
      { axis: "sporeFormation", weight: 0.05 },
    ],
    upkeep: 5,
    regulated: true,
  },
];

const TERMINATORS: Part[] = [
  {
    id: "tT1",
    name: "T1 terminator",
    kind: "terminator",
    sequence: "TGGCGATAAGCGCACGCACGGCATCAG",
    description: "Strong bidirectional terminator; clean stops, low readthrough.",
    family: "strong",
    upkeep: 1,
  },
  {
    id: "tT7",
    name: "T7 terminator",
    kind: "terminator",
    sequence: "GCTAGTTATTGCTCAGCGGTGGCAGCAGCCAACTCAGCTTCCTTTCGGGCTTTGTTAGCAGCCGGATCTCAGTGG",
    description: "Bacteriophage T7 terminator; very high efficiency under T7 RNAP.",
    family: "strong",
    upkeep: 1,
  },
  {
    id: "tWeak",
    name: "LE weak terminator",
    kind: "terminator",
    sequence: "GCTAGTTATTGCTCAGCGG",
    description: "Deliberately leaky; readthrough can couple adjacent cassettes.",
    family: "weak",
    upkeep: 1,
  },
];

const REGULATORY: Part[] = [
  {
    id: "regTetR",
    name: "tetR repressor (trans)",
    kind: "regulatory",
    sequence: "ATGAGCGAACGATTTAGCGACTGAAGGCATTAAACGCAACTTGT",
    description: "Tetracycline-repressible regulator; pairs with tetO-tagged promoters.",
    family: "regulatory",
    effects: [{ axis: "metabolicRate", weight: -0.04 }],
    upkeep: 4,
  },
  {
    id: "regLuxI",
    name: "luxI synthase (quorum sensing)",
    kind: "regulatory",
    sequence: "ATGAGCGAACGATTTAGCGCAGTTAGCGCGCTCGCGCAACTGAT",
    description: "Autoinducer synthase; lets the culture sense its own density.",
    family: "regulatory",
    effects: [{ axis: "metabolicRate", weight: -0.02 }],
    upkeep: 4,
  },
];

export const PARTS: readonly Part[] = [
  ...PROMOTERS,
  ...ORFS,
  ...TERMINATORS,
  ...REGULATORY,
];

export const PART_BY_ID: ReadonlyMap<string, Part> = new Map(PARTS.map((p) => [p.id, p]));

export function getPart(id: string): Part {
  const part = PART_BY_ID.get(id);
  if (!part) throw new Error(`Unknown part id: ${id}`);
  return part;
}

export function partsByKind(kind: PartKind): Part[] {
  return PARTS.filter((p) => p.kind === kind);
}
