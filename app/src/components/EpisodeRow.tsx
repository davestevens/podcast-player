import type { DownloadRecord, Episode, PlaybackState } from '../types'
import { formatDate, formatTime } from '../format'
import { DownloadButton } from './DownloadButton'

export function EpisodeRow({
  episode,
  playbackState,
  downloadRecord,
  isCurrent,
  onPlay,
  onDownloadChange,
}: {
  episode: Episode
  playbackState: PlaybackState | undefined
  downloadRecord: DownloadRecord | undefined
  isCurrent: boolean
  onPlay: () => void
  onDownloadChange: () => void
}) {
  const duration = playbackState?.durationSec ?? episode.durationSec
  const inProgress = !playbackState?.played && (playbackState?.positionSec ?? 0) > 0

  return (
    <div className="episode-row">
      <button className="episode-row__main" onClick={onPlay}>
        <div className="episode-row__title">
          {episode.title}
          {isCurrent && ' 🔊'}
        </div>
        <div className="episode-row__meta">
          {formatDate(episode.pubDate)}
          {duration ? ` · ${formatTime(duration)}` : ''}
          {playbackState?.played && ' · Played'}
          {inProgress && ` · ${formatTime(playbackState?.positionSec ?? 0)} in`}
          {downloadRecord?.status === 'complete' && ' · Downloaded'}
        </div>
        {episode.description && <div className="episode-row__subtitle">{episode.description}</div>}
      </button>
      <DownloadButton episode={episode} downloadRecord={downloadRecord} onChange={onDownloadChange} />
    </div>
  )
}
