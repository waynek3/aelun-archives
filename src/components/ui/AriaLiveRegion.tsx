/**
 * Aria Live Region
 * Announces dynamic content changes to screen readers
 */

import { useEffect, useRef } from 'react'

interface AriaLiveRegionProps {
  message: string
  politeness?: 'polite' | 'assertive'
  clearDelay?: number
}

export function AriaLiveRegion({ message, politeness = 'polite', clearDelay = 3000 }: AriaLiveRegionProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout to clear message
    if (message && clearDelay > 0) {
      timeoutRef.current = setTimeout(() => {
        // Message will be cleared by next render
      }, clearDelay)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [message, clearDelay])

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}

/**
 * Global aria-live announcer hook
 * Usage:
 * const announce = useAriaAnnouncer()
 * announce('Card unlocked!', 'assertive')
 */
export function useAriaAnnouncer() {
  const announceRef = useRef<((message: string, politeness?: 'polite' | 'assertive') => void) | null>(null)

  if (!announceRef.current) {
    // Create a hidden div for announcements
    let announceDiv = document.getElementById('aria-announcer') as HTMLDivElement | null

    if (!announceDiv) {
      announceDiv = document.createElement('div')
      announceDiv.id = 'aria-announcer'
      announceDiv.setAttribute('role', 'status')
      announceDiv.setAttribute('aria-live', 'polite')
      announceDiv.setAttribute('aria-atomic', 'true')
      announceDiv.className = 'sr-only'
      document.body.appendChild(announceDiv)
    }

    announceRef.current = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
      if (announceDiv) {
        announceDiv.setAttribute('aria-live', politeness)
        announceDiv.textContent = message

        // Clear after 3 seconds
        setTimeout(() => {
          if (announceDiv) {
            announceDiv.textContent = ''
          }
        }, 3000)
      }
    }
  }

  return announceRef.current
}
