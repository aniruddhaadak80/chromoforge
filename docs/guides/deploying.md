# Deploying chromoforge

## Vercel (recommended)

```bash
bunx vercel --prod
```

`vercel.json` pins the Next.js framework preset and the `bom1` region (Mumbai, closest to the
maintainer). Push-to-main auto-deploys via `.github/workflows/deploy-vercel.yml` once these repo
secrets are set: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

Set `NEXT_PUBLIC_SITE_URL` to the deployment URL so Open Graph images resolve absolutely.

## Docker (self-hosted)

```bash
docker compose up --build
# web on :3000
```

Multi-stage build with `output: 'standalone'`, non-root user, `/healthz` healthcheck.

## Fly.io

```bash
fly launch --copy-config --region bom
fly deploy
```

`fly.toml` ships with the internal port and healthcheck configured.

## Render / Railway

`render.yaml` and `railway.json` are drop-in service definitions; both read the standard
`bun install && bun run build` pipeline and `PORT` from the platform.

## Optional: the Python agent service

The web app is fully functional without it. To run the batch/briefing accelerator:

```bash
cd services/agents
pip install -r requirements.txt
uvicorn main:app --port 8787
```
