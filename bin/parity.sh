#!/usr/bin/env sh
# Cross-language parity: typescript (fixtures) vs python vs rust.
#
# The TypeScript engine is the source of truth. Run from the repo root:
#   bin/parity.sh          # python + rust (rust needs a working linker)
#   bin/parity.sh --no-rust
set -eu

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUST=1
for arg in "$@"; do
  case "$arg" in
    --no-rust) RUST=0 ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

echo "==> regenerating fixtures from the TypeScript engine"
(cd "$REPO_ROOT/packages/core" && bun scripts/gen-vectors.ts)

echo "==> python engine vs typescript fixtures"
(cd "$REPO_ROOT/python/agents" && python -m pytest tests/test_parity.py -q)

if [ "$RUST" -eq 1 ]; then
  echo "==> rust engine (skipped automatically when no linker is available)"
  (cd "$REPO_ROOT/python/agents" && python -m parity.run_parity --rust) || {
    echo "note: rust binary unavailable on this machine — run again on Linux/macOS/VS Build Tools" >&2
  }
fi

echo "==> parity OK"
