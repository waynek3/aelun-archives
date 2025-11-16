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
