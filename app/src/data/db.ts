import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Podcast, Episode, PlaybackState, DownloadRecord } from '../types'

interface PodcastPlayerDB extends DBSchema {
  subscriptions: {
    key: string // feedUrl
    value: Podcast
  }
  episodes: {
    key: string // episode id
    value: Episode
    indexes: { 'by-feedUrl': string; 'by-pubDate': number }
  }
  playbackState: {
    key: string // episodeId
    value: PlaybackState
  }
  downloads: {
    key: string // episodeId
    value: DownloadRecord
  }
}

let dbPromise: Promise<IDBPDatabase<PodcastPlayerDB>> | null = null

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<PodcastPlayerDB>('podcast-player', 1, {
      upgrade(db) {
        db.createObjectStore('subscriptions', { keyPath: 'feedUrl' })

        const episodes = db.createObjectStore('episodes', { keyPath: 'id' })
        episodes.createIndex('by-feedUrl', 'feedUrl')
        episodes.createIndex('by-pubDate', 'pubDate')

        db.createObjectStore('playbackState', { keyPath: 'episodeId' })

        // Unused until Phase 4, created now so the schema never needs a
        // version bump for it.
        db.createObjectStore('downloads', { keyPath: 'episodeId' })
      },
    })
  }
  return dbPromise
}
