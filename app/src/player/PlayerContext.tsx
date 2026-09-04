import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Episode } from '../types'
import { useAudioElement } from './useAudioElement'
import {
  setMediaSessionPlaybackState,
  setMediaSessionPositionState,
  useMediaSession,
} from './useMediaSession'
import { useSleepTimer, type SleepTimerMode } from './useSleepTimer'

const SEEK_STEP_SEC = 15

interface PlayerValue {
  episode: Episode | null
  podcastTitle: string | undefined
  isPlaying: boolean
  position: number
  duration: number
  loadEpisode: (episode: Episode, podcastTitle?: string) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  seek: (positionSec: number) => void
  skip: (deltaSec: number) => void
  sleepTimer: {
    mode: SleepTimerMode
    remainingSec: number | null
    startPreset: (minutes: number) => void
    startEndOfEpisode: () => void
    cancel: () => void
  }
}

const PlayerCtx = createContext<PlayerValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [podcastTitle, setPodcastTitle] = useState<string | undefined>(undefined)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)

  useAudioElement(audioRef, episode)

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {
      // Autoplay can be rejected by the browser (e.g. no prior user gesture);
      // isPlaying stays in sync via the element's own 'pause' event.
    })
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) pause()
    else play()
  }, [isPlaying, pause, play])

  const seek = useCallback((positionSec: number) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration)) return
    audio.currentTime = Math.max(0, Math.min(positionSec, audio.duration))
  }, [])

  const skip = useCallback(
    (deltaSec: number) => {
      const audio = audioRef.current
      if (!audio) return
      seek(audio.currentTime + deltaSec)
    },
    [seek],
  )

  const sleepTimer = useSleepTimer(pause)

  const loadEpisode = useCallback((nextEpisode: Episode, nextPodcastTitle?: string) => {
    setEpisode(nextEpisode)
    setPodcastTitle(nextPodcastTitle)
    setPosition(0)
    setDuration(0)
  }, [])

  // Wait for loadedmetadata before honoring a saved resume position (set on
  // audio.currentTime any earlier is unreliable across browsers). Phase 1 has
  // no persisted position yet; this is the hook point Phase 2 wires into.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoadedMetadata = () => setDuration(audio.duration || 0)
    const onTimeUpdate = () => {
      setPosition(audio.currentTime)
      setMediaSessionPositionState(audio.duration || 0, audio.currentTime, audio.playbackRate)
    }
    const onPlay = () => {
      setIsPlaying(true)
      setMediaSessionPlaybackState(true)
    }
    const onPause = () => {
      setIsPlaying(false)
      setMediaSessionPlaybackState(false)
    }
    const onEnded = () => {
      setIsPlaying(false)
      sleepTimer.notifyEpisodeEnded()
    }

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode])

  useMediaSession(episode, podcastTitle, {
    onPlay: play,
    onPause: pause,
    onSeekBackward: (offset) => skip(-offset),
    onSeekForward: (offset) => skip(offset),
    onSeekTo: seek,
  })

  const value = useMemo<PlayerValue>(
    () => ({
      episode,
      podcastTitle,
      isPlaying,
      position,
      duration,
      loadEpisode,
      play,
      pause,
      togglePlay,
      seek,
      skip,
      sleepTimer: {
        mode: sleepTimer.mode,
        remainingSec: sleepTimer.remainingSec,
        startPreset: sleepTimer.startPreset,
        startEndOfEpisode: sleepTimer.startEndOfEpisode,
        cancel: sleepTimer.cancel,
      },
    }),
    [
      episode,
      podcastTitle,
      isPlaying,
      position,
      duration,
      loadEpisode,
      play,
      pause,
      togglePlay,
      seek,
      skip,
      sleepTimer.mode,
      sleepTimer.remainingSec,
      sleepTimer.startPreset,
      sleepTimer.startEndOfEpisode,
      sleepTimer.cancel,
    ],
  )

  return (
    <PlayerCtx.Provider value={value}>
      <audio ref={audioRef} preload="metadata" />
      {children}
    </PlayerCtx.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerCtx)
  if (!ctx) throw new Error('usePlayer must be used within a PlayerProvider')
  return ctx
}

export const SKIP_STEP_SEC = SEEK_STEP_SEC
