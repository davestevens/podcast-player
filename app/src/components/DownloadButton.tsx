import { useState } from 'react'
import type { DownloadRecord, Episode } from '../types'
import { deleteDownload, downloadEpisode } from '../data/downloads'

export function DownloadButton({
  episode,
  downloadRecord,
  onChange,
}: {
  episode: Episode
  downloadRecord: DownloadRecord | undefined
  onChange: () => void
}) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDownloading(true)
    try {
      await downloadEpisode(episode)
    } catch {
      // downloadEpisode already persisted an 'error' status record
    } finally {
      setIsDownloading(false)
      onChange()
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteDownload(episode.id)
    onChange()
  }

  if (isDownloading) {
    return (
      <span className="download-button download-button--busy" aria-label="Downloading">
        ⋯
      </span>
    )
  }

  if (downloadRecord?.status === 'complete') {
    return (
      <button className="download-button download-button--complete" onClick={handleDelete} aria-label="Remove download">
        ✓
      </button>
    )
  }

  if (downloadRecord?.status === 'error') {
    return (
      <button className="download-button download-button--error" onClick={handleDownload} aria-label="Retry download">
        ⚠
      </button>
    )
  }

  return (
    <button className="download-button" onClick={handleDownload} aria-label="Download for offline">
      ⬇
    </button>
  )
}
