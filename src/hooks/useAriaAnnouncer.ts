/**
 * Global aria-live announcer hook
 * Usage:
 * const announce = useAriaAnnouncer()
 * announce('Card unlocked!', 'assertive')
 */

import { useRef } from 'react'

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
