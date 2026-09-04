import { useState } from 'react'
import { usePlayer, SKIP_STEP_SEC } from '../player/PlayerContext'
import { formatTime } from '../format'
import { SleepTimerSheet } from '../components/SleepTimerSheet'

export function NowPlayingScreen({ onClose }: { onClose: () => void }) {
  const { episode, podcastTitle, isPlaying, position, duration, togglePlay, seek, skip, sleepTimer } =
    usePlayer()
  const [showSleepTimer, setShowSleepTimer] = useState(false)

  if (!episode) return null

  return (
    <div className="now-playing">
      <button className="now-playing__close" onClick={onClose} aria-label="Collapse player">
        ⌄
      </button>

      <div className="now-playing__art" aria-hidden="true" />

      <h1 className="now-playing__title">{episode.title}</h1>
      <div className="now-playing__subtitle">{podcastTitle}</div>

      <div className="now-playing__seek">
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={Math.min(position, duration || 0)}
          onChange={(e) => seek(Number(e.target.value))}
        />
        <div className="now-playing__time">
          <span>{formatTime(position)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="now-playing__controls">
        <button onClick={() => skip(-SKIP_STEP_SEC)} aria-label="Back 15 seconds">
          ⟲ 15
        </button>
        <button className="now-playing__play" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={() => skip(SKIP_STEP_SEC)} aria-label="Forward 15 seconds">
          15 ⟳
        </button>
      </div>

      <button className="now-playing__sleep-timer" onClick={() => setShowSleepTimer(true)}>
        😴 Sleep timer
        {sleepTimer.mode !== 'off' && (
          <span className="now-playing__sleep-timer-badge">
            {sleepTimer.mode === 'countdown' ? formatTime(sleepTimer.remainingSec ?? 0) : 'end of episode'}
          </span>
        )}
      </button>

      {showSleepTimer && <SleepTimerSheet onClose={() => setShowSleepTimer(false)} />}
    </div>
  )
}
