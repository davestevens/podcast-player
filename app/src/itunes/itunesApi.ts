// Normalized discovery result -- keeps DiscoverScreen ignorant of Apple's
// raw JSON shapes, which differ between the Search API and the marketing-
// tools trending feed (see the two mappers below).
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

interface ItunesTrendingResult {
  id: string
  name: string
  artistName?: string
  artworkUrl100?: string
}

interface ItunesTrendingResponse {
  feed: { results: ItunesTrendingResult[] }
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
  return data.feed.results.map(
    (result): DiscoverResult => ({
      itunesId: Number(result.id),
      title: result.name,
      artist: result.artistName,
      artworkUrl: result.artworkUrl100,
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
