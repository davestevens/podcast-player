import { usePlayer } from '../player/PlayerContext'
import { formatTime } from '../format'
import { Sheet } from './Sheet'

const PRESETS_MIN = [15, 30, 60]

export function SleepTimerSheet({ onClose }: { onClose: () => void }) {
  const { sleepTimer } = usePlayer()

  return (
    <Sheet title="Sleep timer" onClose={onClose}>
      {sleepTimer.mode !== 'off' && (
        <div className="sheet__status">
          {sleepTimer.mode === 'countdown'
            ? `Stopping in ${formatTime(sleepTimer.remainingSec ?? 0)}`
            : 'Stopping at end of episode'}
        </div>
      )}

      <div className="sheet__options">
        {PRESETS_MIN.map((minutes) => (
          <button
            key={minutes}
            className="sheet__option"
            onClick={() => {
              sleepTimer.startPreset(minutes)
              onClose()
            }}
          >
            {minutes} min
          </button>
        ))}
        <button
          className="sheet__option"
          onClick={() => {
            sleepTimer.startEndOfEpisode()
            onClose()
          }}
        >
          End of episode
        </button>
      </div>

      {sleepTimer.mode !== 'off' && (
        <button
          className="sheet__cancel"
          onClick={() => {
            sleepTimer.cancel()
            onClose()
          }}
        >
          Cancel timer
        </button>
      )}
    </Sheet>
  )
}
