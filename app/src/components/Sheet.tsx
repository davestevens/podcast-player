import { useEffect, type ReactNode } from 'react'

// Bottom-sheet modal primitive: dimmed backdrop + rounded panel that slides
// up from the bottom. Backdrop click or Esc closes. Styling lives in
// index.css (.sheet-backdrop / .sheet).
export function Sheet({
  title,
  onClose,
  children,
  className,
}: {
  title?: string
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className={`sheet${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="sheet__title">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
