# Quickstart — first organism in five minutes

## 1. Run it

```powershell
git clone https://github.com/aniruddhaadak80/chromoforge.git
cd chromoforge
bun install
bun run dev   # http://localhost:3000
```

No API keys. No database. No network calls at runtime.

## 2. Compose a genome

1. Open **Composer**.
2. From the shelf, add `pHeat` (heat-shock promoter), then `orfHsp` ×3 (chaperone), then a
   terminator. Watch the *derived phenotype* rail: thermotolerance climbs with saturation — the
   third chaperone adds less than the first.
3. Watch **upkeep** rise with every part; it taxes fitness later.

## 3. Screen it

Open **Safety**. The policy engine evaluates the bench live. A clean construct shows `allow`;
add a regulated part without a promoter and it drops to `review` with a remediation hint. Try
adding `orfCry` + `orfAero` together — BS-01 blocks it, and the Release Bay locks.

## 4. Release

Open **Release**. Pick a world (default TRAPPIST-1 e). Press **Request crew briefing**: the
Navigator quotes the transit window, the Xenobiologist reads the fitness estimate, the Ethicist
either clears or conditions the release. If the verdict is `hold`, the commit button is gone —
redesign first.

## 5. Watch the generations

Open **Sim**. Hit **Run simulation**. Same seed, same history — every time. Try a lava world
(55 Cancri e) with a naked organism to watch extinction; then a heat-hardened one on a temperate
world to watch it thrive.

## 6. Find your world in the sky

Open **Atlas**. Pins sit at each planet's real coordinates on a Hammer equal-area map; hover for
the derived environment. **Vault** has the full catalog with filters.
