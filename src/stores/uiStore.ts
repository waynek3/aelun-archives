import { create } from 'zustand'
import type { ReactNode } from 'react'
import type { LifepathProgressState } from '@/types/lifepath'

type Screen =
  | 'MainMenu'
  | 'Lifepath'
  | 'CharacterSummary'
  | 'GameLoop'
  | 'DicePool'
  | 'Outcome'
  | 'Compendium'
  | 'Graveyard'
  | 'PauseMenu'

interface UIStore {
  screen: Screen
  modal: { open: boolean; content?: ReactNode }
  notifications: string[]
  pendingLifepath: LifepathProgressState | null
  setScreen: (s: Screen) => void
  openModal: (c?: ReactNode) => void
  closeModal: () => void
  notify: (message: string) => void
  clearNotifications: () => void
  setPendingLifepath: (lp: LifepathProgressState | null) => void
}

export const useUIStore = create<UIStore>((set) => ({
  screen: 'MainMenu',
  modal: { open: false },
  notifications: [],
  pendingLifepath: null,
  setScreen: (s) => {
    console.log('[DEBUG uiStore] setScreen called:', s)
    set({ screen: s })
  },
  openModal: (c) => {
    console.log('[DEBUG uiStore] openModal called')
    set({ modal: { open: true, content: c } })
  },
  closeModal: () => {
    console.log('[DEBUG uiStore] closeModal called')
    set({ modal: { open: false } })
  },
  notify: (message) => set((st) => ({ notifications: [...st.notifications, message] })),
  clearNotifications: () => set({ notifications: [] }),
  setPendingLifepath: (lp) => {
    console.log('[DEBUG uiStore] setPendingLifepath called:', !!lp)
    set({ pendingLifepath: lp })
  },
}))
