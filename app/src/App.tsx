import { useEffect, useState } from 'react'
import { PlayerProvider, usePlayer } from './player/PlayerContext'
import { LibraryScreen } from './screens/LibraryScreen'
import { DiscoverScreen } from './screens/DiscoverScreen'
import { PodcastScreen } from './screens/PodcastScreen'
import { DownloadsScreen } from './screens/DownloadsScreen'
import { NowPlayingScreen } from './screens/NowPlayingScreen'
import { MiniPlayer } from './components/MiniPlayer'
import { requestPersistentStorage } from './storage'

type View =
  | { name: 'library' }
  | { name: 'discover' }
  | { name: 'podcast'; feedUrl: string }
  | { name: 'downloads' }

function AppShell() {
  const { episode } = usePlayer()
  const [view, setView] = useState<View>({ name: 'library' })
  const [playerExpanded, setPlayerExpanded] = useState(false)

  const showTabBar = view.name === 'library' || view.name === 'discover'

  useEffect(() => {
    void requestPersistentStorage()
  }, [])

  return (
    <div className="app">
      <main className="app__content">
        {view.name === 'library' && (
          <LibraryScreen
            onSelectPodcast={(feedUrl) => setView({ name: 'podcast', feedUrl })}
            onOpenDownloads={() => setView({ name: 'downloads' })}
          />
        )}
        {view.name === 'discover' && <DiscoverScreen />}
        {view.name === 'podcast' && (
          <PodcastScreen feedUrl={view.feedUrl} onBack={() => setView({ name: 'library' })} />
        )}
        {view.name === 'downloads' && <DownloadsScreen onBack={() => setView({ name: 'library' })} />}
      </main>

      {episode && !playerExpanded && (
        <MiniPlayer onExpand={() => setPlayerExpanded(true)} liftedAboveTabBar={showTabBar} />
      )}
      {episode && playerExpanded && <NowPlayingScreen onClose={() => setPlayerExpanded(false)} />}

      {showTabBar && (
        <nav className="tab-bar">
          <button
            className={`tab-bar__item${view.name === 'library' ? ' tab-bar__item--active' : ''}`}
            onClick={() => setView({ name: 'library' })}
          >
            Library
          </button>
          <button
            className={`tab-bar__item${view.name === 'discover' ? ' tab-bar__item--active' : ''}`}
            onClick={() => setView({ name: 'discover' })}
          >
            Discover
          </button>
        </nav>
      )}
    </div>
  )
}

export default function App() {
  return (
    <PlayerProvider>
      <AppShell />
    </PlayerProvider>
  )
}
