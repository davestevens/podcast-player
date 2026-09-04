import { useCallback, useEffect, useRef, useState } from 'react'

export type SleepTimerMode = 'off' | 'countdown' | 'end-of-episode'

export function useSleepTimer(onFire: () => void) {
  const [mode, setMode] = useState<SleepTimerMode>('off')
  const [remainingSec, setRemainingSec] = useState<number | null>(null)
  const targetTimestampRef = useRef<number | null>(null)
  const intervalIdRef = useRef<number | null>(null)
  const onFireRef = useRef(onFire)
  onFireRef.current = onFire

  const clearCountdown = useCallback(() => {
    if (intervalIdRef.current !== null) {
      window.clearInterval(intervalIdRef.current)
      intervalIdRef.current = null
    }
    targetTimestampRef.current = null
  }, [])

  const cancel = useCallback(() => {
    clearCountdown()
    setMode('off')
    setRemainingSec(null)
  }, [clearCountdown])

  const startPreset = useCallback(
    (minutes: number) => {
      clearCountdown()
      const target = Date.now() + minutes * 60_000
      targetTimestampRef.current = target
      setMode('countdown')
      setRemainingSec(minutes * 60)

      intervalIdRef.current = window.setInterval(() => {
        const remaining = Math.round((target - Date.now()) / 1000)
        if (remaining <= 0) {
          clearCountdown()
          setMode('off')
          setRemainingSec(null)
          onFireRef.current()
          return
        }
        setRemainingSec(remaining)
      }, 1000)
    },
    [clearCountdown],
  )

  const startEndOfEpisode = useCallback(() => {
    clearCountdown()
    setMode('end-of-episode')
    setRemainingSec(null)
  }, [clearCountdown])

  // Call when the audio element fires 'ended' — the browser has already
  // stopped playback naturally, this just resets the sleep-timer UI state.
  const notifyEpisodeEnded = useCallback(() => {
    if (mode === 'end-of-episode') {
      setMode('off')
    }
  }, [mode])

  useEffect(() => clearCountdown, [clearCountdown])

  return { mode, remainingSec, startPreset, startEndOfEpisode, cancel, notifyEpisodeEnded }
}
