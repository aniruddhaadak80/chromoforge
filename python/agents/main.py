"""chromoforge agent service.

A small FastAPI app that runs the *heavier* deterministic work off the web
thread: batch simulations and crew briefings. It speaks plain JSON, needs no
API keys, and degrades gracefully — the Next.js app computes everything
locally too (packages/core), so this service is an accelerator and a parity
oracle, never a dependency for the demo.

Run: uvicorn main:app --reload --port 8787   (from python/agents/)
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from crew import BriefingContext, brief_crew
from sim import Environment, SimConfig, SimResult, TraitVector, simulate

app = FastAPI(title="chromoforge agent service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Health(BaseModel):
    ok: bool = True
    service: str = "agents"
    version: str = "0.1.0"


@app.get("/healthz", response_model=Health)
def healthz() -> Health:
    return Health()


class BriefRequest(BaseModel):
    seed: str = Field(min_length=1, max_length=120)
    action: str = Field(min_length=1, max_length=80)
    organism: str = Field(min_length=1, max_length=80)
    world: str = Field(min_length=1, max_length=80)
    fitness: float = Field(ge=0, le=1)
    biosafety: str = Field(pattern="^(allow|review|block)$")
    complexity: int = Field(ge=0, le=100)


@app.post("/brief")
def brief(req: BriefRequest) -> dict:
    return {
        "ok": True,
        "data": brief_crew(BriefingContext(**req.model_dump())).to_dict(),
    }


class SimRequest(BaseModel):
    traits: TraitVector
    environment: Environment
    upkeep: float = Field(ge=0)
    config: SimConfig


class BatchRequest(BaseModel):
    scenarios: list[SimRequest] = Field(min_length=1, max_length=100)


@app.post("/simulate")
def simulate_one(req: SimRequest) -> dict:
    result: SimResult = simulate(req.traits, req.environment, req.upkeep, req.config)
    return {"ok": True, "data": result.to_dict()}


@app.post("/simulate/batch")
def simulate_batch(req: BatchRequest) -> dict:
    results = [
        simulate(s.traits, s.environment, s.upkeep, s.config).to_dict()
        for s in req.scenarios
    ]
    return {"ok": True, "data": {"count": len(results), "results": results}}
