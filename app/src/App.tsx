import { useState } from 'react'
import { PlayerProvider, usePlayer } from './player/PlayerContext'
import { LibraryScreen } from './screens/LibraryScreen'
import { PodcastScreen } from './screens/PodcastScreen'
import { NowPlayingScreen } from './screens/NowPlayingScreen'
import { MiniPlayer } from './components/MiniPlayer'

type View = { name: 'library' } | { name: 'podcast'; feedUrl: string }

function AppShell() {
  const { episode } = usePlayer()
  const [view, setView] = useState<View>({ name: 'library' })
  const [playerExpanded, setPlayerExpanded] = useState(false)

  return (
    <div className="app">
      <main className="app__content">
        {view.name === 'library' && (
          <LibraryScreen onSelectPodcast={(feedUrl) => setView({ name: 'podcast', feedUrl })} />
        )}
        {view.name === 'podcast' && (
          <PodcastScreen feedUrl={view.feedUrl} onBack={() => setView({ name: 'library' })} />
        )}
      </main>

      {episode && !playerExpanded && <MiniPlayer onExpand={() => setPlayerExpanded(true)} />}
      {episode && playerExpanded && <NowPlayingScreen onClose={() => setPlayerExpanded(false)} />}
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
