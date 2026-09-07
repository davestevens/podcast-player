import { usePlayer } from '../player/PlayerContext'
import { formatTime } from '../format'
import { Artwork } from './Artwork'

export function MiniPlayer({
  onExpand,
  liftedAboveTabBar,
}: {
  onExpand: () => void
  liftedAboveTabBar?: boolean
}) {
  const { episode, podcastTitle, isPlaying, position, duration, playbackError, togglePlay } = usePlayer()

  if (!episode) return null

  const progress = duration > 0 ? position / duration : 0

  return (
    <button
      className={`mini-player${liftedAboveTabBar ? ' mini-player--lifted' : ''}`}
      onClick={onExpand}
      aria-label="Expand player"
    >
      <div className="mini-player__progress" style={{ transform: `scaleX(${progress})` }} />
      <Artwork src={episode.artworkUrl} className="mini-player__art" />
      <div className="mini-player__info">
        <div className="mini-player__title">{episode.title}</div>
        <div className="mini-player__subtitle">
          {playbackError ? (
            <span className="mini-player__error">⚠ {playbackError}</span>
          ) : (
            <>
              {podcastTitle} · {formatTime(position)} / {formatTime(duration)}
            </>
          )}
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
