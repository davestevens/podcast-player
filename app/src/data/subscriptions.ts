import { getDb } from './db'
import type { Podcast } from '../types'

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
