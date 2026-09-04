import type { Episode, PlaybackState } from '../types'
import { formatDate, formatTime } from '../format'

export function EpisodeRow({
  episode,
  playbackState,
  isCurrent,
  onPlay,
}: {
  episode: Episode
  playbackState: PlaybackState | undefined
  isCurrent: boolean
  onPlay: () => void
}) {
  const duration = playbackState?.durationSec ?? episode.durationSec
  const inProgress = !playbackState?.played && (playbackState?.positionSec ?? 0) > 0

  return (
    <button className="episode-row" onClick={onPlay}>
      <div className="episode-row__title">
        {episode.title}
        {isCurrent && ' 🔊'}
      </div>
      <div className="episode-row__meta">
        {formatDate(episode.pubDate)}
        {duration ? ` · ${formatTime(duration)}` : ''}
        {playbackState?.played && ' · Played'}
        {inProgress && ` · ${formatTime(playbackState?.positionSec ?? 0)} in`}
      </div>
      {episode.description && <div className="episode-row__subtitle">{episode.description}</div>}
    </button>
  )
}
