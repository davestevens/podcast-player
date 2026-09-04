import type { Podcast } from '../types'

export function PodcastCard({ podcast, onSelect }: { podcast: Podcast; onSelect: () => void }) {
  return (
    <button className="podcast-card" onClick={onSelect}>
      <div className="podcast-card__title">{podcast.title}</div>
      {podcast.author && <div className="podcast-card__subtitle">{podcast.author}</div>}
    </button>
  )
}
