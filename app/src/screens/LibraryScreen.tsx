import { usePlayer } from '../player/PlayerContext'
import { MOCK_EPISODES, MOCK_PODCAST_TITLE } from '../mockEpisodes'

// Phase 1 stand-in: lists hardcoded episodes to exercise playback.
// Replaced in Phase 2 with the real subscriptions/episodes list from IndexedDB.
export function LibraryScreen() {
  const { episode: currentEpisode, loadEpisode, play } = usePlayer()

  return (
    <div className="screen">
      <h1 className="screen__title">Library</h1>
      <ul className="episode-list">
        {MOCK_EPISODES.map((episode) => (
          <li key={episode.id}>
            <button
              className="episode-row"
              onClick={() => {
                loadEpisode(episode, MOCK_PODCAST_TITLE)
                play()
              }}
            >
              <div className="episode-row__title">
                {episode.title}
                {currentEpisode?.id === episode.id && ' 🔊'}
              </div>
              <div className="episode-row__subtitle">{episode.description}</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
