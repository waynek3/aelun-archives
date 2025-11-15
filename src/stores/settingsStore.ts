import { create } from 'zustand'

interface SettingsStore {
  textSize: 'sm' | 'md' | 'lg'
  reducedMotion: boolean
  setTextSize: (s: SettingsStore['textSize']) => void
  setReducedMotion: (v: boolean) => void
  showAffinityHints: boolean
  toggleAffinityHints: () => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  textSize: 'md',
  reducedMotion: false,
  setTextSize: (s) => set({ textSize: s }),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  showAffinityHints: true,
  toggleAffinityHints: () => set((state) => ({ showAffinityHints: !state.showAffinityHints })),
}))
