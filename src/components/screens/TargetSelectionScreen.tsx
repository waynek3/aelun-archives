import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import type { PredicateCard } from '@/types/cards'
import { getAllDeities } from '@/data/affinities'

interface TargetSelectionScreenProps {
  onTargetSelected: (target: PredicateCard) => void
  onCancel: () => void
  currentLocationId?: string
}

export default function TargetSelectionScreen({
  onTargetSelected,
  onCancel,
  currentLocationId
}: TargetSelectionScreenProps) {
  const targetSelection = useGameStore((s) => s.targetSelection)
  const setTargetSelection = useGameStore((s) => s.setTargetSelection)
  const setScreen = useUIStore((s) => s.setScreen)

  if (!targetSelection) {
    return (
      <ScreenContainer>
        <div className="py-6 space-y-4">
          <div className="panel p-4 text-sm text-red-400 mb-4">
            No target selection data found.
          </div>
          <Button onClick={onCancel}>◄ BACK</Button>
        </div>
      </ScreenContainer>
    )
  }

  const { actionId, availableTargets } = targetSelection

  // For prayer actions, show deity selection instead of location selection
  const isPrayerAction = actionId === 'pray' || actionId === 'ritual' || actionId === 'pilgrimage'
  const availableDeities = isPrayerAction ? getAllDeities() : []

  function handleTargetSelect(target: PredicateCard) {
    if (isPrayerAction && availableDeities.length > 0) {
      // For prayer, don't proceed yet - need to select deity first
      return
    }
    onTargetSelected(target)
  }

  function handleDeitySelect(deityId: string) {
    // Store the selected deity and the current location as the target
    if (availableTargets.length > 0 && targetSelection) {
      const currentLocation = availableTargets[0] // Should be current location
      setTargetSelection({
        actionId,
        availableTargets,
        selectedTarget: currentLocation,
        selectedEntity: deityId,
        maxDuplicates: targetSelection.maxDuplicates
      })
      // Proceed to dice pool with selected deity
      onTargetSelected(currentLocation)
    }
  }

  function handleBack() {
    onCancel()
  }

  return (
    <ScreenContainer>
      <div className="py-6 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-green-500 font-bold uppercase">Choose Target</h2>
          <Button variant="secondary" onClick={() => setScreen('PauseMenu')}>
            ≡ MENU
          </Button>
        </header>

        <div className="panel p-4">
          <h3 className="text-cyan-400 font-bold mb-2">Action: {actionId}</h3>
          <p className="text-sm text-gray-300 mb-2">
            {isPrayerAction
              ? 'Choose which deity or spirit to pray to. Your prayer will be offered at your current location.'
              : 'Select a target for your action. Only adjacent or context-appropriate locations are listed.'
            }
          </p>
          {currentLocationId && (
            <p className="text-xs text-gray-400">Current location: {currentLocationId}</p>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-yellow-400 font-bold uppercase text-sm">
            {isPrayerAction ? 'Choose Deity' : 'Available Targets'}
          </h3>
          {isPrayerAction ? (
            // Show deity selection for prayer
            availableDeities.length === 0 ? (
              <div className="panel p-4 text-sm text-gray-400">
                No deities available.
              </div>
            ) : (
              <div className="space-y-2">
                {availableDeities.map((deity) => (
                  <Card
                    key={deity.id}
                    title={deity.name}
                    subtitle={deity.category}
                    className="cursor-pointer hover:border-cyan-400 transition-colors"
                    onClick={() => handleDeitySelect(deity.id)}
                  >
                    <div className="p-3 space-y-2">
                      <p className="text-sm text-gray-300">{deity.description}</p>
                      {deity.region && (
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                            {deity.region}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            // Show location selection for other actions
            availableTargets.length === 0 ? (
              <div className="panel p-4 text-sm text-gray-400">
                No valid targets available for this action.
              </div>
            ) : (
              <div className="space-y-2">
                {availableTargets.map((target) => (
                  <Card
                    key={target.id}
                    title={target.name}
                    subtitle={target.id === currentLocationId ? 'Current Location' : undefined}
                    className="cursor-pointer hover:border-cyan-400 transition-colors"
                    onClick={() => handleTargetSelect(target)}
                  >
                    <div className="p-3 space-y-2">
                      <p className="text-sm text-gray-300">{target.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {target.sceneTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        <span className="px-2 py-1 bg-gray-800 text-xs rounded text-gray-300">
                          Timescale: {target.timescale}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleBack}>
            ◄ BACK
          </Button>
          <Button onClick={() => setScreen('MainMenu')}>
            ◄ MAIN MENU
          </Button>
        </div>
      </div>
    </ScreenContainer>
  )
}