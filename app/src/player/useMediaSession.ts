import { useEffect, useRef } from 'react'
import type { Episode } from '../types'

interface MediaSessionHandlers {
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSeekBackward: (offsetSec: number) => void
  onSeekForward: (offsetSec: number) => void
  onSeekTo: (positionSec: number) => void
}

const SEEK_STEP_SEC = 15

export function useMediaSession(
  episode: Episode | null,
  podcastTitle: string | undefined,
  handlers: MediaSessionHandlers,
) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    navigator.mediaSession.setActionHandler('play', () => handlersRef.current.onPlay())
    navigator.mediaSession.setActionHandler('pause', () => handlersRef.current.onPause())
    navigator.mediaSession.setActionHandler('stop', () => handlersRef.current.onStop())
    navigator.mediaSession.setActionHandler('seekbackward', (details) =>
      handlersRef.current.onSeekBackward(details.seekOffset ?? SEEK_STEP_SEC),
    )
    navigator.mediaSession.setActionHandler('seekforward', (details) =>
      handlersRef.current.onSeekForward(details.seekOffset ?? SEEK_STEP_SEC),
    )
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (typeof details.seekTime === 'number') {
        handlersRef.current.onSeekTo(details.seekTime)
      }
    })

    return () => {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('stop', null)
      navigator.mediaSession.setActionHandler('seekbackward', null)
      navigator.mediaSession.setActionHandler('seekforward', null)
      navigator.mediaSession.setActionHandler('seekto', null)
    }
  }, [])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    if (!episode) {
      navigator.mediaSession.metadata = null
      return
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: episode.title,
      artist: podcastTitle ?? '',
      artwork: episode.artworkUrl
        ? [{ src: episode.artworkUrl, sizes: '512x512', type: 'image/png' }]
        : [],
    })
  }, [episode, podcastTitle])
}

export function setMediaSessionPlaybackState(isPlaying: boolean) {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
}

export function setMediaSessionPositionState(duration: number, position: number, playbackRate: number) {
  if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return
  if (!Number.isFinite(duration) || duration <= 0) return
  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate,
      position: Math.min(position, duration),
    })
  } catch {
    // duration/position can transiently be inconsistent during track swaps; ignore
  }
}
