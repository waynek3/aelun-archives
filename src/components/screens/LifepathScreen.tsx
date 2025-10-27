import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { useUIStore } from '@/stores/uiStore'
import { lifepathService } from '@/lib/engine/lifepath'
import { useMemo, useState } from 'react'

export default function LifepathScreen() {
  const setScreen = useUIStore((s) => s.setScreen)

  const lifepaths = useMemo(() => lifepathService.listLifepaths(), [])
  const [selectedLifepathId, setSelectedLifepathId] = useState(lifepaths[0]?.id || '')
  const [progress, setProgress] = useState(() =>
    selectedLifepathId ? lifepathService.start(selectedLifepathId) : null
  )

  const lifepath = useMemo(
    () => lifepaths.find((l) => l.id === selectedLifepathId),
    [lifepaths, selectedLifepathId]
  )
  const step = lifepath && progress ? lifepath.steps[progress.currentStepIndex] : null
  const totalSteps = lifepath?.steps.length ?? 0
  const isComplete = progress ? lifepathService.isComplete(progress) : false

  function handleSelectLifepath(id: string) {
    setSelectedLifepathId(id)
    setProgress(lifepathService.start(id))
  }

  function handleChoose(choiceId: string) {
    if (!progress) return
    setProgress(lifepathService.choose(progress, choiceId))
  }

  function handleBackToMenu() {
    setScreen('MainMenu')
  }

  function handleContinue() {
    if (!progress) return
    // For Part 1, we stop at completion and return to menu or later part will save and proceed
    setScreen('MainMenu')
  }

  return (
    <ScreenContainer>
      <div className="py-8 space-y-4">
        <h2 className="text-2xl text-green-500 font-bold uppercase">LIFEPATH: YOUR ORIGINS</h2>
        <div className="text-xs text-cyan-400">Step {Math.min((progress?.currentStepIndex ?? 0) + 1, totalSteps)} of {totalSteps}</div>

        <Panel className="p-4">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-green-500 font-bold uppercase mb-2">Choose Lifepath</h3>
              <div className="flex gap-2 flex-wrap">
                {lifepaths.map((lp) => (
                  <Button
                    key={lp.id}
                    variant={lp.id === selectedLifepathId ? 'primary' : 'secondary'}
                    onClick={() => handleSelectLifepath(lp.id)}
                  >
                    ► {lp.name}
                  </Button>
                ))}
              </div>
            </div>

            {step ? (
              <div>
                <h4 className="text-cyan-400 uppercase mb-2">{step.prompt}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {step.choices.map((c) => (
                    <Button key={c.id} onClick={() => handleChoose(c.id)}>
                      ► {c.name}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-cyan-400">{isComplete ? 'Lifepath complete.' : 'Loading...'}</div>
            )}
          </div>
        </Panel>

        <Panel className="p-4">
          <h3 className="text-green-500 font-bold uppercase">Character Preview</h3>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="uppercase text-cyan-400 mb-1">Stats</div>
              <div>Strength: {progress?.seed.stats.strength ?? 0}</div>
              <div>Agility: {progress?.seed.stats.agility ?? 0}</div>
              <div>Insight: {progress?.seed.stats.insight ?? 0}</div>
              <div>Charisma: {progress?.seed.stats.charisma ?? 0}</div>
              <div>Fortitude: {progress?.seed.stats.fortitude ?? 0}</div>
              <div>Will: {progress?.seed.stats.will ?? 0}</div>
            </div>
            <div>
              <div className="uppercase text-cyan-400 mb-1">Traits & Deck</div>
              <div>Traits: {(progress?.seed.traitIds.length ?? 0) || 0}</div>
              <div>Deck: {(progress?.seed.deckActionCardIds.length ?? 0) || 0} cards</div>
            </div>
          </div>
        </Panel>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleBackToMenu}>◄ BACK</Button>
          <Button disabled={!isComplete} onClick={handleContinue}>► CONTINUE</Button>
        </div>
      </div>
    </ScreenContainer>
  )
}
