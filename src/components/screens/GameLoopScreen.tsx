import { useEffect, useMemo, useState } from 'react'
import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'
import { ScenePanel } from '@/components/game/ScenePanel'
import { ActionWheel } from '@/components/game/ActionWheel'
import { StatusBar } from '@/components/game/StatusBar'
import { getPredicateCards, getActionsArray } from '@/lib/utils/content'
import { filterActionsByContext } from '@/lib/engine/actionFilter'

export default function GameLoopScreen() {
  const setScreen = useUIStore((s) => s.setScreen)
  const character = useGameStore((s) => s.character)
  const [loading, setLoading] = useState(true)

  const [predicateMap, setPredicateMap] = useState<Record<string, any>>({})
  const [actions, setActions] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const [preds, acts] = await Promise.all([getPredicateCards(), getActionsArray()])
      if (!mounted) return
      setPredicateMap(preds)
      setActions(acts)
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const currentPredicate = useMemo(() => {
    const id = character?.worldState.location || 'homestead'
    return predicateMap[id] ?? null
  }, [predicateMap, character?.worldState.location])

  const availableActions = useMemo(() => {
    if (!currentPredicate) return []
    return filterActionsByContext({
      sceneTags: currentPredicate.sceneTags,
      timescale: currentPredicate.timescale,
      actions,
    })
  }, [currentPredicate, actions])

  function handleSelectAction(cardId: string) {
    // For Sprint 7: click handling only, no resolution yet
    // In a later sprint, this will navigate to DicePool or Target selection
    console.log('Selected action', cardId)
  }

  return (
    <ScreenContainer>
      <div className="py-6 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-green-500 font-bold uppercase">Current Scene</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setScreen('PauseMenu')}>≡ MENU</Button>
          </div>
        </header>

        {loading ? (
          <div className="panel p-4 text-sm text-cyan-400">Loading...</div>
        ) : (
          <>
            <ScenePanel predicate={currentPredicate} />
            <ActionWheel actions={availableActions} onSelect={handleSelectAction} />
            <StatusBar
              hp={{ current: character?.currentHP ?? 10, max: character?.maxHP ?? 10 }}
              traitsCount={character?.traits.length ?? 0}
              turn={character?.turnCount ?? 0}
              timescale={currentPredicate?.timescale ?? 'Day'}
            />
            <div className="mt-2">
              <Button variant="secondary" onClick={() => setScreen('MainMenu')}>◄ BACK TO MENU</Button>
            </div>
          </>
        )}
      </div>
    </ScreenContainer>
  )
}
