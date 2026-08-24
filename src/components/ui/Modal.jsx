import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

export default function Modal({ open, onClose, title, children }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    previousFocusRef.current = document.activeElement
    const dialog = dialogRef.current
    const focusable = () => Array.from(dialog?.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    ) || [])
    focusable()[0]?.focus()

    const handler = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) {
        event.preventDefault()
        dialog?.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handler)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = previousOverflow
      previousFocusRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <button
        type="button"
        className="absolute inset-0 w-full h-full bg-black/40 backdrop-blur-sm cursor-default"
        onClick={onClose}
        data-testid="modal-overlay"
        aria-label="Fechar janela"
      />
      {/* Card */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 animate-slide-up"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 id={titleId} className="font-display font-semibold text-lg text-ru-charcoal">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="min-w-11 min-h-11 grid place-items-center text-ru-muted hover:text-ru-charcoal transition-colors">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
