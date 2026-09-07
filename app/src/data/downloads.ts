import { getDb } from './db'
import type { DownloadRecord, Episode } from '../types'

export async function getDownload(episodeId: string): Promise<DownloadRecord | undefined> {
  const db = await getDb()
  return db.get('downloads', episodeId)
}

// Batch read for a list of episodes -- one readonly transaction instead of
// N awaited getDownload() calls.
export async function getDownloads(
  episodeIds: string[],
): Promise<Record<string, DownloadRecord>> {
  const db = await getDb()
  const tx = db.transaction('downloads', 'readonly')
  const results = await Promise.all(episodeIds.map((id) => tx.store.get(id)))
  await tx.done
  const byId: Record<string, DownloadRecord> = {}
  episodeIds.forEach((id, i) => {
    const record = results[i]
    if (record) byId[id] = record
  })
  return byId
}

export async function listDownloads(): Promise<DownloadRecord[]> {
  const db = await getDb()
  const all = await db.getAll('downloads')
  return all.sort((a, b) => b.downloadedAt - a.downloadedAt)
}

export async function deleteDownload(episodeId: string): Promise<void> {
  const db = await getDb()
  await db.delete('downloads', episodeId)
}

// Fetches the episode's audio directly -- no proxy. <audio> playback never
// needs CORS, and reading the bytes into a Blob for offline storage relies
// on the CDN's own CORS headers (many already send permissive ones for this
// exact use case); proxying large binary audio through the Worker would risk
// its free-tier CPU/subrequest limits for no benefit. A failed fetch (CORS
// or network) surfaces as a thrown error and an 'error' status record rather
// than a speculative passthrough route -- see the plan's Phase 4 notes.
export async function downloadEpisode(episode: Episode): Promise<DownloadRecord> {
  const db = await getDb()
  try {
    const response = await fetch(episode.audioUrl)
    if (!response.ok) throw new Error(`Download failed (HTTP ${response.status})`)
    const blob = await response.blob()
    const record: DownloadRecord = {
      episodeId: episode.id,
      blob,
      mimeType: episode.audioType || blob.type || 'audio/mpeg',
      sizeBytes: blob.size,
      downloadedAt: Date.now(),
      status: 'complete',
    }
    await db.put('downloads', record)
    return record
  } catch (err) {
    const record: DownloadRecord = {
      episodeId: episode.id,
      blob: new Blob(),
      mimeType: episode.audioType || 'audio/mpeg',
      sizeBytes: 0,
      downloadedAt: Date.now(),
      status: 'error',
    }
    await db.put('downloads', record)
    throw err
  }
}
