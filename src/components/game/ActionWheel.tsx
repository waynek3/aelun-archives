import type { ActionCard } from '@/types/cards'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'

interface ActionWheelProps {
  actions: ActionCard[]
  onSelect: (cardId: string) => void
}

export function ActionWheel({ actions, onSelect }: ActionWheelProps) {
  return (
    <Panel variant="double" className="p-4">
      <h3 className="text-green-500 uppercase font-bold">What do you do?</h3>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {actions.map((a) => (
          <Button key={a.id} onClick={() => onSelect(a.id)} aria-label={`Select action ${a.name}`}>
            ► {a.name.toUpperCase()} ({a.actionType})
          </Button>
        ))}
      </div>
    </Panel>
  )
}
