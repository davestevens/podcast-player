export interface Podcast {
  feedUrl: string
  title: string
  author?: string
  artworkUrl?: string
  description?: string
  addedAt: number
  lastFetchedAt: number
}

export interface Episode {
  id: string // `${feedUrl}::${guid}`
  feedUrl: string
  guid: string
  title: string
  description?: string // short summary, clamped in the row
  contentHtml?: string // full show notes (content:encoded / itunes:summary), shown in the details sheet
  audioUrl: string
  audioType?: string
  durationSec?: number
  pubDate: number
  artworkUrl?: string
}

export interface PlaybackState {
  episodeId: string
  positionSec: number
  durationSec?: number
  played: boolean
  lastPlayedAt?: number
}

export type DownloadStatus = 'downloading' | 'complete' | 'error'

export interface DownloadRecord {
  episodeId: string
  blob: Blob
  mimeType: string
  sizeBytes: number
  downloadedAt: number
  status: DownloadStatus
}
