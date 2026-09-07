import { useState } from 'react'

// Shared show-artwork renderer: falls back to a plain placeholder square
// when there's no URL, or the image fails to load (broken link, blocked,
// etc.) -- used anywhere a podcast/episode image is shown so every spot
// degrades the same way instead of showing a broken-image icon.
export function Artwork({
  src,
  alt = '',
  className = '',
}: {
  src: string | undefined
  alt?: string
  className?: string
}) {
  // Tracks which src last failed, not just a boolean -- MiniPlayer and
  // NowPlayingScreen reuse the same Artwork instance across different
  // episodes (no remount), so a failure must be scoped to the src that
  // actually failed. Otherwise switching to a later episode with a
  // perfectly good image would still show the placeholder.
  const [failedSrc, setFailedSrc] = useState<string | undefined>(undefined)
  const failed = src !== undefined && src === failedSrc

  if (!src || failed) {
    return <div className={`artwork artwork--placeholder ${className}`} aria-hidden="true" />
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`artwork ${className}`}
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  )
}
