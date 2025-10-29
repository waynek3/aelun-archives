import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import type { PredicateCard } from '@/types/cards'

interface TargetSelectionScreenProps {
  onTargetSelected: (target: PredicateCard) => void
  onCancel: () => void
}

export default function TargetSelectionScreen({ 
  onTargetSelected, 
  onCancel 
}: TargetSelectionScreenProps) {
  const targetSelection = useGameStore((s) => s.targetSelection)
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

  function handleTargetSelect(target: PredicateCard) {
    onTargetSelected(target)
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
          <p className="text-sm text-gray-300 mb-4">
            Select a target for your action. Each location offers different opportunities and risks.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-yellow-400 font-bold uppercase text-sm">Available Targets</h3>
          {availableTargets.length === 0 ? (
            <div className="panel p-4 text-sm text-gray-400">
              No valid targets available for this action.
            </div>
          ) : (
            <div className="space-y-2">
              {availableTargets.map((target) => (
                <Card
                  key={target.id}
                  title={target.name}
                  className="cursor-pointer hover:border-cyan-400 transition-colors"
                  onClick={() => handleTargetSelect(target)}
                >
                  <div className="p-3">
                    <h4 className="text-green-400 font-bold mb-1">{target.name}</h4>
                    <p className="text-sm text-gray-300 mb-2">{target.description}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {target.sceneTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-400">
                      Timescale: {target.timescale}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
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