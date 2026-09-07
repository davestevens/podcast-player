import { useEffect, useState } from 'react'
import type { DownloadRecord, Episode, PlaybackState } from '../types'
import { listDownloads } from '../data/downloads'
import { getEpisode } from '../data/episodes'
import { getSubscription } from '../data/subscriptions'
import { getPlaybackState } from '../data/playbackState'
import { usePlayer } from '../player/PlayerContext'
import { EpisodeRow } from '../components/EpisodeRow'
import { DescriptionSheet } from '../components/DescriptionSheet'
import { formatBytes, formatDate } from '../format'

interface DownloadedEpisode {
  episode: Episode
  podcastTitle: string | undefined
  download: DownloadRecord
  playbackState: PlaybackState | undefined
}

export function DownloadsScreen({ onBack }: { onBack: () => void }) {
  const { episode: currentEpisode, loadEpisode } = usePlayer()
  const [items, setItems] = useState<DownloadedEpisode[]>([])
  const [loaded, setLoaded] = useState(false)
  const [detailsEpisode, setDetailsEpisode] = useState<Episode | null>(null)

  const reload = async () => {
    const downloads = await listDownloads()
    const complete = downloads.filter((d) => d.status === 'complete')

    const resolved = await Promise.all(
      complete.map(async (download): Promise<DownloadedEpisode | null> => {
        const episode = await getEpisode(download.episodeId)
        if (!episode) return null // orphaned record (shouldn't normally happen -- unsubscribe cascades)
        const [podcast, playbackState] = await Promise.all([
          getSubscription(episode.feedUrl),
          getPlaybackState(episode.id),
        ])
        return { episode, podcastTitle: podcast?.title, download, playbackState }
      }),
    )

    setItems(resolved.filter((item): item is DownloadedEpisode => item !== null))
    setLoaded(true)
  }

  useEffect(() => {
    void reload()
  }, [])

  const totalBytes = items.reduce((sum, item) => sum + item.download.sizeBytes, 0)

  return (
    <div className="screen">
      <button className="screen__back" onClick={onBack}>
        ← Library
      </button>

      <div className="screen__header">
        <h1 className="screen__title">Downloads</h1>
        {items.length > 0 && <span className="screen__storage">{formatBytes(totalBytes)}</span>}
      </div>

      {loaded && items.length === 0 ? (
        <p className="screen__empty">No downloaded episodes yet.</p>
      ) : (
        <ul className="episode-list">
          {items.map(({ episode, podcastTitle, download, playbackState }) => (
            <li key={episode.id}>
              <EpisodeRow
                episode={episode}
                playbackState={playbackState}
                downloadRecord={download}
                podcastTitle={podcastTitle}
                isCurrent={currentEpisode?.id === episode.id}
                onPlay={() => loadEpisode(episode, podcastTitle, { autoplay: true })}
                onDownloadChange={() => void reload()}
                onPlayedChange={() => void reload()}
                onOpenDetails={() => setDetailsEpisode(episode)}
              />
            </li>
          ))}
        </ul>
      )}

      {detailsEpisode && (
        <DescriptionSheet
          title={detailsEpisode.title}
          meta={formatDate(detailsEpisode.pubDate)}
          html={detailsEpisode.contentHtml ?? detailsEpisode.description}
          onClose={() => setDetailsEpisode(null)}
        />
      )}
    </div>
  )
}
