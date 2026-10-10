"""Exact Python port of the chromoforge ecology simulation.

Mirrors packages/core/src/ecology/simulate.ts (the source of truth) and
crates/ecology/src/lib.rs operation-for-operation, including the mulberry32
PRNG quirks and JavaScript's Math.round semantics — the parity harness diffs
this implementation against the TypeScript fixtures.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field, replace
from typing import Callable


def _i32(x: int) -> int:
    x &= 0xFFFFFFFF
    return x - 0x100000000 if x >= 0x80000000 else x


def _imul(a: int, b: int) -> int:
    """JavaScript Math.imul: signed 32-bit product of the low 32 bits."""
    return _i32(((a & 0xFFFFFFFF) * (b & 0xFFFFFFFF)) & 0xFFFFFFFF)


class Mulberry32:
    """Bit-for-bit match of the TypeScript mulberry32."""

    def __init__(self, seed: int) -> None:
        self.state = _i32(seed)

    def next_f64(self) -> float:
        self.state = _i32(self.state + 0x6D2B79F5)
        a = self.state
        t = _imul(a ^ ((a & 0xFFFFFFFF) >> 15), 1 | a)
        t = _i32(t + _imul(t ^ ((t & 0xFFFFFFFF) >> 7), 61 | t)) ^ t
        return ((t ^ ((t & 0xFFFFFFFF) >> 14)) & 0xFFFFFFFF) / 4294967296.0

    def gauss(self) -> float:
        a, b, c = self.next_f64(), self.next_f64(), self.next_f64()
        return (a + b + c - 1.5) * 1.1547


def _js_round(x: float) -> int:
    """JavaScript Math.round: floor(x + 0.5)."""
    floor = math.floor(x)
    return floor + 1 if x - floor >= 0.5 else floor


def _clamp01(v: float) -> float:
    return max(0.0, min(1.0, v))


@dataclass(frozen=True)
class Environment:
    temp_k: float
    radiation_index: float
    water: float


@dataclass(frozen=True)
class SimConfig:
    generations: int
    founders: int
    mutation_std_dev: float
    seed: int
    world_fertility: float | None = None


@dataclass(frozen=True)
class TraitVector:
    thermotolerance: float = 0.0
    radioresistance: float = 0.0
    photosynthetic_efficiency: float = 0.0
    osmotic_tolerance: float = 0.0
    metabolic_rate: float = 0.15
    pigmentation: float = 0.0
    spore_formation: float = 0.0
    nitrogen_fixation: float = 0.0
    toxin_production: float = 0.0


@dataclass
class GenerationPoint:
    generation: int
    population: int
    mean_fitness: float
    events: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "generation": self.generation,
            "population": self.population,
            "mean_fitness": self.mean_fitness,
            "events": list(self.events),
        }


@dataclass
class SimResult:
    history: list[GenerationPoint]
    outcome: str
    extinct_at: int | None
    peak_population: int

    def to_dict(self) -> dict:
        return {
            "history": [h.to_dict() for h in self.history],
            "outcome": self.outcome,
            "extinct_at": self.extinct_at,
            "peak_population": self.peak_population,
        }


_DEMAND: tuple[tuple[str, float, Callable[[Environment], float]], ...] = (
    ("thermotolerance", 0.45, lambda e: _clamp01((e.temp_k - 288.0) / 160.0)),
    ("radioresistance", 0.40, lambda e: _clamp01((e.radiation_index - 1.0) / 8.0)),
    ("photosynthetic_efficiency", 0.50, lambda e: _clamp01(e.water * 1.1)),
    ("osmotic_tolerance", 0.50, lambda e: _clamp01((1.0 - e.water) * 1.2)),
    ("nitrogen_fixation", 0.60, lambda e: _clamp01((1.0 - e.water) * 0.8)),
)

_AXES = (
    "thermotolerance",
    "radioresistance",
    "photosynthetic_efficiency",
    "osmotic_tolerance",
    "metabolic_rate",
    "pigmentation",
    "spore_formation",
    "nitrogen_fixation",
    "toxin_production",
)


def fitness_of(traits: TraitVector, env: Environment) -> float:
    total = 0.0
    weight = 0.0
    for axis, tolerance, demand_of in _DEMAND:
        demand = demand_of(env)
        importance = 0.4 + demand * 0.6
        mismatch = abs(getattr(traits, axis) - demand) / max(
            tolerance, 2.220446049250313e-16
        )
        total += (1.0 - _clamp01(mismatch)) * importance
        weight += importance
    vitality = _clamp01(1.0 - max(0.0, traits.metabolic_rate - 0.5) * 0.8)
    return _clamp01(total / weight * vitality)


def simulate(
    traits: TraitVector, env: Environment, upkeep: float, config: SimConfig
) -> SimResult:
    rng = Mulberry32(config.seed)
    maintenance = upkeep / 100.0
    fertility = (
        config.world_fertility
        if config.world_fertility is not None
        else _clamp01(env.water * 1.2 + 0.05)
    )
    # TS: Math.max(10, Math.round(founders * 60 * fertility))
    carrying = max(10, _js_round(config.founders * 60 * fertility))

    traits = replace(traits)
    population = config.founders
    history: list[GenerationPoint] = []
    extinct_at: int | None = None
    peak_population = population
    stagnant = 0

    for gen in range(config.generations + 1):
        if population < 1:
            extinct_at = gen
            history.append(GenerationPoint(gen, 0, 0.0, ["Colony extinct."]))
            break

        fitness = fitness_of(traits, env) * _clamp01(1.0 - maintenance * 0.7)
        events: list[str] = []

        r = max(0.0, (fitness - 0.25) * 3.2)
        population = _js_round(
            population + r * population * (1 - population / carrying)
        )
        peak_population = max(peak_population, population)

        if fitness < 0.3 and population < config.founders / 2:
            events.append("Mass die-off: traits barely meet the world.")
        if env.radiation_index > 2.0 and traits.radioresistance > 0.4:
            events.append("Radiation-resistant strains sweep the population.")
        if env.temp_k > 400.0 and traits.thermotolerance > 0.35:
            events.append("Hyperthermophilic clade dominates.")
        if env.temp_k < 250.0 and traits.spore_formation > 0.3:
            events.append("Population enters spore dormancy through the long winter.")
        if rng.next_f64() < 0.02:
            events.append("Beneficial mutation resolves in a fitter subpopulation.")

        history.append(GenerationPoint(gen, population, round(fitness, 4), events))

        # selection + mutation for the next generation — RNG draw order must
        # match the TypeScript engine exactly
        for axis in _AXES:
            pull = 0.0
            for demand_axis, _tolerance, demand_of in _DEMAND:
                if demand_axis == axis:
                    pull = (demand_of(env) - getattr(traits, axis)) * 0.08
                    break
            drift = rng.gauss() * config.mutation_std_dev * 0.05
            object.__setattr__(
                traits, axis, _clamp01(getattr(traits, axis) + drift + pull)
            )

        stagnant = stagnant + 1 if fitness < 0.28 else 0
        if stagnant >= 6:
            extinct_at = gen + 1
            history.append(
                GenerationPoint(
                    gen + 1,
                    0,
                    float(fitness),  # TS pushes the raw (unrounded) fitness here
                    ["Sustained sub-lethal fitness; the colony fades."],
                )
            )
            break

    last = history[-1]
    if last.population == 0:
        outcome = "extinct"
    elif last.mean_fitness > 0.55 and last.population > carrying * 0.25:
        outcome = "thriving"
    else:
        outcome = "surviving"

    return SimResult(history, outcome, extinct_at, peak_population)
