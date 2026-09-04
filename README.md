# Podcast Player

A simple, minimalistic, mobile-first podcast player — installable as a PWA on
both Android and iOS.

## Structure

- `app/` — Vite + React + TypeScript PWA (deployed to GitHub Pages)
- `proxy/` — Cloudflare Worker CORS proxy for RSS feeds and the iTunes API (added in Phase 2)

## Development

```sh
cd app
npm install
npm run dev
```

## Deployment

- The app deploys to GitHub Pages via `.github/workflows/deploy-app.yml` on
  push to `main`. One-time manual setup: repo **Settings → Pages → Source =
  GitHub Actions**.
- Served at `/test/` (GitHub Pages project-site path for this repo), which is
  why `vite.config.ts` sets `base: '/test/'`.

## Status

Phase 1 (static shell, PWA manifest/install, basic playback + MediaSession +
sleep timer against hardcoded episodes) is in progress. See project plan for
the full phased build order.
