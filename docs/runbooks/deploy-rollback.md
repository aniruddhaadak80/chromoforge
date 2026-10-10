# Runbook — deployment rollback

## Trigger

Production (chromoforge.vercel.app) is broken after a deploy: landing page errors, `/api/*`
returns 5xx, or the OG image fails.

## Diagnose (2 min)

```bash
curl -sI https://chromoforge.vercel.app | head -1        # expect 200
curl -s https://chromoforge.vercel.app | grep -o "chromoforge" | head -1
```

Check the deploy log in the Vercel dashboard (or GitHub Actions run) for the failing gate.

## Rollback

```bash
bunx vercel ls            # find the previous good deployment URL
bunx vercel rollback      # instant traffic switch to the previous deployment
```

If the bad deploy went through GitHub Actions, revert the commit on `main` and push — the
workflow redeploys automatically.

## After rollback

1. Open an incident issue with the failing gate's log excerpt.
2. Reproduce locally: `bun run typecheck && bun run test && bun run build && bunx playwright test`.
3. Fix forward on a branch; deploy must be green before merging.
