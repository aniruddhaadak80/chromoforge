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

## Sky projection (Hammer–Aitoff)

`docs/diagrams/14-sky-projection.mmd` shows the Atlas pipeline; the math itself lives in
`packages/core/src/exoplanets/projection.ts`. All-sky maps use the **Hammer (Hammer–Aitoff)
equal-area** projection: the whole sphere fits in ellipse bounds `(x²)/4 + y² ≤ 1` with only
mild edge distortion.

Forward map, for right ascension `α` and declination `δ` in degrees:

1. Wrap `α` into `[0, 360)`, then fold `α' = α − 360` when `α > 180`. `sin(α'/2)` and
   `cos(α'/2)` are not 360°-periodic, so without the fold a star at 0° and the same star at
   360° would land on different points.
2. With `k = sqrt(1 + cos δ · cos(α'/2))`:

   ```
   x = 2 · cos δ · sin(α'/2) / k
   y =        sin δ              / k
   ```

### Worked example: TRAPPIST-1 e

TRAPPIST-1 e sits at J2000 RA 346.62°, dec −5.04° (`packages/core/src/exoplanets/catalog.ts`):

| Step | Value |
|------|-------|
| Fold RA | 346.62 − 360 = **−13.38°**, so `α'/2` = −6.69° |
| `cos δ` | cos(−5.04°) = **0.996134** |
| `cos(α'/2)` | cos(−6.69°) = **0.993191** |
| `k` | sqrt(1 + 0.996134 · 0.993191) = **1.41044** |
| `sin(α'/2)` | **−0.116497** |
| `2 · cos δ · sin(α'/2)` | 2 · 0.996134 · (−0.116497) = **−0.232094** |
| `sin δ` | **−0.087851** |
| `x` | −0.232093 / 1.41044 = **−0.164554** |
| `y` | −0.087851 / 1.41044 = **−0.062286** |

Reproduce against the code:

```sh
bun -e "const m = await import('./packages/core/src/exoplanets/projection.ts');
console.log(m.hammerProject(346.62, -5.04));  // x: -0.164554, y: -0.062286
console.log(m.hammerUnproject(-0.164554, -0.062286)); // { ra: 346.62, dec: -5.04 }"
```

The inverse map comes from the same identity: on the map ellipse,
`(x²)/4 + y² = cos δ · cos(α'/2)` (the `d` in `hammerUnproject`), which separates the two
angles. One round-trip is shown above — unprojecting the worked `x`/`y` recovers
RA 346.62°, dec −5.04° exactly.

## What is *not* modeled

Biochemistry, protein folding, ecosystems, gene regulation dynamics, actual orbital mechanics.
This is a toy with real numbers, not a simulation of life. If a number here matters to you,
check it against the primary literature — and open a PR.
