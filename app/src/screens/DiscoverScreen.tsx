import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { DiscoverResult } from '../itunes/itunesApi'
import { getTrendingPodcasts, resolveFeedUrl, searchPodcasts } from '../itunes/itunesApi'
import { subscribeToFeed } from '../feeds/feedFetcher'
import { Artwork } from '../components/Artwork'

export function DiscoverScreen() {
  const [term, setTerm] = useState('')
  const [trending, setTrending] = useState<DiscoverResult[]>([])
  const [searchResults, setSearchResults] = useState<DiscoverResult[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [subscribingId, setSubscribingId] = useState<number | null>(null)
  const [subscribedIds, setSubscribedIds] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  // Guards against overlapping searches (debounced typing + an explicit
  // submit) fanning out concurrent requests to iTunes.
  const inFlightTerm = useRef<string | null>(null)

  useEffect(() => {
    void getTrendingPodcasts()
      .then(setTrending)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load trending podcasts'))
  }, [])

  const runSearch = async (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      setSearchResults(null)
      return
    }
    if (inFlightTerm.current === trimmed) return
    inFlightTerm.current = trimmed
    setIsSearching(true)
    setError(null)
    try {
      const results = await searchPodcasts(trimmed)
      // Ignore a stale response if the query moved on while we waited.
      if (term.trim() === trimmed) setSearchResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      inFlightTerm.current = null
      setIsSearching(false)
    }
  }

  // Trailing debounce so each keystroke doesn't hit the API.
  useEffect(() => {
    const trimmed = term.trim()
    if (!trimmed) {
      setSearchResults(null)
      return
    }
    const id = setTimeout(() => void runSearch(trimmed), 400)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    void runSearch(term)
  }

  const handleSubscribe = async (result: DiscoverResult) => {
    setSubscribingId(result.itunesId)
    setError(null)
    try {
      const feedUrl = result.feedUrl ?? (await resolveFeedUrl(result.itunesId))
      await subscribeToFeed(feedUrl)
      setSubscribedIds((prev) => new Set(prev).add(result.itunesId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe')
    } finally {
      setSubscribingId(null)
    }
  }

  const listToShow = searchResults ?? trending

  return (
    <div className="screen">
      <h1 className="screen__title">Discover</h1>

      <form className="subscribe-form" onSubmit={handleSearch}>
        <input
          type="search"
          placeholder="Search podcasts"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <button type="submit" disabled={isSearching}>
          {isSearching ? 'Searching…' : 'Search'}
        </button>
      </form>
      {error && <div className="subscribe-form__error">{error}</div>}

      {!searchResults && <h2 className="screen__subheading">Trending</h2>}

      {listToShow.length === 0 ? (
        <p className="screen__empty">{searchResults ? 'No results.' : 'Loading trending podcasts…'}</p>
      ) : (
        <div className="podcast-list">
          {listToShow.map((result) => {
            const isSubscribed = subscribedIds.has(result.itunesId)
            return (
              <div key={result.itunesId} className="discover-card">
                <Artwork src={result.artworkUrl} className="discover-card__art" />
                <div className="discover-card__info">
                  <div className="podcast-card__title">{result.title}</div>
                  {result.artist && <div className="podcast-card__subtitle">{result.artist}</div>}
                </div>
                <button
                  className="discover-card__subscribe"
                  disabled={isSubscribed || subscribingId === result.itunesId}
                  onClick={() => handleSubscribe(result)}
                >
                  {isSubscribed ? 'Added' : subscribingId === result.itunesId ? 'Adding…' : 'Add'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
