// Single-file CORS proxy for the podcast player app.
//
// RSS feeds and the iTunes API generally don't send CORS headers, so the
// browser can't fetch them directly. This Worker fetches server-side and
// re-serves the response with CORS headers allowlisted to our own app
// origins. Audio bytes themselves never go through here -- <audio> playback
// and episode downloads talk to podcast CDNs directly (see
// app/src/player/useAudioElement.ts and the Phase 4 downloads flow).

const ALLOWED_ORIGINS = new Set([
  'https://davestevens.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

const CACHE_TTL_SECONDS = {
  rss: 15 * 60,
  itunesSearch: 60 * 60,
  itunesTrending: 6 * 60 * 60,
  itunesLookup: 6 * 60 * 60,
}

const UPSTREAM_USER_AGENT = 'PodcastPlayerProxy/1.0 (+https://github.com/davestevens/Test)'

function corsHeaders(origin: string | null): HeadersInit {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : ''
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Vary': 'Origin',
  }
}

function withCors(response: Response, origin: string | null): Response {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    headers.set(key, value)
  }
  return new Response(response.body, { status: response.status, headers })
}

// Shared fetch-and-cache helper for every route below. The cache key is a
// synthetic internal URL (not the real request), so per-origin CORS headers
// -- which vary per request -- never leak into a cached entry; withCors()
// layers them on fresh every time.
async function cachedFetch(
  cacheKeyPath: string,
  upstreamUrl: string,
  contentType: string,
  ttlSeconds: number,
  ctx: ExecutionContext,
): Promise<Response> {
  const cache = caches.default
  const cacheKey = new Request(`https://podcast-proxy-cache.internal${cacheKeyPath}`)

  const cached = await cache.match(cacheKey)
  if (cached) return cached

  let upstream: Response
  try {
    upstream = await fetch(upstreamUrl, { headers: { 'User-Agent': UPSTREAM_USER_AGENT } })
  } catch {
    return new Response('Failed to fetch upstream', { status: 502 })
  }

  if (!upstream.ok) {
    return new Response(`Upstream error: ${upstream.status}`, { status: 502 })
  }

  const body = await upstream.text()
  const response = new Response(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': `public, max-age=${ttlSeconds}`,
    },
  })

  ctx.waitUntil(cache.put(cacheKey, response.clone()))
  return response
}

function fetchRss(targetUrl: string, ctx: ExecutionContext): Promise<Response> {
  return cachedFetch(
    `/rss?url=${encodeURIComponent(targetUrl)}`,
    targetUrl,
    'application/xml; charset=utf-8',
    CACHE_TTL_SECONDS.rss,
    ctx,
  )
}

function fetchItunesSearch(term: string, ctx: ExecutionContext): Promise<Response> {
  const upstreamUrl = `https://itunes.apple.com/search?media=podcast&entity=podcast&term=${encodeURIComponent(term)}`
  return cachedFetch(
    `/itunes/search?term=${encodeURIComponent(term)}`,
    upstreamUrl,
    'application/json; charset=utf-8',
    CACHE_TTL_SECONDS.itunesSearch,
    ctx,
  )
}

// Top-podcasts chart. rss.marketingtools.apple.com (Apple's newer chart API)
// sits behind bot-protection that 403s Cloudflare Workers' fetch() outright
// -- confirmed by comparing curl (200, any User-Agent) against the exact
// same request run through workerd locally (403 regardless of headers),
// while itunes.apple.com/search succeeds through workerd fine. So this uses
// the older iTunes RSS Generator endpoint instead, which lives on
// itunes.apple.com itself (same host /search and /lookup already work
// against) and returns a different JSON shape (feed.entry[], not
// feed.results[]) -- see itunesApi.ts's mapper. genre=1310 is "Podcasts"
// (top-level chart, no genre filter). Hardcoded to the "us" storefront for v1.
function fetchItunesTrending(ctx: ExecutionContext): Promise<Response> {
  const upstreamUrl = 'https://itunes.apple.com/us/rss/toppodcasts/limit=25/genre=1310/json'
  return cachedFetch('/itunes/trending', upstreamUrl, 'application/json; charset=utf-8', CACHE_TTL_SECONDS.itunesTrending, ctx)
}

function fetchItunesLookup(id: string, ctx: ExecutionContext): Promise<Response> {
  const upstreamUrl = `https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}`
  return cachedFetch(
    `/itunes/lookup?id=${encodeURIComponent(id)}`,
    upstreamUrl,
    'application/json; charset=utf-8',
    CACHE_TTL_SECONDS.itunesLookup,
    ctx,
  )
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export default {
  async fetch(request: Request, _env: unknown, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get('Origin')
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    if (request.method !== 'GET') {
      return withCors(new Response('Method not allowed', { status: 405 }), origin)
    }

    if (url.pathname === '/rss') {
      const targetUrl = url.searchParams.get('url')
      if (!targetUrl || !isValidHttpUrl(targetUrl)) {
        return withCors(new Response('Missing or invalid "url" query parameter', { status: 400 }), origin)
      }
      return withCors(await fetchRss(targetUrl, ctx), origin)
    }

    // NOTE: the /itunes/* routes below are no longer called by the app -- it
    // now hits itunes.apple.com directly (those endpoints send CORS headers),
    // which spreads discovery load across user IPs instead of this one Worker
    // IP that Apple was 429-ing. Kept for older deployed clients; safe to
    // remove once traffic drains.
    if (url.pathname === '/itunes/search') {
      const term = url.searchParams.get('term')?.trim()
      if (!term) {
        return withCors(new Response('Missing "term" query parameter', { status: 400 }), origin)
      }
      return withCors(await fetchItunesSearch(term, ctx), origin)
    }

    if (url.pathname === '/itunes/trending') {
      return withCors(await fetchItunesTrending(ctx), origin)
    }

    if (url.pathname === '/itunes/lookup') {
      const id = url.searchParams.get('id')?.trim()
      if (!id || !/^\d+$/.test(id)) {
        return withCors(new Response('Missing or invalid "id" query parameter', { status: 400 }), origin)
      }
      return withCors(await fetchItunesLookup(id, ctx), origin)
    }

    return withCors(new Response('Not found', { status: 404 }), origin)
  },
}
