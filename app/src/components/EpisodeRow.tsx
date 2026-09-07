import type { DownloadRecord, Episode, PlaybackState } from '../types'
import { formatDate, formatTime } from '../format'
import { DownloadButton } from './DownloadButton'
import { PlayedToggle } from './PlayedToggle'
import { sanitizeDescriptionHtml } from '../sanitize'

export function EpisodeRow({
  episode,
  playbackState,
  downloadRecord,
  isCurrent,
  onPlay,
  onDownloadChange,
  onPlayedChange,
  podcastTitle,
}: {
  episode: Episode
  playbackState: PlaybackState | undefined
  downloadRecord: DownloadRecord | undefined
  isCurrent: boolean
  onPlay: () => void
  onDownloadChange: () => void
  onPlayedChange: () => void
  // Shown above the episode title -- only useful in cross-podcast lists
  // (e.g. DownloadsScreen); PodcastScreen already has the podcast title in
  // its own header, so it leaves this unset.
  podcastTitle?: string
}) {
  const duration = playbackState?.durationSec ?? episode.durationSec
  const isPlayed = playbackState?.played ?? false
  const inProgress = !isPlayed && (playbackState?.positionSec ?? 0) > 0

  return (
    <div className="episode-row">
      <button
        className={`episode-row__main${isPlayed ? ' episode-row__main--played' : ''}`}
        onClick={onPlay}
      >
        {podcastTitle && <div className="episode-row__podcast">{podcastTitle}</div>}
        <div className="episode-row__title">
          {episode.title}
          {isCurrent && ' 🔊'}
        </div>
        <div className="episode-row__meta">
          {formatDate(episode.pubDate)}
          {duration ? ` · ${formatTime(duration)}` : ''}
          {isPlayed && ' · Played'}
          {inProgress && ` · ${formatTime(playbackState?.positionSec ?? 0)} in`}
          {downloadRecord?.status === 'complete' && ' · Downloaded'}
        </div>
        {episode.description && (
          <div
            className="episode-row__subtitle"
            dangerouslySetInnerHTML={{ __html: sanitizeDescriptionHtml(episode.description) }}
          />
        )}
      </button>
      <PlayedToggle episodeId={episode.id} playbackState={playbackState} onChange={onPlayedChange} />
      <DownloadButton episode={episode} downloadRecord={downloadRecord} onChange={onDownloadChange} />
    </div>
  )
}
