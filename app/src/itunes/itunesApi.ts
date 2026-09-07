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
// of Apple's newer rss.marketingtools.apple.com chart API, which 403s
// Cloudflare Workers' fetch() outright (see the proxy's fetchItunesTrending
// for why). Field names carry the feed's original "im:" namespace prefix.
interface ItunesTrendingEntry {
  'im:name': { label: string }
  'im:artist'?: { label: string }
  'im:image'?: { label: string }[]
  id: { attributes: { 'im:id': string } }
}

interface ItunesTrendingResponse {
  feed: { entry: ItunesTrendingEntry[] }
}

const PROXY_BASE_URL = import.meta.env.VITE_PROXY_BASE_URL

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
  const response = await fetch(`${PROXY_BASE_URL}/itunes/search?term=${encodeURIComponent(term)}`)
  if (!response.ok) throw new Error(`Search failed (HTTP ${response.status})`)
  const data: ItunesSearchResponse = await response.json()
  return data.results.map(mapSearchResult)
}

export async function getTrendingPodcasts(): Promise<DiscoverResult[]> {
  const response = await fetch(`${PROXY_BASE_URL}/itunes/trending`)
  if (!response.ok) throw new Error(`Failed to load trending podcasts (HTTP ${response.status})`)
  const data: ItunesTrendingResponse = await response.json()
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
  const response = await fetch(`${PROXY_BASE_URL}/itunes/lookup?id=${itunesId}`)
  if (!response.ok) throw new Error(`Lookup failed (HTTP ${response.status})`)
  const data: ItunesSearchResponse = await response.json()
  const feedUrl = data.results[0]?.feedUrl
  if (!feedUrl) throw new Error('Could not find a feed URL for this podcast')
  return feedUrl
}
