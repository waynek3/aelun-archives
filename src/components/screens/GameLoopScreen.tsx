import { useEffect, useMemo, useState } from 'react'
import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'
import { ScenePanel } from '@/components/game/ScenePanel'
import { ActionWheel } from '@/components/game/ActionWheel'
import { StatusBar } from '@/components/game/StatusBar'
import { getPredicateCards, getActionsArray } from '@/lib/utils/content'
import { filterActionsByContext } from '@/lib/engine/actionFilter'
import { getAvailableTargets } from '@/lib/engine/targetFilter'
import { gameEngine } from '@/lib/utils/workerClient'
import { executeOutcomeEffects } from '@/lib/engine/outcomeExecutor'
import { discoverContent } from '@/lib/engine/discoveryManager'
import { trackFailure } from '@/lib/engine/cardEvolution'
import OutcomeScreen from './OutcomeScreen'
import DicePoolScreen from './DicePoolScreen'
import DeathScreen from './DeathScreen'
import TargetSelectionScreen from './TargetSelectionScreen'
import type { ActionCard, PredicateCard } from '@/types/cards'
import type { DiceResult } from '@/lib/engine/diceSystem'
import type { Outcome } from '@/lib/engine/predicateEngine'

export default function GameLoopScreen() {
  const setScreen = useUIStore((s) => s.setScreen)
  const character = useGameStore((s) => s.character)
  const targetSelection = useGameStore((s) => s.targetSelection)
  const setTargetSelection = useGameStore((s) => s.setTargetSelection)
  const [loading, setLoading] = useState(true)

  const [predicateMap, setPredicateMap] = useState<Record<string, PredicateCard>>({})
  const [actions, setActions] = useState<ActionCard[]>([])
  const [selectedAction, setSelectedAction] = useState<ActionCard | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [isDead, setIsDead] = useState(false)
  const [causeOfDeath, setCauseOfDeath] = useState('')

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

  // Discover location when it changes
  useEffect(() => {
    if (currentPredicate) {
      discoverContent('predicates', currentPredicate.id).catch(error => {
        console.error('Failed to discover location:', error)
      })
    }
  }, [currentPredicate])

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
    if (!action) return

    // Discover the action card when first used
    discoverContent('cards', cardId).catch(error => {
      console.error('Failed to discover action card:', error)
    })

    if (action.actionType === 'Targeted') {
      // For targeted actions, show target selection
      const availableTargets = getAvailableTargets(
        action,
        Object.values(predicateMap),
        character?.worldState?.location || 'homestead'
      )

      if (availableTargets.length === 0) {
        // No valid targets, show error
        useUIStore.getState().showNotification(
          'No valid targets available for this action',
          3000
        )
        return
      }

      setTargetSelection({
        actionId: action.id,
        availableTargets,
        selectedTarget: undefined
      })
    } else {
      // For untargeted actions, go directly to dice pool
      setSelectedAction(action)
    }
  }

  async function handleDiceResult(result: DiceResult) {
    if (!character || !selectedAction) return;
    
    // For targeted actions, use the selected target; for untargeted, use current location
    const targetPredicate = targetSelection?.selectedTarget || currentPredicate;
    if (!targetPredicate) return;
    
    try {
      // Resolve the action using the predicate engine
      const actionOutcome = await gameEngine.resolveAction({
        actionCard: selectedAction,
        predicateCard: targetPredicate,
        character,
        diceResult: result
      });
      
      // Apply effects to character
      const { updatedCharacter, notifications, isDead } = executeOutcomeEffects(character, actionOutcome.effects);
      
      // Update character in store
      useGameStore.getState().setCharacter(updatedCharacter);
      
      // Show notifications
      notifications.forEach(notification => {
        useUIStore.getState().notify(notification);
      });
      
      // Check for death
      if (isDead) {
        setIsDead(true);
        setCauseOfDeath(determineCauseOfDeath(selectedAction, targetPredicate, result));
        return;
      }
      
      // Track failure if action failed
      if (!actionOutcome.success) {
        trackFailure(selectedAction.id).then(unlockResult => {
          if (unlockResult?.unlocked) {
            useUIStore.getState().showNotification(
              `Card evolution unlocked! Choose from: ${unlockResult.pool.join(', ')}`,
              5000
            );
          }
        }).catch(error => {
          console.error('Failed to track failure:', error);
        });
      }
      
      // Set outcome for display
      setOutcome(actionOutcome);
      
    } catch (error) {
      console.error('Failed to resolve action:', error);
      // Show error outcome
      setOutcome({
        text: 'Something went wrong with your action.',
        effects: [],
        stateChanges: {},
        success: false
      });
    }
  }

  function determineCauseOfDeath(action: ActionCard, predicate: PredicateCard, result: DiceResult): string {
    // Simple cause of death determination based on context
    if (action.tags.includes('Combat')) {
      return 'Killed in combat';
    }
    if (predicate.sceneTags.includes('Dangerous')) {
      return 'Succumbed to danger';
    }
    if (result.total < 5) {
      return 'Failed catastrophically';
    }
    return 'Met an untimely end';
  }

  async function handleContinueFromOutcome() {
    // Reset state and return to game loop
    setSelectedAction(null);
    setOutcome(null);
    setTargetSelection(null);
    
    // Advance turn after outcome resolution
    await useGameStore.getState().advanceTurn();
  }

  function handleTargetSelected(target: PredicateCard) {
    if (!targetSelection) return

    const action = actions.find(a => a.id === targetSelection.actionId)
    if (!action) return

    // Set the selected action and target
    setSelectedAction(action)
    setTargetSelection({
      ...targetSelection,
      selectedTarget: target
    })
  }

  function handleTargetSelectionCancel() {
    setTargetSelection(null)
  }

  function handleDeathContinue() {
    // Reset death state and return to main menu
    setIsDead(false);
    setCauseOfDeath('');
    setScreen('MainMenu');
  }

  // function handleBackToGame() {
  //   setSelectedAction(null)
  //   setDiceResult(null)
  // }

  // Show loading or redirect if no character
  if (loading) {
    return (
      <ScreenContainer>
        <div className="py-12 flex items-center justify-center">
          <LoadingSpinner message="Loading adventure..." size="lg" />
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

  // Show death screen if character is dead
  if (isDead && character) {
    return (
      <DeathScreen
        character={character}
        causeOfDeath={causeOfDeath}
        onContinue={handleDeathContinue}
      />
    )
  }

  // Show outcome screen if we have an outcome
  if (outcome) {
    return (
      <OutcomeScreen
        outcome={outcome}
        onContinue={handleContinueFromOutcome}
      />
    )
  }

  // Show target selection screen if we're selecting a target
  if (targetSelection && !targetSelection.selectedTarget) {
    return (
      <TargetSelectionScreen
        onTargetSelected={handleTargetSelected}
        onCancel={handleTargetSelectionCancel}
      />
    )
  }

  // Show dice pool screen if action is selected
  if (selectedAction && currentPredicate) {
    const targetPredicate = targetSelection?.selectedTarget
    return (
      <DicePoolScreen
        actionCard={selectedAction}
        predicateCard={currentPredicate}
        onResult={handleDiceResult}
        targetPredicate={targetPredicate}
      />
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
