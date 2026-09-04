// Single-file CORS proxy for the podcast player app.
//
// RSS feeds (and, from Phase 3, the iTunes API) generally don't send CORS
// headers, so the browser can't fetch them directly. This Worker fetches
// server-side and re-serves the response with CORS headers allowlisted to
// our own app origins. Audio bytes themselves never go through here --
// <audio> playback and episode downloads talk to podcast CDNs directly
// (see app/src/player/useAudioElement.ts and the Phase 4 downloads flow).

const ALLOWED_ORIGINS = new Set([
  'https://davestevens.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

const RSS_CACHE_TTL_SECONDS = 15 * 60

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

async function fetchRss(targetUrl: string, ctx: ExecutionContext): Promise<Response> {
  const cache = caches.default
  const cacheKey = new Request(`https://podcast-proxy-cache.internal/rss?url=${encodeURIComponent(targetUrl)}`)

  const cached = await cache.match(cacheKey)
  if (cached) return cached

  let upstream: Response
  try {
    upstream = await fetch(targetUrl, {
      headers: { 'User-Agent': 'PodcastPlayerProxy/1.0 (+https://github.com/davestevens/Test)' },
    })
  } catch {
    return new Response('Failed to fetch upstream feed', { status: 502 })
  }

  if (!upstream.ok) {
    return new Response(`Upstream error: ${upstream.status}`, { status: 502 })
  }

  const body = await upstream.text()
  const response = new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=${RSS_CACHE_TTL_SECONDS}`,
    },
  })

  ctx.waitUntil(cache.put(cacheKey, response.clone()))
  return response
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
      const response = await fetchRss(targetUrl, ctx)
      return withCors(response, origin)
    }

    return withCors(new Response('Not found', { status: 404 }), origin)
  },
}
