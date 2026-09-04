import { getDb } from './db'
import type { Episode } from '../types'

export async function listEpisodesForFeed(feedUrl: string): Promise<Episode[]> {
  const db = await getDb()
  const all = await db.getAllFromIndex('episodes', 'by-feedUrl', feedUrl)
  return all.sort((a, b) => b.pubDate - a.pubDate)
}

export async function getEpisode(id: string): Promise<Episode | undefined> {
  const db = await getDb()
  return db.get('episodes', id)
}

export async function putEpisodes(episodes: Episode[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('episodes', 'readwrite')
  await Promise.all([...episodes.map((episode) => tx.store.put(episode)), tx.done])
}

export async function deleteEpisodesForFeed(feedUrl: string): Promise<void> {
  const db = await getDb()
  const keys = await db.getAllKeysFromIndex('episodes', 'by-feedUrl', feedUrl)
  const tx = db.transaction('episodes', 'readwrite')
  await Promise.all([...keys.map((key) => tx.store.delete(key)), tx.done])
}
