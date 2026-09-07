import type { PlaybackState } from '../types'
import { setPlayed } from '../data/playbackState'

export function PlayedToggle({
  episodeId,
  playbackState,
  onChange,
}: {
  episodeId: string
  playbackState: PlaybackState | undefined
  onChange: () => void
}) {
  const isPlayed = playbackState?.played ?? false

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await setPlayed(episodeId, !isPlayed)
    onChange()
  }

  return (
    <button
      className={`played-toggle${isPlayed ? ' played-toggle--played' : ''}`}
      onClick={handleClick}
      aria-label={isPlayed ? 'Mark as unplayed' : 'Mark as played'}
      title={isPlayed ? 'Mark as unplayed' : 'Mark as played'}
    >
      {isPlayed ? '✓' : '○'}
    </button>
  )
}
