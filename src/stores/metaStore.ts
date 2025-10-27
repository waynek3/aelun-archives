import { create } from 'zustand'
import type { GraveyardEntry, MetaProgression } from '@/types/meta'

interface MetaStore {
  meta: MetaProgression | null
  setMeta: (m: MetaProgression) => void
  addGraveyardEntry: (e: GraveyardEntry) => void
}

export const useMetaStore = create<MetaStore>((set, get) => ({
  meta: null,
  setMeta: (m) => set({ meta: m }),
  addGraveyardEntry: (e) => {
    const current = get().meta
    if (!current) return
    set({ meta: { ...current, graveyard: [...current.graveyard, e] } })
  },
}))
