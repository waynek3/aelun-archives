import type { ReactNode } from 'react'
import clsx from 'clsx'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal'}
      className={clsx(
        'fixed inset-0 z-[1000] flex items-center justify-center',
        'bg-black/60 backdrop-blur-sm'
      )}
      onClick={onClose}
    >
      <div
        className="modal-border panel-double bg-slate-900 text-gray-200 p-6 min-w-[320px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {title ? <h2 className="text-xl font-bold mb-4 text-green-500 uppercase">{title}</h2> : null}
        <div className="text-sm">{children}</div>
        <div className="mt-6 flex justify-end">
          <button className="btn btn-secondary px-4 py-2" onClick={onClose} aria-label="Close modal">
            ► CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}
