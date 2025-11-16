import { useRef, useEffect } from 'react'
import type { ActionCard } from '@/types/cards'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'

interface ActionWheelProps {
  actions: Array<{ card: ActionCard; copies: number }>
  onSelect: (cardId: string) => void
}

export function ActionWheel({ actions, onSelect }: ActionWheelProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const buttons = container.querySelectorAll('button')
      const currentIndex = Array.from(buttons).findIndex(btn => btn === document.activeElement)

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault()
          if (currentIndex < buttons.length - 1) {
            (buttons[currentIndex + 1] as HTMLElement).focus()
          } else {
            (buttons[0] as HTMLElement).focus()
          }
          break
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault()
          if (currentIndex > 0) {
            (buttons[currentIndex - 1] as HTMLElement).focus()
          } else {
            (buttons[buttons.length - 1] as HTMLElement).focus()
          }
          break
        case 'Home':
          e.preventDefault();
          (buttons[0] as HTMLElement).focus()
          break
        case 'End':
          e.preventDefault();
          (buttons[buttons.length - 1] as HTMLElement).focus()
          break
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [actions])

  return (
    <Panel variant="double" className="p-4" role="region" aria-label="Available actions">
      <h3 className="text-green-500 uppercase font-bold" id="action-wheel-heading">What do you do?</h3>
      {actions.length === 0 ? (
        <p className="text-sm text-cyan-400 mt-2" role="status">No cards in your deck can be used in this scene.</p>
      ) : (
        <div
          ref={containerRef}
          className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2"
          role="menu"
          aria-labelledby="action-wheel-heading"
        >
          {actions.map(({ card, copies }, index) => (
            <Button
              key={card.id}
              onClick={() => onSelect(card.id)}
              aria-label={`Select action ${card.name}. ${card.actionType} action with ${copies} ${copies === 1 ? 'copy' : 'copies'}. Tags: ${card.tags.join(', ')}.`}
              role="menuitem"
              tabIndex={index === 0 ? 0 : -1}
            >
              <div className="flex flex-col text-left">
                <span>► {card.name.toUpperCase()} ({card.actionType})</span>
                <span className="text-xs text-cyan-300 mt-1">
                  Copies: {copies} • Tags: {card.tags.join(', ')}
                </span>
              </div>
            </Button>
          ))}
        </div>
      )}
    </Panel>
  )
}
