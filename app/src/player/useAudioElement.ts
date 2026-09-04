import { useEffect } from 'react'
import type { Episode } from '../types'
import { getDownload } from '../data/downloads'

// Prefers a locally downloaded blob (fully offline-capable) over the
// episode's remote URL. <audio> playback of a remote URL never needs CORS,
// so there's no "online/offline" branch elsewhere -- this is the only place
// that decides which source to play.
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

    let cancelled = false
    let objectUrl: string | null = null

    void getDownload(episode.id).then((download) => {
      if (cancelled || !audioRef.current) return
      if (download?.status === 'complete') {
        objectUrl = URL.createObjectURL(download.blob)
        audioRef.current.src = objectUrl
      } else {
        audioRef.current.src = episode.audioUrl
      }
      audioRef.current.load()
    })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [audioRef, episode])
}
