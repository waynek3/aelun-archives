import { type ReactNode, useRef, useEffect } from 'react'
import clsx from 'clsx'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Focus trap implementation
  useEffect(() => {
    if (!open) return

    const modal = modalRef.current
    if (!modal) return

    // Store the element that had focus before the modal opened
    const previouslyFocused = document.activeElement as HTMLElement

    // Focus the close button when modal opens
    closeButtonRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        onClose()
        return
      }

      // Handle Tab key for focus trap
      if (e.key === 'Tab') {
        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    modal.addEventListener('keydown', handleKeyDown)

    // Cleanup: restore focus when modal closes
    return () => {
      modal.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-label={title ? undefined : 'Modal'}
      className={clsx(
        'fixed inset-0 z-[1000] flex items-center justify-center',
        'bg-black/60 backdrop-blur-sm'
      )}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="modal-border panel-double bg-slate-900 text-gray-200 p-6 min-w-[320px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {title ? <h2 id="modal-title" className="text-xl font-bold mb-4 text-green-500 uppercase">{title}</h2> : null}
        <div className="text-sm">{children}</div>
        <div className="mt-6 flex justify-end">
          <button
            ref={closeButtonRef}
            className="btn btn-secondary px-4 py-2"
            onClick={onClose}
            aria-label="Close modal"
          >
            ► CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}
