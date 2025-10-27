import { useState } from 'react'
import type { ActionCard } from '@/types/cards'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'

interface ActionWheelProps {
  actions: ActionCard[]
  onSelect: (cardId: string, duplicates?: number) => void
}

export function ActionWheel({ actions, onSelect }: ActionWheelProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [duplicates, setDuplicates] = useState(0)

  const handleCardSelect = (cardId: string) => {
    if (selectedCard === cardId) {
      // Same card selected, cycle through duplicates
      setDuplicates(prev => (prev + 1) % 4) // Max 3 duplicates (0-3)
    } else {
      // New card selected
      setSelectedCard(cardId)
      setDuplicates(0)
    }
  }

  const handleConfirm = () => {
    if (selectedCard) {
      onSelect(selectedCard, duplicates)
      setSelectedCard(null)
      setDuplicates(0)
    }
  }

  const handleCancel = () => {
    setSelectedCard(null)
    setDuplicates(0)
  }

  return (
    <Panel variant="double" className="p-4">
      <h3 className="text-green-500 uppercase font-bold">What do you do?</h3>
      
      {/* Action Selection */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {actions.map((a) => (
          <Button 
            key={a.id} 
            onClick={() => handleCardSelect(a.id)} 
            aria-label={`Select action ${a.name}`}
            variant={selectedCard === a.id ? "primary" : "secondary"}
          >
            ► {a.name.toUpperCase()} ({a.actionType})
            {selectedCard === a.id && duplicates > 0 && (
              <span className="ml-2 text-yellow-400">×{duplicates + 1}</span>
            )}
          </Button>
        ))}
      </div>

      {/* Duplicate Selection */}
      {selectedCard && (
        <div className="mt-4 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded">
          <div className="text-sm text-yellow-400 font-bold mb-2">
            DUPLICATE CARDS: {duplicates}
          </div>
          <div className="text-xs text-gray-300 mb-3">
            Playing multiple copies gives you advantage dice (keep highest)
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleConfirm}
              variant="primary"
              className="px-4"
            >
              CONFIRM ACTION
            </Button>
            <Button 
              onClick={handleCancel}
              variant="secondary"
              className="px-4"
            >
              CANCEL
            </Button>
          </div>
        </div>
      )}
    </Panel>
  )
}
