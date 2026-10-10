# Runbook — cutting a release

1. All gates green locally **and** on `main` CI.
2. `bun scripts/loc-count.mjs` — record the numbers for the release notes.
3. Tag and push: `git tag v0.2.0 && git push origin v0.2.0`.
4. The `release.yml` workflow builds the changelog from Conventional Commits and drafts the
   GitHub Release. Review, add highlights, publish.
5. Confirm the live URL matches the tag (deploy-vercel.yml runs on the tag push).
6. Announce: the DEV post template lives in the maintainer's blog workspace; link the release,
   the live URL, and one screenshot from `public/images/screens/`.
