import React, { useEffect, useMemo, useState, useRef } from 'react'
import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'
import { ScenePanel } from '@/components/game/ScenePanel'
import { ActionWheel } from '@/components/game/ActionWheel'
import { StatusBar } from '@/components/game/StatusBar'
import { getPredicateCards, getActionsArray } from '@/lib/utils/content'
import { filterActionsByContext } from '@/lib/engine/actionFilter'
import type { ActionCard, PredicateCard } from '@/types/cards'
import type { DiceResult } from '@/lib/engine/diceSystem'

export default function GameLoopScreen() {
  // DEBUG: Track render count
  const renderCount = useRef(0)
  renderCount.current++
  
  const setScreen = useUIStore((s) => s.setScreen)
  const character = useGameStore((s) => s.character)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    console.log('[DEBUG GameLoopScreen] Render #', renderCount.current, 'Loading:', loading, 'Has character:', !!character)
    if (renderCount.current > 50) {
      console.error('[DEBUG GameLoopScreen] INFINITE LOOP DETECTED!')
    }
  })

  const [predicateMap, setPredicateMap] = useState<Record<string, PredicateCard>>({})
  const [actions, setActions] = useState<ActionCard[]>([])
  const [selectedAction, setSelectedAction] = useState<ActionCard | null>(null)
  const [, setDiceResult] = useState<DiceResult | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [preds, acts] = await Promise.all([getPredicateCards(), getActionsArray()])
        if (!mounted) return
        setPredicateMap(preds)
        setActions(acts)
      } catch (error) {
        console.error('Failed to load game content:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const currentPredicate = useMemo(() => {
    if (!character) return null
    const id = character.worldState?.location || 'homestead'
    return predicateMap[id] ?? null
  }, [predicateMap, character])

  const availableActions = useMemo(() => {
    if (!currentPredicate) return []
    return filterActionsByContext({
      sceneTags: currentPredicate.sceneTags || [],
      timescale: currentPredicate.timescale || 'Day',
      actions,
    })
  }, [currentPredicate, actions])

  function handleSelectAction(cardId: string) {
    const action = actions.find(a => a.id === cardId)
    if (action) {
      setSelectedAction(action)
      // For Sprint 8: Navigate to dice pool screen
      // In Sprint 9: This will handle targeted vs untargeted actions differently
    }
  }

  function handleDiceResult(result: DiceResult) {
    setDiceResult(result)
    // For Sprint 9: This will trigger outcome resolution
    console.log('Dice result:', result)
  }

  // function handleBackToGame() {
  //   setSelectedAction(null)
  //   setDiceResult(null)
  // }

  // Show loading or redirect if no character
  if (loading) {
    return (
      <ScreenContainer>
        <div className="py-6 space-y-4">
          <div className="panel p-4 text-sm text-cyan-400">Loading...</div>
        </div>
      </ScreenContainer>
    )
  }

  if (!character) {
    return (
      <ScreenContainer>
        <div className="py-6 space-y-4">
          <div className="panel p-4 text-sm text-cyan-400 mb-4">
            No character found. Please start a new adventure.
          </div>
          <Button onClick={() => setScreen('MainMenu')}>◄ RETURN TO MAIN MENU</Button>
        </div>
      </ScreenContainer>
    )
  }

  // Show dice pool screen if action is selected
  if (selectedAction && currentPredicate) {
    // Dynamic import for dice pool screen
    const DicePoolScreen = React.lazy(() => import('./DicePoolScreen'))
    return (
      <React.Suspense fallback={<div className="panel p-4 text-sm text-cyan-400">Loading dice pool...</div>}>
        <DicePoolScreen
          actionCard={selectedAction}
          predicateCard={currentPredicate}
          onResult={handleDiceResult}
        />
      </React.Suspense>
    )
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

        <ScenePanel predicate={currentPredicate} />
        <ActionWheel actions={availableActions} onSelect={handleSelectAction} />
        <StatusBar
          hp={{ current: character.currentHP ?? 10, max: character.maxHP ?? 10 }}
          traitsCount={character.traits?.length ?? 0}
          turn={character.turnCount ?? 0}
          timescale={currentPredicate?.timescale ?? 'Day'}
        />
        <div className="mt-2">
          <Button variant="secondary" onClick={() => setScreen('MainMenu')}>◄ BACK TO MENU</Button>
        </div>
      </div>
    </ScreenContainer>
  )
}
