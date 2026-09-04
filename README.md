# Podcast Player

A simple, minimalistic, mobile-first podcast player — installable as a PWA on
both Android and iOS.

## Structure

- `app/` — Vite + React + TypeScript PWA (deployed to GitHub Pages)
- `proxy/` — Cloudflare Worker CORS proxy for RSS feeds and the iTunes API

## Development

The app needs the proxy running locally to fetch RSS feeds (podcast hosts
generally don't send CORS headers, so the browser can't fetch them directly):

```sh
# terminal 1 — proxy
cd proxy
npm install
npm run dev   # http://localhost:8787

# terminal 2 — app
cd app
npm install
npm run dev   # reads VITE_PROXY_BASE_URL from app/.env.development
```

## Deployment

- **App → GitHub Pages** via `.github/workflows/deploy-app.yml` on push to
  `main`. One-time manual setup: repo **Settings → Pages → Source = GitHub
  Actions**. Served at `/test/` (GitHub Pages project-site path for this
  repo), which is why `vite.config.ts` sets `base: '/test/'`.
- **Proxy → Cloudflare Workers** via `.github/workflows/deploy-proxy.yml`.
  Needs a one-time `wrangler login` from a real Cloudflare account and a
  `CLOUDFLARE_API_TOKEN` repo secret before this workflow can deploy
  (`cd proxy && npx wrangler login && npx wrangler deploy` for the first
  manual deploy). Once deployed, set the repo variable
  `VITE_PROXY_BASE_URL` (Settings → Secrets and variables → Actions →
  Variables) to the resulting `*.workers.dev` URL so the app build picks
  it up.

## Status

- **Phase 1** (static shell, PWA manifest/install, basic playback +
  MediaSession + sleep timer) — done. Real-device background-audio/lock-screen
  behavior still needs manual verification on an actual phone.
- **Phase 2** (IndexedDB persistence, subscribe via arbitrary RSS URL,
  playback position + played-state) — done. Verified end-to-end against a
  local fixture feed through the proxy; verifying against real-world podcast
  RSS feeds and the deployed proxy is still worth a manual pass.
- **Phase 3** (discovery via the iTunes API — search, trending, subscribe
  from either) — done. The proxy's `/itunes/search`, `/itunes/trending`,
  `/itunes/lookup` routes are implemented against Apple's documented/
  community-known endpoint shapes but not verified against the real API (no
  outbound access to `itunes.apple.com` from the build environment); the
  app-level pipeline (parsing, Discover UI, subscribe flow) was verified
  end-to-end against local JSON fixtures standing in for those responses.
  **A real-network pass is needed** to confirm the trending endpoint's exact
  URL/shape still matches once you have normal internet access.
- **Phase 4** (offline downloads, storage persistence + usage display) —
  done. Episode audio is fetched directly from the CDN (no proxy) into a
  `Blob` stored in IndexedDB; playback prefers the local blob over the
  remote URL whenever one exists. Verified end-to-end with a real fixture
  audio file: download → reload (record persists) → block all network to
  the source host → downloaded episode still plays correctly from the blob,
  while a non-downloaded episode correctly fails with no network. Real
  podcast CDNs may behave differently (CORS support for reading response
  bytes isn't guaranteed the way plain `<audio>` playback is) — worth
  testing against a few real feeds once you have normal network access.
- Next: **Phase 5** — MediaSession/background polish and a final real-device
  pass. See the project plan for the full phased build order.
