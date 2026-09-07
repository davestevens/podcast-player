import { getDb } from './db'
import type { PlaybackState } from '../types'

export async function getPlaybackState(episodeId: string): Promise<PlaybackState | undefined> {
  const db = await getDb()
  return db.get('playbackState', episodeId)
}

// Batch read for a list of episodes -- one readonly transaction instead of
// N awaited getPlaybackState() calls (see PodcastScreen's single-paint load).
export async function getPlaybackStates(
  episodeIds: string[],
): Promise<Record<string, PlaybackState>> {
  const db = await getDb()
  const tx = db.transaction('playbackState', 'readonly')
  const results = await Promise.all(episodeIds.map((id) => tx.store.get(id)))
  await tx.done
  const byId: Record<string, PlaybackState> = {}
  episodeIds.forEach((id, i) => {
    const state = results[i]
    if (state) byId[id] = state
  })
  return byId
}

export async function putPlaybackState(state: PlaybackState): Promise<void> {
  const db = await getDb()
  await db.put('playbackState', state)
}

// Throttled position write (see player/usePositionPersistence.ts) -- merges
// into any existing record so it never clobbers the played flag.
export async function savePosition(episodeId: string, positionSec: number, durationSec?: number): Promise<void> {
  const db = await getDb()
  const existing = await db.get('playbackState', episodeId)
  await db.put('playbackState', {
    episodeId,
    positionSec,
    durationSec: durationSec ?? existing?.durationSec,
    played: existing?.played ?? false,
    lastPlayedAt: Date.now(),
  })
}

export async function deletePlaybackState(episodeId: string): Promise<void> {
  const db = await getDb()
  await db.delete('playbackState', episodeId)
}

export async function setPlayed(episodeId: string, played: boolean): Promise<void> {
  const db = await getDb()
  const existing = await db.get('playbackState', episodeId)
  await db.put('playbackState', {
    episodeId,
    positionSec: existing?.positionSec ?? 0,
    durationSec: existing?.durationSec,
    played,
    lastPlayedAt: existing?.lastPlayedAt,
  })
}
