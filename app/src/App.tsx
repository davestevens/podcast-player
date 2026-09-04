import { useState } from 'react'
import { PlayerProvider, usePlayer } from './player/PlayerContext'
import { LibraryScreen } from './screens/LibraryScreen'
import { NowPlayingScreen } from './screens/NowPlayingScreen'
import { MiniPlayer } from './components/MiniPlayer'

function AppShell() {
  const { episode } = usePlayer()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="app">
      <main className="app__content">
        <LibraryScreen />
      </main>

      {episode && !expanded && <MiniPlayer onExpand={() => setExpanded(true)} />}
      {episode && expanded && <NowPlayingScreen onClose={() => setExpanded(false)} />}
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
