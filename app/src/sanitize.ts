import DOMPurify from 'dompurify'

// Episode descriptions come from arbitrary, untrusted RSS feeds and often
// contain real HTML (paragraphs, links, bold/italic). Rendered with
// dangerouslySetInnerHTML, so this allowlist is deliberately conservative:
// basic text formatting and links only -- no images (feeds commonly embed
// tracking pixels), no iframes/scripts/forms, nothing that can navigate the
// PWA away from itself or phone home on render.
const ALLOWED_TAGS = ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'span']
const ALLOWED_ATTR = ['href']

// The full-description sheet is a deliberate, scrolled reading context, so it
// additionally allows headings and images (lazy-loaded, no referrer).
const FULL_ALLOWED_TAGS = [...ALLOWED_TAGS, 'h1', 'h2', 'h3', 'h4', 'img', 'hr', 'pre', 'code']
const FULL_ALLOWED_ATTR = [...ALLOWED_ATTR, 'src', 'alt']

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
  if (node.tagName === 'IMG') {
    node.setAttribute('loading', 'lazy')
    node.setAttribute('referrerpolicy', 'no-referrer')
  }
})

export function sanitizeDescriptionHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}

export function sanitizeFullDescriptionHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: FULL_ALLOWED_TAGS, ALLOWED_ATTR: FULL_ALLOWED_ATTR })
}
