import { create } from 'zustand'
import type { ActionCard, PredicateCard } from '@/types/cards'
import type { Character } from '@/types/character'
import type { DicePool, GameState, TurnPhase } from '@/types/game'
import { saveCharacter } from '@/lib/persistence/saveManager'
import { useUIStore } from './uiStore'

interface GameStore extends GameState {
  setCharacter: (c: Character | null) => void
  setPredicate: (p: PredicateCard | null) => void
  setTurnPhase: (phase: TurnPhase) => void
  setAvailableActions: (a: ActionCard[]) => void
  setDicePool: (pool: DicePool) => void
  setRecentOutcome: (o: GameState['recentOutcome']) => void
  advanceTurn: () => Promise<void>
  autoSave: () => Promise<void>
  updateCharacter: (updates: Partial<Character>) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
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

  updateCharacter: (updates) => {
    const { character } = get()
    if (!character) return
    
    const updatedCharacter = { ...character, ...updates }
    set({ character: updatedCharacter })
  },

  advanceTurn: async () => {
    const { character } = get()
    if (!character) return

    const updatedCharacter = {
      ...character,
      turnCount: (character.turnCount || 0) + 1,
      // Add any time-based effects here
    }

    set({ character: updatedCharacter })
    
    // Auto-save after turn advancement
    await get().autoSave()
  },

  autoSave: async () => {
    const { character } = get()
    if (!character) return

    try {
      await saveCharacter(character)
      useUIStore.getState().showNotification('Game saved', 2000)
    } catch (error) {
      console.error('Auto-save failed:', error)
      useUIStore.getState().showNotification('Save failed', 3000)
    }
  },
}))
