import { useEffect, useRef } from 'react'
import type { Episode } from '../types'
import { getPlaybackState, savePosition, setPlayed } from '../data/playbackState'

const SAVE_INTERVAL_MS = 5000

// Persists playback position (throttled, not per-tick) and played-state to
// IndexedDB, and resumes a saved position once the new track's metadata has
// loaded. See the plan's "Position persistence" section for the rationale.
export function usePositionPersistence(
  audioRef: React.RefObject<HTMLAudioElement | null>,
  episode: Episode | null,
) {
  const episodeIdRef = useRef<string | null>(null)
  episodeIdRef.current = episode?.id ?? null

  const saveNow = () => {
    const audio = audioRef.current
    const episodeId = episodeIdRef.current
    if (!audio || !episodeId || !Number.isFinite(audio.currentTime)) return
    const durationSec = Number.isFinite(audio.duration) ? audio.duration : undefined
    void savePosition(episodeId, audio.currentTime, durationSec)
  }

  // Resume from a saved position once metadata for the new episode is ready.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !episode) return

    let cancelled = false
    const onLoadedMetadata = () => {
      void getPlaybackState(episode.id).then((saved) => {
        if (cancelled || !saved || saved.positionSec <= 0) return
        const current = audioRef.current
        if (current && current.duration > saved.positionSec) {
          current.currentTime = saved.positionSec
        }
      })
    }

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    return () => {
      cancelled = true
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
    }
  }, [audioRef, episode])

  // Throttled writes while playing, plus immediate writes on pause and on
  // track change/unmount (captures the position before the src swaps).
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const intervalId = window.setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) saveNow()
    }, SAVE_INTERVAL_MS)
    audio.addEventListener('pause', saveNow)

    return () => {
      window.clearInterval(intervalId)
      audio.removeEventListener('pause', saveNow)
      saveNow()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRef, episode])

  // Mark played once the episode finishes naturally.
  useEffect(() => {
    const audio = audioRef.current
    const episodeId = episode?.id
    if (!audio || !episodeId) return

    const onEnded = () => void setPlayed(episodeId, true)
    audio.addEventListener('ended', onEnded)
    return () => audio.removeEventListener('ended', onEnded)
  }, [audioRef, episode])

  // Save immediately when the tab is hidden/closed, regardless of episode churn.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveNow()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', saveNow)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', saveNow)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
