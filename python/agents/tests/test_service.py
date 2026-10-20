"""API contract tests for the agent service."""

from __future__ import annotations

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_healthz() -> None:
    res = client.get("/healthz")
    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True
    assert body["service"] == "agents"


def test_brief_is_deterministic_and_blocks_on_policy() -> None:
    payload = {
        "seed": "mission-7",
        "action": "release",
        "organism": "Bad Idea",
        "world": "TRAPPIST-1 e",
        "fitness": 0.8,
        "biosafety": "block",
        "complexity": 3,
    }
    first = client.post("/brief", json=payload).json()["data"]
    second = client.post("/brief", json=payload).json()["data"]
    assert first == second
    assert first["recommendation"] == "hold"
    assert any(step["state"] == "dissenting" for step in first["steps"])


def test_brief_proceeds_when_clean() -> None:
    payload = {
        "seed": "mission-9",
        "action": "release",
        "organism": "Pioneer Strain a",
        "world": "Kepler-442 b",
        "fitness": 0.6,
        "biosafety": "allow",
        "complexity": 4,
    }
    body = client.post("/brief", json=payload).json()["data"]
    assert body["recommendation"] == "proceed"
    assert body["conditions"] == []


def test_brief_rejects_bad_biosafety_value() -> None:
    payload = {
        "seed": "x",
        "action": "release",
        "organism": "X",
        "world": "Y",
        "fitness": 0.5,
        "biosafety": "maybe",
        "complexity": 1,
    }
    assert client.post("/brief", json=payload).status_code == 422


def test_simulate_single_and_batch() -> None:
    scenario = {
        "traits": {
            "thermotolerance": 0.55,
            "radioresistance": 0.5,
            "photosynthetic_efficiency": 0.4,
            "osmotic_tolerance": 0.1,
            "metabolic_rate": 0.5,
            "pigmentation": 0.2,
            "spore_formation": 0.0,
            "nitrogen_fixation": 0.0,
            "toxin_production": 0.0,
        },
        "environment": {"temp_k": 300.0, "radiation_index": 1.5, "water": 0.6},
        "upkeep": 20.0,
        "config": {
            "generations": 60,
            "founders": 100,
            "mutation_std_dev": 0.4,
            "seed": 7331,
            "world_fertility": None,
        },
    }
    single = client.post("/simulate", json=scenario).json()["data"]
    assert single["outcome"] in {"thriving", "surviving", "extinct"}
    assert len(single["history"]) > 10

    batch = client.post(
        "/simulate/batch", json={"scenarios": [scenario, scenario]}
    ).json()["data"]
    assert batch["count"] == 2
    assert batch["results"][0] == single
