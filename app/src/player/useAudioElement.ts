import { useEffect } from 'react'
import type { Episode } from '../types'

// Phase 1: plays the episode's remote URL directly. Phase 4 will extend this
// to prefer a locally downloaded blob when one exists (see data/downloads.ts).
export function getAudioSrc(episode: Episode): string {
  return episode.audioUrl
}

export function useAudioElement(
  audioRef: React.RefObject<HTMLAudioElement | null>,
  episode: Episode | null,
) {
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!episode) {
      audio.removeAttribute('src')
      audio.load()
      return
    }

    audio.src = getAudioSrc(episode)
    audio.load()
  }, [audioRef, episode])
}
