import { parseFeed } from './rssParser'
import { getSubscription, putSubscription } from '../data/subscriptions'
import { putEpisodes } from '../data/episodes'
import type { Podcast } from '../types'

const PROXY_BASE_URL = import.meta.env.VITE_PROXY_BASE_URL

// Fetches a feed through the CORS proxy, parses it, and upserts the
// subscription + its episodes into IndexedDB. Used both to subscribe to a
// new feed and to refresh an existing one (calling it again just updates
// lastFetchedAt and re-upserts).
export async function subscribeToFeed(feedUrl: string): Promise<Podcast> {
  const normalizedUrl = feedUrl.trim()

  const response = await fetch(`${PROXY_BASE_URL}/rss?url=${encodeURIComponent(normalizedUrl)}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch feed (HTTP ${response.status})`)
  }
  const xmlText = await response.text()

  const { podcast: parsed, episodes } = parseFeed(xmlText, normalizedUrl)

  const existing = await getSubscription(normalizedUrl)
  const podcast: Podcast = {
    ...parsed,
    addedAt: existing?.addedAt ?? Date.now(),
    lastFetchedAt: Date.now(),
  }

  await putSubscription(podcast)
  await putEpisodes(episodes)

  return podcast
}
