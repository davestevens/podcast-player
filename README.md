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
  Actions**. Served at `/podcast-player/` (GitHub Pages project-site path for this
  repo), which is why `vite.config.ts` sets `base: '/podcast-player/'`.
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
- **Phase 5** (MediaSession/background polish) — done. Added a `stop` action
  handler (pause + reset to 0) to round out the MediaSession action set
  (play/pause/stop/seekbackward/seekforward/seekto were already wired in
  Phase 1). Maskable icons and sleep-timer UI were already in place from
  earlier phases. Re-verified the full app in one pass against the
  production build (`vite build` + `vite preview`): manifest link + service
  worker registration, subscribe via RSS URL, storage usage display,
  download, `MediaSession.metadata`/`playbackState` reflecting the current
  episode, starting/cancelling a sleep timer, and Discover search/trending
  subscribe — all confirmed working together end-to-end.

## What's left (needs a real device / real network — can't be done from this build environment)

All five phases in the project plan are implemented and pass local
verification. What's genuinely outstanding, and can only be checked outside
this sandboxed build environment:

1. **Real iOS/Android hardware pass** — install to home screen, lock-screen
   media controls, backgrounding/background audio survival, and whether
   installed-PWA storage actually persists downloads over days of inactivity.
   iOS in particular has a history of being flakier here than the docs
   suggest — this is the single most important remaining check.
2. **Real RSS feeds** — subscribing was only verified against local fixture
   feeds; try a handful of real podcast RSS URLs once deployed.
3. **Real iTunes API** — the proxy's `/itunes/search`, `/itunes/trending`,
   `/itunes/lookup` routes are implemented against Apple's documented/
   community-known shapes but have never actually reached
   `itunes.apple.com` (blocked by this environment's network policy);
   confirm the trending endpoint's exact URL/shape still matches.
4. **Real podcast CDNs for downloads** — verified against a fixture audio
   file with permissive CORS; real CDNs may not all allow the direct
   `fetch()` a download needs (playback itself doesn't need CORS, only
   reading the bytes to store offline does). If a CDN blocks it, the
   download will show its error state rather than silently corrupt anything.
5. **Deploying the proxy** — needs your own Cloudflare account
   (`cd proxy && npx wrangler login && npx wrangler deploy`), then set the
   `VITE_PROXY_BASE_URL` repo variable so the GitHub Pages build points at it.
