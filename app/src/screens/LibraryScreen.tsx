import { useEffect, useState, type FormEvent } from 'react'
import type { Podcast } from '../types'
import { listSubscriptions } from '../data/subscriptions'
import { subscribeToFeed } from '../feeds/feedFetcher'
import { PodcastCard } from '../components/PodcastCard'
import { getStorageEstimate } from '../storage'
import { formatBytes } from '../format'

export function LibraryScreen({
  onSelectPodcast,
  onOpenDownloads,
}: {
  onSelectPodcast: (feedUrl: string) => void
  onOpenDownloads: () => void
}) {
  const [subscriptions, setSubscriptions] = useState<Podcast[]>([])
  const [feedUrlInput, setFeedUrlInput] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storageUsage, setStorageUsage] = useState<string | null>(null)

  const reload = () => {
    void listSubscriptions().then(setSubscriptions)
  }

  useEffect(reload, [])

  useEffect(() => {
    void getStorageEstimate().then((estimate) => {
      if (estimate) setStorageUsage(formatBytes(estimate.usageBytes))
    })
  }, [])

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault()
    if (!feedUrlInput.trim()) return
    setIsSubscribing(true)
    setError(null)
    try {
      await subscribeToFeed(feedUrlInput)
      setFeedUrlInput('')
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe to that feed')
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <div className="screen">
      <div className="screen__header">
        <h1 className="screen__title">Library</h1>
        <button className="screen__storage" onClick={onOpenDownloads}>
          {storageUsage ? `${storageUsage} used` : 'Downloads'}
        </button>
      </div>

      <form className="subscribe-form" onSubmit={handleSubscribe}>
        <input
          type="url"
          inputMode="url"
          placeholder="Paste an RSS feed URL"
          value={feedUrlInput}
          onChange={(e) => setFeedUrlInput(e.target.value)}
        />
        <button type="submit" disabled={isSubscribing}>
          {isSubscribing ? 'Adding…' : 'Add'}
        </button>
      </form>
      {error && <div className="subscribe-form__error">{error}</div>}

      {subscriptions.length === 0 ? (
        <p className="screen__empty">No podcasts yet — paste an RSS feed URL above to subscribe.</p>
      ) : (
        <div className="podcast-list">
          {subscriptions.map((podcast) => (
            <PodcastCard
              key={podcast.feedUrl}
              podcast={podcast}
              onSelect={() => onSelectPodcast(podcast.feedUrl)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
