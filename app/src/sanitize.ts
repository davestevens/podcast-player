import DOMPurify from 'dompurify'

// Episode descriptions come from arbitrary, untrusted RSS feeds and often
// contain real HTML (paragraphs, links, bold/italic). Rendered with
// dangerouslySetInnerHTML, so this allowlist is deliberately conservative:
// basic text formatting and links only -- no images (feeds commonly embed
// tracking pixels), no iframes/scripts/forms, nothing that can navigate the
// PWA away from itself or phone home on render.
const ALLOWED_TAGS = ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'span']
const ALLOWED_ATTR = ['href']

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export function sanitizeDescriptionHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}
