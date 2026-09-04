import { usePlayer } from '../player/PlayerContext'
import { formatTime } from '../format'

export function MiniPlayer({ onExpand }: { onExpand: () => void }) {
  const { episode, podcastTitle, isPlaying, position, duration, togglePlay } = usePlayer()

  if (!episode) return null

  const progress = duration > 0 ? position / duration : 0

  return (
    <button className="mini-player" onClick={onExpand} aria-label="Expand player">
      <div className="mini-player__progress" style={{ transform: `scaleX(${progress})` }} />
      <div className="mini-player__info">
        <div className="mini-player__title">{episode.title}</div>
        <div className="mini-player__subtitle">
          {podcastTitle} · {formatTime(position)} / {formatTime(duration)}
        </div>
      </div>
      <div
        className="mini-player__play"
        role="button"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        onClick={(e) => {
          e.stopPropagation()
          togglePlay()
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </div>
    </button>
  )
}
