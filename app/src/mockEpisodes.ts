import type { Episode } from './types'

// Temporary fixture for Phase 1 (audio/MediaSession wiring only).
// Replaced in Phase 2 once episodes are loaded from subscribed RSS feeds.
export const MOCK_PODCAST_TITLE = 'Sample Podcast'

export const MOCK_EPISODES: Episode[] = [
  {
    id: 'mock::ep1',
    feedUrl: 'mock',
    guid: 'ep1',
    title: 'SoundHelix Song 1',
    description: 'A royalty-free sample track used to test playback, background audio and lock-screen controls.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    audioType: 'audio/mpeg',
    pubDate: Date.now(),
  },
  {
    id: 'mock::ep2',
    feedUrl: 'mock',
    guid: 'ep2',
    title: 'SoundHelix Song 2',
    description: 'A second sample track, used to test switching the current episode.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    audioType: 'audio/mpeg',
    pubDate: Date.now() - 86_400_000,
  },
]
