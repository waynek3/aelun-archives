import { create } from 'zustand'
import type { ActionCard, PredicateCard } from '@/types/cards'
import type { Character } from '@/types/character'
import type { DicePool, GameState, TurnPhase } from '@/types/game'

interface GameStore extends GameState {
  setCharacter: (c: Character | null) => void
  setPredicate: (p: PredicateCard | null) => void
  setTurnPhase: (phase: TurnPhase) => void
  setAvailableActions: (a: ActionCard[]) => void
  setDicePool: (pool: DicePool) => void
  setRecentOutcome: (o: GameState['recentOutcome']) => void
}

export const useGameStore = create<GameStore>((set) => ({
  character: null,
  currentPredicate: null,
  activeTimescale: 'Day',
  turnPhase: 'scene_display',
  availableActions: [],
  dicePool: { advantageDice: 1, bonusDice: [] },
  recentOutcome: null,

  setCharacter: (c) => set({ character: c }),
  setPredicate: (p) => set({ currentPredicate: p }),
  setTurnPhase: (phase) => set({ turnPhase: phase }),
  setAvailableActions: (a) => set({ availableActions: a }),
  setDicePool: (pool) => set({ dicePool: pool }),
  setRecentOutcome: (o) => set({ recentOutcome: o }),
}))
