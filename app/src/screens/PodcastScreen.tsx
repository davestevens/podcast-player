import { useEffect, useState } from 'react'
import type { DownloadRecord, Episode, PlaybackState, Podcast } from '../types'
import { getSubscription, unsubscribeFromFeed } from '../data/subscriptions'
import { listEpisodesForFeed } from '../data/episodes'
import { getPlaybackState, getPlaybackStates } from '../data/playbackState'
import { getDownload, getDownloads } from '../data/downloads'
import { subscribeToFeed } from '../feeds/feedFetcher'
import { usePlayer } from '../player/PlayerContext'
import { EpisodeRow } from '../components/EpisodeRow'
import { Artwork } from '../components/Artwork'
import { DescriptionSheet } from '../components/DescriptionSheet'
import { formatDate } from '../format'

interface LoadState {
  podcast: Podcast | null
  episodes: Episode[]
  playbackStates: Record<string, PlaybackState>
  downloads: Record<string, DownloadRecord>
  loaded: boolean
}

const EMPTY: LoadState = { podcast: null, episodes: [], playbackStates: {}, downloads: {}, loaded: false }

export function PodcastScreen({ feedUrl, onBack }: { feedUrl: string; onBack: () => void }) {
  const { episode: currentEpisode, loadEpisode, pause } = usePlayer()
  const [state, setState] = useState<LoadState>(EMPTY)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [detailsEpisode, setDetailsEpisode] = useState<Episode | null>(null)
  const [showPodcastDescription, setShowPodcastDescription] = useState(false)

  const { podcast, episodes, playbackStates, downloads, loaded } = state

  // Single batched load -- fetch everything, then paint once, so the list
  // doesn't reflow as playback/download badges trickle in.
  const reload = async () => {
    const [loadedPodcast, loadedEpisodes] = await Promise.all([
      getSubscription(feedUrl),
      listEpisodesForFeed(feedUrl),
    ])
    const ids = loadedEpisodes.map((e) => e.id)
    const [states, downloadRecords] = await Promise.all([getPlaybackStates(ids), getDownloads(ids)])
    setState({
      podcast: loadedPodcast ?? null,
      episodes: loadedEpisodes,
      playbackStates: states,
      downloads: downloadRecords,
      loaded: true,
    })
  }

  useEffect(() => {
    setState(EMPTY)
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedUrl])

  // Targeted re-read for one episode after a played/download toggle -- avoids
  // refetching and repainting the whole list.
  const refreshEpisode = async (episodeId: string) => {
    const [playback, download] = await Promise.all([
      getPlaybackState(episodeId),
      getDownload(episodeId),
    ])
    setState((prev) => {
      const playbackStates = { ...prev.playbackStates }
      const downloads = { ...prev.downloads }
      if (playback) playbackStates[episodeId] = playback
      else delete playbackStates[episodeId]
      if (download) downloads[episodeId] = download
      else delete downloads[episodeId]
      return { ...prev, playbackStates, downloads }
    })
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await subscribeToFeed(feedUrl)
      await reload()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRemove = async () => {
    if (!window.confirm(`Remove "${podcast?.title ?? 'this podcast'}"? This deletes its episodes and any downloads.`)) {
      return
    }
    setIsRemoving(true)
    try {
      // Stop playback first if the episode about to be deleted is the one
      // currently loaded -- otherwise it'd keep playing from a source that's
      // about to have its download blob (and episode/playback records) gone.
      if (currentEpisode?.feedUrl === feedUrl) pause()
      await unsubscribeFromFeed(feedUrl)
      onBack()
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="screen">
      <button className="screen__back" onClick={onBack}>
        ← Library
      </button>

      <div className="podcast-header">
        <Artwork src={podcast?.artworkUrl} className="podcast-header__art" />
        <div className="podcast-header__info">
          <h1 className="screen__title">{podcast?.title ?? (loaded ? 'Unknown podcast' : 'Loading…')}</h1>
          {podcast?.author && <div className="podcast-header__author">{podcast.author}</div>}
        </div>
      </div>

      {podcast?.description && (
        <button
          className="description-sheet__podcast"
          onClick={() => setShowPodcastDescription(true)}
        >
          {podcast.description}
        </button>
      )}

      <div className="podcast-actions">
        <button className="screen__refresh" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
        <button className="podcast-actions__remove" onClick={handleRemove} disabled={isRemoving}>
          {isRemoving ? 'Removing…' : 'Remove podcast'}
        </button>
      </div>

      {!loaded ? (
        <ul className="episode-list" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="episode-skeleton" />
          ))}
        </ul>
      ) : episodes.length === 0 ? (
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
                onPlay={() => loadEpisode(episode, podcast?.title, { autoplay: true })}
                onDownloadChange={() => void refreshEpisode(episode.id)}
                onPlayedChange={() => void refreshEpisode(episode.id)}
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

      {showPodcastDescription && podcast && (
        <DescriptionSheet
          title={podcast.title}
          html={podcast.description}
          onClose={() => setShowPodcastDescription(false)}
        />
      )}
    </div>
  )
}
