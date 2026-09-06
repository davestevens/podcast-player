import { useEffect, useRef } from 'react'
import type { Episode } from '../types'
import { getDownload } from '../data/downloads'

// Prefers a locally downloaded blob (fully offline-capable) over the
// episode's remote URL. <audio> playback of a remote URL never needs CORS,
// so there's no "online/offline" branch elsewhere -- this is the only place
// that decides which source to play.
//
// The download lookup is async (IndexedDB), so `audio.src` isn't set until
// this effect's promise resolves -- onSourceReady lets callers (see
// PlayerContext's autoplay-intent handling) defer calling play() until
// there's actually something to play, instead of racing it.
export function useAudioElement(
  audioRef: React.RefObject<HTMLAudioElement | null>,
  episode: Episode | null,
  onSourceReady?: () => void,
) {
  const onSourceReadyRef = useRef(onSourceReady)
  onSourceReadyRef.current = onSourceReady

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
      onSourceReadyRef.current?.()
    })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [audioRef, episode])
}
