import { useEffect, useMemo, useState } from 'react'
import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'
import { useSettingsStore } from '@/stores/settingsStore'
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
import { getAffinityDefinition } from '@/data/affinities'
import type { ActionCard, PredicateCard } from '@/types/cards'
import type { DiceResult } from '@/lib/engine/diceSystem'
import type { Outcome } from '@/lib/engine/predicateEngine'
import { UnlockSelectionModal } from '@/components/ui/UnlockSelectionModal'
import type { UnlockResult } from '@/lib/engine/cardEvolution'

export default function GameLoopScreen() {
    const setScreen = useUIStore((s) => s.setScreen)
    const character = useGameStore((s) => s.character)
    const targetSelection = useGameStore((s) => s.targetSelection)
    const setTargetSelection = useGameStore((s) => s.setTargetSelection)
    const showNotification = useUIStore((s) => s.showNotification)
    const showAffinityHints = useSettingsStore((s) => s.showAffinityHints)
  const [loading, setLoading] = useState(true)
  const [pendingUnlock, setPendingUnlock] = useState<UnlockResult | null>(null)

  const [predicateMap, setPredicateMap] = useState<Record<string, PredicateCard>>({})
  const [actions, setActions] = useState<ActionCard[]>([])
    const [selectedActionContext, setSelectedActionContext] = useState<{ action: ActionCard; maxDuplicates: number } | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [isDead, setIsDead] = useState(false)
  const [causeOfDeath, setCauseOfDeath] = useState('')

  const handleUnlockClose = () => setPendingUnlock(null)
  const handleUnlockSelected = (cardName: string) => {
    showNotification?.(`Unlocked ${cardName}! Added to future decks.`, 5000)
    setPendingUnlock(null)
  }

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

    const actionMap = useMemo(() => {
      return actions.reduce<Record<string, ActionCard>>((map, card) => {
        map[card.id] = card
        return map
      }, {})
    }, [actions])

    const deckCounts = useMemo(() => {
      if (!character) return {}
      return character.actionDeck.reduce<Record<string, number>>((acc, cardId) => {
        acc[cardId] = (acc[cardId] ?? 0) + 1
        return acc
      }, {})
    }, [character])

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
      const deckCards = Object.entries(deckCounts)
        .map(([id, copies]) => {
          const card = actionMap[id]
          if (!card || copies <= 0) {
            return null
          }
          return { card, copies }
        })
        .filter(Boolean) as Array<{ card: ActionCard; copies: number }>

      if (deckCards.length === 0) return []

      const filtered = filterActionsByContext({
        sceneTags: currentPredicate.sceneTags || [],
        timescale: currentPredicate.timescale || 'Day',
        actions: deckCards.map(({ card }) => card),
      })
      const filteredIds = new Set(filtered.map((card) => card.id))
      return deckCards.filter(({ card }) => filteredIds.has(card.id))
    }, [currentPredicate, deckCounts, actionMap])

    const affinityHints = useMemo(() => {
      if (!character || !showAffinityHints) return []
      return Object.entries(character.affinities || {})
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 2)
        .map(([id, score]) => ({
          label: getAffinityDefinition(id)?.name ?? id,
          score,
        }))
    }, [character, showAffinityHints])

  function buildActionContext(action: ActionCard | undefined) {
    if (!action) return null
    const copies = deckCounts[action.id] ?? 0
    if (copies <= 0) return null
    return {
      action,
      maxDuplicates: Math.max(0, copies - 1),
    }
  }

  function handleSelectAction(cardId: string) {
    if (!character) return
    const action = actionMap[cardId]
    const context = buildActionContext(action)
    if (!context) {
      useUIStore.getState().showNotification('No copies of this card remain in your deck.', 3000)
      return
    }

    // Discover the action card when first used
    discoverContent('cards', cardId).catch(error => {
      console.error('Failed to discover action card:', error)
    })

    if (action?.actionType === 'Targeted') {
      const availableTargets = getAvailableTargets(
        action,
        predicateMap,
        character.worldState?.location || 'homestead'
      )

      if (availableTargets.length === 0) {
        useUIStore.getState().showNotification(
          'No valid targets available for this action',
          3000
        )
        return
      }

      setTargetSelection({
        actionId: action.id,
        availableTargets,
        selectedTarget: undefined,
        maxDuplicates: context.maxDuplicates,
      })
      setSelectedActionContext(null)
    } else if (context) {
      setTargetSelection(null)
      setSelectedActionContext(context)
    }
  }

  async function handleDiceResult(result: DiceResult) {
    if (!character || !selectedActionContext) return;
    
    // For targeted actions, use the selected target; for untargeted, use current location
    const targetPredicate = targetSelection?.selectedTarget || currentPredicate;
    if (!targetPredicate) return;
    
    try {
      // Resolve the action using the predicate engine
      const actionOutcome = await gameEngine.resolveAction({
        actionCard: selectedActionContext.action,
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
          setCauseOfDeath(determineCauseOfDeath(selectedActionContext.action, targetPredicate, result));
          return;
        }

        // Track failure if action failed
        if (!actionOutcome.success) {
          trackFailure(selectedActionContext.action.id)
            .then((unlockResult) => {
              if (unlockResult?.unlocked) {
                setPendingUnlock(unlockResult);
              }
            })
            .catch((error) => {
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
    setSelectedActionContext(null);
    setOutcome(null);
    setTargetSelection(null);
    
    // Advance turn after outcome resolution
    await useGameStore.getState().advanceTurn();
  }

  function handleTargetSelected(target: PredicateCard) {
    if (!targetSelection) return

    const action = actionMap[targetSelection.actionId]
    if (!action) return

    const context = buildActionContext(action)
    if (!context) return

    const constrainedContext = {
      action,
      maxDuplicates: Math.min(
        context.maxDuplicates,
        targetSelection.maxDuplicates ?? context.maxDuplicates
      ),
    }

    // Set the selected action and target
    setSelectedActionContext(constrainedContext)
    setTargetSelection({
      ...targetSelection,
      selectedTarget: target
    })
  }

  function handleTargetSelectionCancel() {
    setTargetSelection(null)
    setSelectedActionContext(null)
  }

  function handleDiceCancel() {
    setSelectedActionContext(null)
    if (targetSelection) {
      setTargetSelection({ ...targetSelection, selectedTarget: undefined })
    }
  }

  function handleDeathContinue() {
    // Reset death state and return to main menu
    setIsDead(false);
    setCauseOfDeath('');
    setSelectedActionContext(null);
    setTargetSelection(null);
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
          currentLocationId={character.worldState?.location}
      />
    )
  }

  // Show dice pool screen if action is selected
    if (selectedActionContext && currentPredicate) {
      const targetPredicate = targetSelection?.selectedTarget
      return (
        <DicePoolScreen
          actionCard={selectedActionContext.action}
          predicateCard={targetPredicate ?? currentPredicate}
          onResult={handleDiceResult}
          targetPredicate={targetPredicate}
          maxDuplicates={selectedActionContext.maxDuplicates}
          onCancel={handleDiceCancel}
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
            affinities={affinityHints}
            showAffinityLabel={showAffinityHints}
        />
        <div className="mt-2">
          <Button variant="secondary" onClick={() => setScreen('MainMenu')}>◄ BACK TO MENU</Button>
        </div>

        {pendingUnlock && (
          <UnlockSelectionModal
            isOpen
            onClose={handleUnlockClose}
            cardId={pendingUnlock.cardId}
            tier={pendingUnlock.tier}
            pool={pendingUnlock.pool}
            onUnlockSelected={handleUnlockSelected}
          />
        )}
      </div>
    </ScreenContainer>
  )
}
