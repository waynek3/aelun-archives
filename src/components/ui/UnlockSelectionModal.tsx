import { useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { selectUnlock } from '@/lib/engine/cardEvolution'

interface UnlockSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  cardId: string
  tier: number
  pool: string[]
  onUnlockSelected: (selectedCard: string) => void
}

export function UnlockSelectionModal({
  isOpen,
  onClose,
  cardId,
  tier,
  pool,
  onUnlockSelected
}: UnlockSelectionModalProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)

  const handleSelect = async () => {
    if (!selectedCard) return

    setSelecting(true)
    try {
      await selectUnlock(cardId, tier, selectedCard)
      onUnlockSelected(selectedCard)
      onClose()
    } catch (error) {
      console.error('Failed to select unlock:', error)
    } finally {
      setSelecting(false)
    }
  }

  const handleClose = () => {
    if (!selecting) {
      onClose()
    }
  }

  return (
    <Modal open={isOpen} onClose={handleClose} title="Card Evolution Unlocked!">
      <div className="space-y-4">
        <p className="text-cyan-400">
          Your failures have unlocked new possibilities! Choose one card to add to your collection:
        </p>
        
        <div className="space-y-2">
          {pool.map((cardName, index) => (
            <label key={index} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="unlock"
                value={cardName}
                checked={selectedCard === cardName}
                onChange={(e) => setSelectedCard(e.target.value)}
                className="text-green-400"
              />
              <span className="text-cyan-400">{cardName}</span>
            </label>
          ))}
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSelect}
            disabled={!selectedCard || selecting}
            className="flex-1"
          >
            {selecting ? 'Unlocking...' : 'Select Card'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={selecting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}