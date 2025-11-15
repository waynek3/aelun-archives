import type { ActionCard } from '@/types/cards'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'

interface ActionWheelProps {
  actions: Array<{ card: ActionCard; copies: number }>
  onSelect: (cardId: string) => void
}

export function ActionWheel({ actions, onSelect }: ActionWheelProps) {
  return (
    <Panel variant="double" className="p-4">
      <h3 className="text-green-500 uppercase font-bold">What do you do?</h3>
      {actions.length === 0 ? (
        <p className="text-sm text-cyan-400 mt-2">No cards in your deck can be used in this scene.</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {actions.map(({ card, copies }) => (
            <Button
              key={card.id}
              onClick={() => onSelect(card.id)}
              aria-label={`Select action ${card.name}`}
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
