import { Sheet } from './Sheet'
import { sanitizeFullDescriptionHtml } from '../sanitize'

// Scrollable sheet showing a full, sanitized description -- used for both an
// episode's show notes and a podcast's channel description.
export function DescriptionSheet({
  title,
  meta,
  html,
  onClose,
}: {
  title: string
  meta?: string
  html: string | undefined
  onClose: () => void
}) {
  return (
    <Sheet title={title} onClose={onClose} className="sheet--scroll">
      {meta && <div className="description-sheet__meta">{meta}</div>}
      {html ? (
        <div
          className="description-sheet__body"
          dangerouslySetInnerHTML={{ __html: sanitizeFullDescriptionHtml(html) }}
        />
      ) : (
        <p className="screen__empty">No description available.</p>
      )}
    </Sheet>
  )
}
