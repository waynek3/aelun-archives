import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateTicket, isFullyScratched } from '@/lib/scratchLogic'
import type { Ticket, TicketType } from '@/lib/scratchLogic'

export type Screen = 'store' | 'scratch' | 'endofday'

export interface HighScore {
  date: string
  finalMoney: number
  ticketsBought: number
  netChange: number
}

const STARTING_MONEY = 20
const MAX_HIGH_SCORES = 10

interface GameState {
  screen: Screen
  money: number
  startMoney: number
  activeTicket: Ticket | null
  sessionTickets: Ticket[]
  highScores: HighScore[]

  // Actions
  goToStore: () => void
  buyTicket: (type: TicketType) => void
  scratchCell: (row: number, col: number) => void
  scratchAll: () => void
  endDay: () => void
  startNewDay: () => void
  goToEndOfDay: () => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      screen: 'store',
      money: STARTING_MONEY,
      startMoney: STARTING_MONEY,
      activeTicket: null,
      sessionTickets: [],
      highScores: [],

      goToStore: () => set({ screen: 'store' }),

      buyTicket: (type: TicketType) => {
        const { money } = get()
        if (money < type) return
        const ticket = generateTicket(type)
        set(s => ({
          money: s.money - type,
          activeTicket: ticket,
          sessionTickets: [...s.sessionTickets, ticket],
          screen: 'scratch',
        }))
      },

      scratchCell: (row: number, col: number) => {
        const { activeTicket } = get()
        if (!activeTicket) return

        const newCells = activeTicket.cells.map((r, ri) =>
          r.map((cell, ci) =>
            ri === row && ci === col ? { ...cell, revealed: true } : cell
          )
        )

        const updated: Ticket = { ...activeTicket, cells: newCells }
        updated.fullyScratched = isFullyScratched(updated)

        set(s => ({
          activeTicket: updated,
          // Also update in sessionTickets
          sessionTickets: s.sessionTickets.map(t =>
            t.id === updated.id ? updated : t
          ),
        }))

        // If fully scratched, collect the prize
        if (updated.fullyScratched) {
          set(s => ({ money: s.money + updated.prize }))
        }
      },

      scratchAll: () => {
        const { activeTicket } = get()
        if (!activeTicket) return

        const newCells = activeTicket.cells.map(row =>
          row.map(cell => ({ ...cell, revealed: true }))
        )
        const updated: Ticket = { ...activeTicket, cells: newCells, fullyScratched: true }

        set(s => ({
          activeTicket: updated,
          sessionTickets: s.sessionTickets.map(t =>
            t.id === updated.id ? updated : t
          ),
          money: s.money + updated.prize,
        }))
      },

      goToEndOfDay: () => set({ screen: 'endofday' }),

      endDay: () => {
        const { money, startMoney, sessionTickets, highScores } = get()
        const netChange = money - startMoney
        const newScore: HighScore = {
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
          finalMoney: money,
          ticketsBought: sessionTickets.length,
          netChange,
        }

        const updated = [...highScores, newScore]
          .sort((a, b) => b.finalMoney - a.finalMoney)
          .slice(0, MAX_HIGH_SCORES)

        set({
          highScores: updated,
          screen: 'endofday',
        })
      },

      startNewDay: () => {
        set({
          screen: 'store',
          money: STARTING_MONEY,
          startMoney: STARTING_MONEY,
          activeTicket: null,
          sessionTickets: [],
        })
      },
    }),
    {
      name: 'scratch-game-storage',
      // Only persist high scores between sessions; reset game state each load
      partialize: (state) => ({ highScores: state.highScores }),
    }
  )
)
