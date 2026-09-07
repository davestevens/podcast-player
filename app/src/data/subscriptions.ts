import { getDb } from './db'
import type { Podcast } from '../types'
import { deleteEpisodesForFeed, listEpisodesForFeed } from './episodes'
import { deletePlaybackState } from './playbackState'
import { deleteDownload } from './downloads'

export async function listSubscriptions(): Promise<Podcast[]> {
  const db = await getDb()
  const all = await db.getAll('subscriptions')
  return all.sort((a, b) => b.addedAt - a.addedAt)
}

export async function getSubscription(feedUrl: string): Promise<Podcast | undefined> {
  const db = await getDb()
  return db.get('subscriptions', feedUrl)
}

export async function putSubscription(podcast: Podcast): Promise<void> {
  const db = await getDb()
  await db.put('subscriptions', podcast)
}

export async function deleteSubscription(feedUrl: string): Promise<void> {
  const db = await getDb()
  await db.delete('subscriptions', feedUrl)
}

// Unsubscribing removes the podcast entirely, not just the subscription
// record -- otherwise its episodes/playback-state/downloads would be
// orphaned (unreachable but still taking up IndexedDB storage forever).
export async function unsubscribeFromFeed(feedUrl: string): Promise<void> {
  const episodes = await listEpisodesForFeed(feedUrl)
  await Promise.all(
    episodes.flatMap((episode) => [deletePlaybackState(episode.id), deleteDownload(episode.id)]),
  )
  await deleteEpisodesForFeed(feedUrl)
  await deleteSubscription(feedUrl)
}
