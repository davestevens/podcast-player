// Normalized discovery result -- keeps DiscoverScreen ignorant of Apple's
// raw JSON shapes, which differ between the Search API and the legacy RSS
// Generator trending endpoint (see the two mappers below).
export interface DiscoverResult {
  itunesId: number
  title: string
  artist?: string
  artworkUrl?: string
  // Present for search/lookup results; absent for trending results, which
  // only carry an iTunes id -- resolveFeedUrl() fills this in on demand.
  feedUrl?: string
}

interface ItunesSearchResult {
  collectionId: number
  collectionName: string
  artistName?: string
  feedUrl?: string
  artworkUrl600?: string
  artworkUrl100?: string
}

interface ItunesSearchResponse {
  results: ItunesSearchResult[]
}

// The old iTunes RSS Generator's JSON shape (feed.entry[]) -- used instead
// of Apple's newer rss.marketingtools.apple.com chart API. Field names carry
// the feed's original "im:" namespace prefix.
interface ItunesTrendingEntry {
  'im:name': { label: string }
  'im:artist'?: { label: string }
  'im:image'?: { label: string }[]
  id: { attributes: { 'im:id': string } }
}

interface ItunesTrendingResponse {
  feed: { entry: ItunesTrendingEntry[] }
}

// iTunes' Search/Lookup APIs and the legacy RSS-generator chart endpoint all
// send `Access-Control-Allow-Origin: *`, so we call them straight from the
// browser rather than via our CORS proxy. Going direct spreads requests
// across every user's own IP instead of funnelling the whole userbase
// through one Cloudflare Worker egress IP, which Apple was rate-limiting
// (429s). RSS feeds still need the proxy -- see feeds/feedFetcher.ts.
const ITUNES_BASE = 'https://itunes.apple.com'

const RATE_LIMIT_MESSAGE = 'iTunes is rate-limiting discovery right now — try again in a moment.'

// Small per-session cache so re-opening Discover or repeating a search
// doesn't re-hit Apple. Also doubles as a stale fallback when a request
// fails (e.g. a 429). Keyed by full URL.
const CACHE_TTL_MS = 30 * 60 * 1000

interface CacheEntry<T> {
  at: number
  data: T
}

function cacheKey(url: string): string {
  return `itunes-cache:${url}`
}

function readCache<T>(url: string): CacheEntry<T> | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(url))
    return raw ? (JSON.parse(raw) as CacheEntry<T>) : null
  } catch {
    return null
  }
}

function writeCache<T>(url: string, data: T): void {
  try {
    sessionStorage.setItem(cacheKey(url), JSON.stringify({ at: Date.now(), data }))
  } catch {
    // sessionStorage full or unavailable -- caching is best-effort.
  }
}

// Fetch JSON with a session cache in front and a stale-on-failure fallback.
async function fetchJson<T>(url: string): Promise<T> {
  const cached = readCache<T>(url)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      if (cached) return cached.data
      throw new Error(response.status === 429 ? RATE_LIMIT_MESSAGE : `Request failed (HTTP ${response.status})`)
    }
    const data = (await response.json()) as T
    writeCache(url, data)
    return data
  } catch (err) {
    if (cached) return cached.data
    if (err instanceof Error && err.message === RATE_LIMIT_MESSAGE) throw err
    throw new Error(RATE_LIMIT_MESSAGE)
  }
}

function mapSearchResult(result: ItunesSearchResult): DiscoverResult {
  return {
    itunesId: result.collectionId,
    title: result.collectionName,
    artist: result.artistName,
    artworkUrl: result.artworkUrl600 ?? result.artworkUrl100,
    feedUrl: result.feedUrl,
  }
}

export async function searchPodcasts(term: string): Promise<DiscoverResult[]> {
  const url = `${ITUNES_BASE}/search?media=podcast&entity=podcast&term=${encodeURIComponent(term)}`
  const data = await fetchJson<ItunesSearchResponse>(url)
  return data.results.map(mapSearchResult)
}

export async function getTrendingPodcasts(): Promise<DiscoverResult[]> {
  const url = `${ITUNES_BASE}/us/rss/toppodcasts/limit=25/genre=1310/json`
  const data = await fetchJson<ItunesTrendingResponse>(url)
  return data.feed.entry.map(
    (entry): DiscoverResult => ({
      itunesId: Number(entry.id.attributes['im:id']),
      title: entry['im:name'].label,
      artist: entry['im:artist']?.label,
      // im:image entries are ordered smallest-to-largest; take the largest.
      artworkUrl: entry['im:image']?.at(-1)?.label,
    }),
  )
}

// Trending results have no feedUrl -- resolve one via an iTunes lookup by id
// before subscribing.
export async function resolveFeedUrl(itunesId: number): Promise<string> {
  const url = `${ITUNES_BASE}/lookup?id=${itunesId}`
  const data = await fetchJson<ItunesSearchResponse>(url)
  const feedUrl = data.results[0]?.feedUrl
  if (!feedUrl) throw new Error('Could not find a feed URL for this podcast')
  return feedUrl
}
