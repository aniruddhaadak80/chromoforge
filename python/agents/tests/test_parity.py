"""The Python engine must match the TypeScript reference fixtures.

Run `bun packages/core/scripts/gen-vectors.ts` first if fixtures are missing.
"""

from __future__ import annotations

import pytest
from parity.run_parity import compare, load_fixtures, run_python

FIXTURES = load_fixtures()


@pytest.mark.parametrize("fixture", FIXTURES, ids=[f["name"] for f in FIXTURES])
def test_python_engine_matches_typescript(fixture: dict) -> None:
    errors = compare(
        run_python(fixture).to_dict(), fixture["expected"], f"python/{fixture['name']}"
    )
    assert errors == []


def test_determinism_across_runs() -> None:
    fixture = FIXTURES[0]
    assert run_python(fixture).to_dict() == run_python(fixture).to_dict()
