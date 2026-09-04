import { useEffect, useState, type FormEvent } from 'react'
import type { DiscoverResult } from '../itunes/itunesApi'
import { getTrendingPodcasts, resolveFeedUrl, searchPodcasts } from '../itunes/itunesApi'
import { subscribeToFeed } from '../feeds/feedFetcher'

export function DiscoverScreen() {
  const [term, setTerm] = useState('')
  const [trending, setTrending] = useState<DiscoverResult[]>([])
  const [searchResults, setSearchResults] = useState<DiscoverResult[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [subscribingId, setSubscribingId] = useState<number | null>(null)
  const [subscribedIds, setSubscribedIds] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void getTrendingPodcasts()
      .then(setTrending)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load trending podcasts'))
  }, [])

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = term.trim()
    if (!trimmed) {
      setSearchResults(null)
      return
    }
    setIsSearching(true)
    setError(null)
    try {
      setSearchResults(await searchPodcasts(trimmed))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsSearching(false)
    }
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
