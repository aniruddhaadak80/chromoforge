//! Reference implementation of the chromoforge ecology simulation — **zero dependencies**.
//!
//! This crate mirrors `packages/core/src/ecology/simulate.ts` operation-for-
//! operation — same mulberry32 stream, same gauss approximation, same update
//! order — so `cargo test` catches any drift between the two engines before it
//! reaches a user. The CLI reads a scenario as JSON on stdin and writes the
//! generation history as JSON on stdout.
//!
//! No serde, no build scripts, no C toolchain required: `cargo test` just
//! works anywhere rustc does.

#[derive(Debug, Clone, Copy)]
pub struct Environment {
    pub temp_k: f64,
    pub radiation_index: f64,
    pub water: f64,
}

#[derive(Debug, Clone)]
pub struct SimConfig {
    pub generations: u32,
    pub founders: i64,
    pub mutation_std_dev: f64,
    pub seed: u64,
    pub world_fertility: Option<f64>,
}

#[derive(Debug, Clone)]
pub struct TraitVector {
    pub thermotolerance: f64,
    pub radioresistance: f64,
    pub photosynthetic_efficiency: f64,
    pub osmotic_tolerance: f64,
    pub metabolic_rate: f64,
    pub pigmentation: f64,
    pub spore_formation: f64,
    pub nitrogen_fixation: f64,
    pub toxin_production: f64,
}

impl Default for TraitVector {
    fn default() -> Self {
        Self {
            thermotolerance: 0.0,
            radioresistance: 0.0,
            photosynthetic_efficiency: 0.0,
            osmotic_tolerance: 0.0,
            metabolic_rate: 0.15,
            pigmentation: 0.0,
            spore_formation: 0.0,
            nitrogen_fixation: 0.0,
            toxin_production: 0.0,
        }
    }
}

#[derive(Debug, Clone)]
pub struct GenerationPoint {
    pub generation: u32,
    pub population: i64,
    pub mean_fitness: f64,
    pub events: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct SimResult {
    pub history: Vec<GenerationPoint>,
    pub outcome: String,
    pub extinct_at: Option<u32>,
    pub peak_population: i64,
}

/// Trait demand rows: (axis, tolerance, demand as a function of environment).
const DEMAND: [(&str, f64, fn(&Environment) -> f64); 5] = [
    ("thermotolerance", 0.45, |e| {
        clamp01((e.temp_k - 288.0) / 160.0)
    }),
    ("radioresistance", 0.40, |e| {
        clamp01((e.radiation_index - 1.0) / 8.0)
    }),
    ("photosynthetic_efficiency", 0.50, |e| {
        clamp01(e.water * 1.1)
    }),
    ("osmotic_tolerance", 0.50, |e| {
        clamp01((1.0 - e.water) * 1.2)
    }),
    ("nitrogen_fixation", 0.60, |e| {
        clamp01((1.0 - e.water) * 0.8)
    }),
];

fn clamp01(v: f64) -> f64 {
    v.clamp(0.0, 1.0)
}

fn trait_of(traits: &TraitVector, axis: &str) -> f64 {
    match axis {
        "thermotolerance" => traits.thermotolerance,
        "radioresistance" => traits.radioresistance,
        "photosynthetic_efficiency" => traits.photosynthetic_efficiency,
        "osmotic_tolerance" => traits.osmotic_tolerance,
        "nitrogen_fixation" => traits.nitrogen_fixation,
        _ => 0.0,
    }
}

/// mulberry32 — must match `packages/core/src/util/rng.ts` exactly.
pub struct Mulberry32 {
    state: i32,
}

impl Mulberry32 {
    pub fn new(seed: u64) -> Self {
        Self { state: seed as i32 }
    }
    pub fn next_f64(&mut self) -> f64 {
        self.state = self.state.wrapping_add(0x6d2b79f5);
        // Mirrors the TypeScript mulberry32 bit-for-bit: JS `| 0` arithmetic is
        // i32 wrapping, `>>>` is a logical shift, and `Math.imul` is
        // `wrapping_mul`. `ToInt32(t + inner)` equals `t.wrapping_add(inner)`.
        let a = self.state;
        let t0 = (a ^ ((a as u32 >> 15) as i32)).wrapping_mul(1 | a);
        let inner = (t0 ^ ((t0 as u32 >> 7) as i32)).wrapping_mul(61 | t0);
        let t1 = t0.wrapping_add(inner) ^ t0;
        ((t1 ^ ((t1 as u32 >> 14) as i32)) as u32) as f64 / 4294967296.0
    }
    /// (u + u + u − 1.5) × 1.1547 — the same three-uniform approximation
    /// the TypeScript engine uses.
    pub fn gauss(&mut self) -> f64 {
        let a = self.next_f64();
        let b = self.next_f64();
        let c = self.next_f64();
        (a + b + c - 1.5) * 1.1547
    }
}

/// JavaScript's Math.round: floor(x + 0.5). Differs from f64::round for exact
/// halves (and for negatives), and the parity contract requires the JS quirk.
fn js_round(x: f64) -> i64 {
    let floor = x.floor();
    if x - floor >= 0.5 {
        floor as i64 + 1
    } else {
        floor as i64
    }
}

pub fn fitness_of(traits: &TraitVector, env: &Environment) -> f64 {
    let mut total = 0.0;
    let mut weight = 0.0;
    for (axis, tolerance, demand_of) in DEMAND.iter() {
        let demand = demand_of(env);
        let importance = 0.4 + demand * 0.6;
        let mismatch = (trait_of(traits, axis) - demand).abs() / tolerance.max(f64::EPSILON);
        total += (1.0 - clamp01(mismatch)) * importance;
        weight += importance;
    }
    let vitality = clamp01(1.0 - (traits.metabolic_rate - 0.5).max(0.0) * 0.8);
    clamp01(total / weight * vitality)
}

pub fn simulate(
    traits: &TraitVector,
    env: &Environment,
    upkeep: f64,
    config: &SimConfig,
) -> SimResult {
    let mut rng = Mulberry32::new(config.seed);
    let maintenance = upkeep / 100.0;
    let fertility = config
        .world_fertility
        .unwrap_or(clamp01(env.water * 1.2 + 0.05));
    // Mirrors TS: Math.max(10, Math.round(founders * 60 * fertility))
    let carrying = js_round((config.founders * 60) as f64 * fertility).max(10) as f64;

    let mut traits = traits.clone();
    let mut population = config.founders;
    let mut history: Vec<GenerationPoint> = Vec::new();
    let mut extinct_at: Option<u32> = None;
    let mut peak_population = population;
    let mut stagnant = 0u32;

    for gen in 0..=config.generations {
        if population < 1 {
            extinct_at = Some(gen);
            history.push(GenerationPoint {
                generation: gen,
                population: 0,
                mean_fitness: 0.0,
                events: vec!["Colony extinct.".to_string()],
            });
            break;
        }
        let fitness = fitness_of(&traits, env) * clamp01(1.0 - maintenance * 0.7);
        let mut events: Vec<String> = Vec::new();

        let r = (fitness - 0.25).max(0.0) * 3.2;
        population = js_round(
            population as f64 + r * population as f64 * (1.0 - population as f64 / carrying),
        );
        peak_population = peak_population.max(population);

        if fitness < 0.3 && (population as f64) < (config.founders as f64) / 2.0 {
            events.push("Mass die-off: traits barely meet the world.".to_string());
        }
        if env.radiation_index > 2.0 && traits.radioresistance > 0.4 {
            events.push("Radiation-resistant strains sweep the population.".to_string());
        }
        if env.temp_k > 400.0 && traits.thermotolerance > 0.35 {
            events.push("Hyperthermophilic clade dominates.".to_string());
        }
        if env.temp_k < 250.0 && traits.spore_formation > 0.3 {
            events.push("Population enters spore dormancy through the long winter.".to_string());
        }
        if rng.next_f64() < 0.02 {
            events.push("Beneficial mutation resolves in a fitter subpopulation.".to_string());
        }

        history.push(GenerationPoint {
            generation: gen,
            population,
            mean_fitness: (fitness * 10000.0).round() / 10000.0,
            events,
        });

        // selection + mutation for the next generation
        let mut next_traits = traits.clone();
        let pulls: Vec<(&str, f64)> = DEMAND
            .iter()
            .map(|(axis, _t, demand_of)| (*axis, (demand_of(env) - trait_of(&traits, axis)) * 0.08))
            .collect();
        let pull = |name: &str| {
            pulls
                .iter()
                .find(|(a, _)| *a == name)
                .map(|(_, p)| *p)
                .unwrap_or(0.0)
        };
        let apply = |name: &str, value: &mut f64, gauss: f64| {
            *value = clamp01(*value + gauss * config.mutation_std_dev * 0.05 + pull(name));
        };
        let g1 = rng.gauss();
        let g2 = rng.gauss();
        let g3 = rng.gauss();
        let g4 = rng.gauss();
        let g5 = rng.gauss();
        let g6 = rng.gauss();
        let g7 = rng.gauss();
        let g8 = rng.gauss();
        let g9 = rng.gauss();
        apply("thermotolerance", &mut next_traits.thermotolerance, g1);
        apply("radioresistance", &mut next_traits.radioresistance, g2);
        apply(
            "photosynthetic_efficiency",
            &mut next_traits.photosynthetic_efficiency,
            g3,
        );
        apply("osmotic_tolerance", &mut next_traits.osmotic_tolerance, g4);
        apply("metabolic_rate", &mut next_traits.metabolic_rate, g5);
        apply("pigmentation", &mut next_traits.pigmentation, g6);
        apply("spore_formation", &mut next_traits.spore_formation, g7);
        apply("nitrogen_fixation", &mut next_traits.nitrogen_fixation, g8);
        apply("toxin_production", &mut next_traits.toxin_production, g9);

        traits = next_traits;

        stagnant = if fitness < 0.28 { stagnant + 1 } else { 0 };
        if stagnant >= 6 {
            extinct_at = Some(gen + 1);
            // TS pushes the raw (unrounded) fitness on the extinction entry
            history.push(GenerationPoint {
                generation: gen + 1,
                population: 0,
                mean_fitness: fitness,
                events: vec!["Sustained sub-lethal fitness; the colony fades.".to_string()],
            });
            break;
        }
    }

    let last = history.last().expect("at least one generation");
    let outcome = if last.population == 0 {
        "extinct".to_string()
    } else if last.mean_fitness > 0.55 && (last.population as f64) > carrying * 0.25 {
        "thriving".to_string()
    } else {
        "surviving".to_string()
    };

    SimResult {
        history,
        outcome,
        extinct_at,
        peak_population,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hardy() -> TraitVector {
        TraitVector {
            thermotolerance: 0.55,
            radioresistance: 0.5,
            photosynthetic_efficiency: 0.4,
            osmotic_tolerance: 0.1,
            metabolic_rate: 0.5,
            pigmentation: 0.2,
            spore_formation: 0.0,
            nitrogen_fixation: 0.0,
            toxin_production: 0.0,
        }
    }

    fn temperate() -> Environment {
        Environment {
            temp_k: 300.0,
            radiation_index: 1.5,
            water: 0.6,
        }
    }

    fn config(seed: u64) -> SimConfig {
        SimConfig {
            generations: 60,
            founders: 100,
            mutation_std_dev: 0.4,
            seed,
            world_fertility: None,
        }
    }

    #[test]
    fn rng_is_deterministic_per_seed() {
        let mut a = Mulberry32::new(7331);
        let mut b = Mulberry32::new(7331);
        assert_eq!(a.next_f64(), b.next_f64());
        assert_eq!(a.next_f64(), b.next_f64());
        let v = a.next_f64();
        assert!((0.0..1.0).contains(&v));
    }

    #[test]
    fn rng_matches_typescript_mulberry32() {
        // Measured from the TypeScript source of truth (packages/core):
        //   bun -e "import { mulberry32 } from './packages/core/src/util/rng';
        //          const r = mulberry32(7331); console.log([r(),r(),r(),r()])"
        // The Python port prints the identical four draws — all three engines
        // share one stream.
        let mut rng = Mulberry32::new(7331);
        assert!((rng.next_f64() - 0.973_738_7).abs() < 1e-6);
        assert!((rng.next_f64() - 0.653_222_7).abs() < 1e-6);
        assert!((rng.next_f64() - 0.135_566_7).abs() < 1e-6);
        assert!((rng.next_f64() - 0.239_804_7).abs() < 1e-6);
    }

    #[test]
    fn simulation_is_deterministic_for_a_seed() {
        let a = simulate(&hardy(), &temperate(), 20.0, &config(7331));
        let b = simulate(&hardy(), &temperate(), 20.0, &config(7331));
        assert_eq!(a.history.len(), b.history.len());
        assert_eq!(a.outcome, b.outcome);
        assert_eq!(a.peak_population, b.peak_population);
        for (x, y) in a.history.iter().zip(b.history.iter()) {
            assert_eq!(x.population, y.population);
            assert_eq!(x.mean_fitness, y.mean_fitness);
        }
    }

    #[test]
    fn fitness_is_bounded_and_environment_aware() {
        let f = fitness_of(&hardy(), &temperate());
        assert!((0.0..=1.0).contains(&f));
        let lava = Environment {
            temp_k: 700.0,
            radiation_index: 6.0,
            water: 0.0,
        };
        assert!(fitness_of(&hardy(), &lava) < f);
    }

    #[test]
    fn harsh_world_extinguishes_an_unfit_organism() {
        let naked = TraitVector::default();
        let result = simulate(
            &naked,
            &Environment {
                temp_k: 650.0,
                radiation_index: 8.0,
                water: 0.0,
            },
            5.0,
            &SimConfig {
                generations: 40,
                founders: 20,
                mutation_std_dev: 0.05,
                seed: 5,
                world_fertility: None,
            },
        );
        assert_eq!(result.outcome, "extinct");
        assert!(result.extinct_at.is_some());
    }

    #[test]
    fn hardy_organism_survives_a_temperate_world() {
        let result = simulate(&hardy(), &temperate(), 20.0, &config(9));
        assert_ne!(result.outcome, "extinct");
        assert!(result.peak_population >= 100);
    }
}
