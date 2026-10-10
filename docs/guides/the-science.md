# The science — what is modeled, and what is not

This page is the contract with the player: every heuristic below is documented so it can be
argued with, forked, or corrected in a PR.

## Environment derivation

Given a catalog exoplanet (published mass, radius, insolation, stellar class):

- **Equilibrium temperature** `T = 288 × S^0.25` where S is insolation in Earth units — the
  blackbody balance around 1 S⊕ — plus a **documented +22 K greenhouse assumption** for small
  worlds in the temperate band, 0 otherwise. The uplift is deliberately generous and stated.
- **Gravity** `g = M / R²` in Earth units.
- **Radiation index** by stellar class (G 1.0, K 1.4, M 3.2, F 1.6), scaled by √insolation. A
  coarse UV/X-ray proxy, not a spectrum.
- **Water** from insolation and radius: small temperate worlds keep some, hot or mini-Neptune
  worlds report none.
- **Regime** label: deep-freeze < 200 K, temperate < 320 K, hot < 500 K, sterilizing above.

## Trait derivation

Each ORF carries signed effects on nine trait axes. Copies stack with **saturating sums**:
`Σ eᵢ(1 − Σ|eⱼ|·0.6)` flavor — diminishing returns per copy. Metabolic rate taxes fitness
(`vitality = 1 − max(0, rate − 0.5)·0.8`), so maximalism is punished.

## Guide design

20 nt protospacer + NGG PAM. Score = 0.6·(1 − |GC − 0.5|/0.35) + 0.4, penalized by homopolymer
runs > 4, self-complementarity (8-mers), and off-target counts from scanning the **assembled
genome sequence** (the concatenation of part motifs) within two mismatches.

## The simulation

Per generation: fitness = trait-environment match (importance-weighted mismatch) × upkeep
factor; logistic growth gated by fitness with carrying capacity from world fertility; selection
pulls traits toward environmental demand; mutation adds seeded gaussian noise scaled by the
mutation slider; extinction on sustained sub-lethal fitness.

Deterministic: same genome + world + seed → identical history, guaranteed by the parity suite
across three languages.

## What is *not* modeled

Biochemistry, protein folding, ecosystems, gene regulation dynamics, actual orbital mechanics.
This is a toy with real numbers, not a simulation of life. If a number here matters to you,
check it against the primary literature — and open a PR.
