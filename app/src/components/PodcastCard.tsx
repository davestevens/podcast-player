import type { Podcast } from '../types'
import { Artwork } from './Artwork'

export function PodcastCard({ podcast, onSelect }: { podcast: Podcast; onSelect: () => void }) {
  return (
    <button className="podcast-card" onClick={onSelect}>
      <Artwork src={podcast.artworkUrl} className="podcast-card__art" />
      <div className="podcast-card__info">
        <div className="podcast-card__title">{podcast.title}</div>
        {podcast.author && <div className="podcast-card__subtitle">{podcast.author}</div>}
      </div>
    </button>
  )
}
