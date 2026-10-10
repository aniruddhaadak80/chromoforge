# crates/ecology — the Rust reference engine

A zero-dependency Rust implementation of the chromoforge ecology simulation. It exists to keep
the TypeScript engine honest: same algorithm, same PRNG stream, same rounding semantics,
diffed against fixtures generated from the TS source of truth.

## Build & verify

```bash
cargo check --tests        # works with rustc alone — the Windows-without-MSVC path
cargo test                 # full test suite (Linux/macOS/VS Build Tools)
```

On Windows without Visual Studio Build Tools, linking the test binary fails (`_tls_used` needs the
real MSVC CRT objects). We refuse to fake C-runtime stubs; verify locally with
`cargo check --tests` and rely on CI (ubuntu-latest) for `cargo test`. See `.cargo/config.toml`.

## CLI

```bash
cargo run --release
# reads scenario JSON on stdin, writes the simulation result on stdout
echo '{"traits":{"thermotolerance":0.55,...},"environment":{"temp_k":300,"radiation_index":1.5,"water":0.6},"upkeep":20,"config":{"generations":60,"founders":100,"mutation_std_dev":0.4,"seed":7331}}' | cargo run --release
```

The JSON reader/writer is hand-rolled (no serde) so the crate compiles anywhere rustc does.

## Parity contract

- mulberry32 mirrors JS bit-for-bit, including `Math.imul` wrapping and `ToInt32(t + inner)`.
- Population updates use JS `Math.round`: floor(x + 0.5), which differs from Rust's
  round-half-away-from-zero on negatives.
- Extinction entries carry the *raw* fitness; per-generation entries are rounded to 4 decimals.
- Carrying capacity is `max(10, round(founders × 60 × fertility))`.
