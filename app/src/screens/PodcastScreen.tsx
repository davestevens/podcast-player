import { useEffect, useState } from 'react'
import type { DownloadRecord, Episode, PlaybackState, Podcast } from '../types'
import { getSubscription } from '../data/subscriptions'
import { listEpisodesForFeed } from '../data/episodes'
import { getPlaybackState } from '../data/playbackState'
import { getDownload } from '../data/downloads'
import { subscribeToFeed } from '../feeds/feedFetcher'
import { usePlayer } from '../player/PlayerContext'
import { EpisodeRow } from '../components/EpisodeRow'

export function PodcastScreen({ feedUrl, onBack }: { feedUrl: string; onBack: () => void }) {
  const { episode: currentEpisode, loadEpisode, play } = usePlayer()
  const [podcast, setPodcast] = useState<Podcast | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [playbackStates, setPlaybackStates] = useState<Record<string, PlaybackState>>({})
  const [downloads, setDownloads] = useState<Record<string, DownloadRecord>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)

  const reload = async () => {
    const [loadedPodcast, loadedEpisodes] = await Promise.all([
      getSubscription(feedUrl),
      listEpisodesForFeed(feedUrl),
    ])
    setPodcast(loadedPodcast ?? null)
    setEpisodes(loadedEpisodes)

    const states = await Promise.all(loadedEpisodes.map((episode) => getPlaybackState(episode.id)))
    const statesById: Record<string, PlaybackState> = {}
    loadedEpisodes.forEach((episode, i) => {
      const state = states[i]
      if (state) statesById[episode.id] = state
    })
    setPlaybackStates(statesById)

    const downloadRecords = await Promise.all(loadedEpisodes.map((episode) => getDownload(episode.id)))
    const downloadsById: Record<string, DownloadRecord> = {}
    loadedEpisodes.forEach((episode, i) => {
      const record = downloadRecords[i]
      if (record) downloadsById[episode.id] = record
    })
    setDownloads(downloadsById)
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedUrl])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await subscribeToFeed(feedUrl)
      await reload()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="screen">
      <button className="screen__back" onClick={onBack}>
        ← Library
      </button>

      <div className="screen__header">
        <h1 className="screen__title">{podcast?.title ?? 'Loading…'}</h1>
        <button className="screen__refresh" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {episodes.length === 0 ? (
        <p className="screen__empty">No episodes found.</p>
      ) : (
        <ul className="episode-list">
          {episodes.map((episode) => (
            <li key={episode.id}>
              <EpisodeRow
                episode={episode}
                playbackState={playbackStates[episode.id]}
                downloadRecord={downloads[episode.id]}
                isCurrent={currentEpisode?.id === episode.id}
                onPlay={() => {
                  loadEpisode(episode, podcast?.title)
                  play()
                }}
                onDownloadChange={() => void reload()}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
