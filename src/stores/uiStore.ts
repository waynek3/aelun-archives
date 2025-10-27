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
  setScreen: (s) => set({ screen: s }),
  openModal: (c) => set({ modal: { open: true, content: c } }),
  closeModal: () => set({ modal: { open: false } }),
  notify: (message) => set((st) => ({ notifications: [...st.notifications, message] })),
  clearNotifications: () => set({ notifications: [] }),
  setPendingLifepath: (lp) => set({ pendingLifepath: lp }),
}))
