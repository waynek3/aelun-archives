import { useEffect, useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { selectUnlock } from '@/lib/engine/cardEvolution'
import type { ActionCard } from '@/types/cards'
import { getActionCards } from '@/lib/utils/content'

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
  const [cardMap, setCardMap] = useState<Record<string, ActionCard>>({})

  useEffect(() => {
    if (!isOpen) return

    let mounted = true
    getActionCards()
      .then((cards) => {
        if (mounted) setCardMap(cards)
      })
      .catch((error) => {
        console.error('Failed to load action cards for unlock modal:', error)
      })

    return () => {
      mounted = false
    }
  }, [isOpen])

  const handleSelect = async () => {
    if (!selectedCard) return

    setSelecting(true)
    try {
      await selectUnlock(cardId, tier, selectedCard)
      onUnlockSelected(cardMap[selectedCard]?.name ?? selectedCard)
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
            <label key={index} className="flex items-start space-x-3 cursor-pointer border border-cyan-400/30 rounded p-3 hover:border-yellow-300 transition-colors">
              <input
                type="radio"
                name="unlock"
                value={cardName}
                checked={selectedCard === cardName}
                onChange={(e) => setSelectedCard(e.target.value)}
                className="mt-1 text-green-400 accent-green-500"
              />
              <div>
                <div className="text-green-400 font-bold text-sm">
                  {cardMap[cardName]?.name ?? cardName}
                </div>
                {cardMap[cardName]?.description && (
                  <p className="text-xs text-cyan-200 mt-1">
                    {cardMap[cardName]?.description}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-cyan-300 uppercase">
                  {cardMap[cardName]?.tags?.map((tag) => (
                    <span key={`${cardName}-tag-${tag}`} className="px-2 py-0.5 border border-cyan-400/40 rounded">
                      {tag}
                    </span>
                  ))}
                  {cardMap[cardName]?.timescales?.map((scale) => (
                    <span key={`${cardName}-scale-${scale}`} className="px-2 py-0.5 border border-yellow-400/40 rounded text-yellow-300">
                      {scale}
                    </span>
                  ))}
                </div>
              </div>
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