import { getDb } from './db'
import type { PlaybackState } from '../types'

export async function getPlaybackState(episodeId: string): Promise<PlaybackState | undefined> {
  const db = await getDb()
  return db.get('playbackState', episodeId)
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
