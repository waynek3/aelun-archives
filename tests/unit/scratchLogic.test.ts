import { describe, it, expect } from 'vitest'
import {
  generateTicket,
  getRowResults,
  isFullyScratched,
  getTicketPrize,
} from '@/lib/scratchLogic'
import type { Ticket } from '@/lib/scratchLogic'

// ─── helpers ─────────────────────────────────────────────────────────────────

function revealAll(ticket: Ticket): Ticket {
  return {
    ...ticket,
    cells: ticket.cells.map(row => row.map(cell => ({ ...cell, revealed: true }))),
    fullyScratched: true,
  }
}

function revealRow(ticket: Ticket, rowIndex: number): Ticket {
  return {
    ...ticket,
    cells: ticket.cells.map((row, ri) =>
      ri === rowIndex ? row.map(cell => ({ ...cell, revealed: true })) : row
    ),
  }
}

// ─── generateTicket ──────────────────────────────────────────────────────────

describe('generateTicket', () => {
  it('returns a ticket with the correct type and cost for $1', () => {
    const t = generateTicket(1)
    expect(t.type).toBe(1)
    expect(t.cost).toBe(1)
    expect(t.name).toBe('LUCKY TRIO')
  })

  it('returns a ticket with the correct type and cost for $5', () => {
    const t = generateTicket(5)
    expect(t.type).toBe(5)
    expect(t.cost).toBe(5)
    expect(t.name).toBe('DOUBLE DOWN')
  })

  it('returns a ticket with the correct type and cost for $10', () => {
    const t = generateTicket(10)
    expect(t.type).toBe(10)
    expect(t.cost).toBe(10)
    expect(t.name).toBe('BIG SCORE')
  })

  it('gives $1 ticket exactly 1 row of 3 cells', () => {
    const t = generateTicket(1)
    expect(t.cells).toHaveLength(1)
    expect(t.cells[0]).toHaveLength(3)
  })

  it('gives $5 ticket exactly 2 rows of 3 cells', () => {
    const t = generateTicket(5)
    expect(t.cells).toHaveLength(2)
    t.cells.forEach(row => expect(row).toHaveLength(3))
  })

  it('gives $10 ticket exactly 3 rows of 3 cells', () => {
    const t = generateTicket(10)
    expect(t.cells).toHaveLength(3)
    t.cells.forEach(row => expect(row).toHaveLength(3))
  })

  it('starts with all cells unrevealed', () => {
    for (const type of [1, 5, 10] as const) {
      const t = generateTicket(type)
      t.cells.forEach(row => row.forEach(cell => expect(cell.revealed).toBe(false)))
    }
  })

  it('starts not fully scratched', () => {
    for (const type of [1, 5, 10] as const) {
      expect(generateTicket(type).fullyScratched).toBe(false)
    }
  })

  it('assigns unique ids to consecutive tickets', () => {
    const a = generateTicket(1)
    const b = generateTicket(1)
    expect(a.id).not.toBe(b.id)
  })

  it('cells contain only valid symbols', () => {
    const VALID = new Set(['$', '7', '*', '#', '!'])
    for (const type of [1, 5, 10] as const) {
      const t = generateTicket(type)
      t.cells.forEach(row => row.forEach(cell => expect(VALID.has(cell.symbol)).toBe(true)))
    }
  })
})

// ─── $1 ticket prize consistency ─────────────────────────────────────────────

describe('$1 ticket prize correctness', () => {
  it('pays $5 when all three symbols match', () => {
    // Force a known three-of-a-kind ticket
    const t: Ticket = {
      id: 'test-1',
      type: 1,
      cost: 1,
      name: 'LUCKY TRIO',
      cells: [[
        { symbol: '$', revealed: false },
        { symbol: '$', revealed: false },
        { symbol: '$', revealed: false },
      ]],
      prize: 5,
      fullyScratched: false,
      winMessage: '★ THREE OF A KIND! ★',
    }
    expect(t.prize).toBe(5)
  })

  it('pays $2 when exactly two symbols match', () => {
    const t: Ticket = {
      id: 'test-2',
      type: 1,
      cost: 1,
      name: 'LUCKY TRIO',
      cells: [[
        { symbol: '$', revealed: false },
        { symbol: '$', revealed: false },
        { symbol: '7', revealed: false },
      ]],
      prize: 2,
      fullyScratched: false,
      winMessage: '★ MATCH! ★',
    }
    expect(t.prize).toBe(2)
  })

  it('pays $0 when no symbols match', () => {
    const t: Ticket = {
      id: 'test-3',
      type: 1,
      cost: 1,
      name: 'LUCKY TRIO',
      cells: [[
        { symbol: '$', revealed: false },
        { symbol: '7', revealed: false },
        { symbol: '*', revealed: false },
      ]],
      prize: 0,
      fullyScratched: false,
      winMessage: '',
    }
    expect(t.prize).toBe(0)
  })
})

// ─── isFullyScratched ─────────────────────────────────────────────────────────

describe('isFullyScratched', () => {
  it('returns false when no cells are revealed', () => {
    expect(isFullyScratched(generateTicket(1))).toBe(false)
  })

  it('returns false when only some cells are revealed', () => {
    const t = generateTicket(5)
    const partial = revealRow(t, 0)
    expect(isFullyScratched(partial)).toBe(false)
  })

  it('returns true when all cells are revealed', () => {
    const t = revealAll(generateTicket(1))
    expect(isFullyScratched(t)).toBe(true)
  })

  it('returns true for all ticket types when fully revealed', () => {
    for (const type of [1, 5, 10] as const) {
      expect(isFullyScratched(revealAll(generateTicket(type)))).toBe(true)
    }
  })
})

// ─── getRowResults ────────────────────────────────────────────────────────────

describe('getRowResults', () => {
  it('returns allRevealed=false for unrevealed rows', () => {
    const t = generateTicket(5)
    const results = getRowResults(t)
    results.forEach(r => expect(r.allRevealed).toBe(false))
  })

  it('detects a winning row with correct prize for $5 ticket', () => {
    const t: Ticket = {
      id: 'test-4',
      type: 5,
      cost: 5,
      name: 'DOUBLE DOWN',
      cells: [
        [
          { symbol: '$', revealed: true },
          { symbol: '$', revealed: true },
          { symbol: '$', revealed: true },
        ],
        [
          { symbol: '7', revealed: true },
          { symbol: '*', revealed: true },
          { symbol: '#', revealed: true },
        ],
      ],
      prize: 10,
      fullyScratched: true,
      winMessage: '★ ROW 1: $10! ★',
    }
    const results = getRowResults(t)
    expect(results[0].win).toBe(true)
    expect(results[0].prize).toBe(10)
    expect(results[1].win).toBe(false)
    expect(results[1].prize).toBe(0)
  })

  it('detects a winning row 2 with $25 prize for $5 ticket', () => {
    const t: Ticket = {
      id: 'test-5',
      type: 5,
      cost: 5,
      name: 'DOUBLE DOWN',
      cells: [
        [
          { symbol: '$', revealed: true },
          { symbol: '7', revealed: true },
          { symbol: '*', revealed: true },
        ],
        [
          { symbol: '#', revealed: true },
          { symbol: '#', revealed: true },
          { symbol: '#', revealed: true },
        ],
      ],
      prize: 25,
      fullyScratched: true,
      winMessage: '★ ROW 2: $25! ★',
    }
    const results = getRowResults(t)
    expect(results[0].win).toBe(false)
    expect(results[1].win).toBe(true)
    expect(results[1].prize).toBe(25)
  })

  it('detects all three winning rows for $10 ticket with correct prizes', () => {
    const t: Ticket = {
      id: 'test-6',
      type: 10,
      cost: 10,
      name: 'BIG SCORE',
      cells: [
        [{ symbol: '$', revealed: true }, { symbol: '$', revealed: true }, { symbol: '$', revealed: true }],
        [{ symbol: '7', revealed: true }, { symbol: '7', revealed: true }, { symbol: '7', revealed: true }],
        [{ symbol: '*', revealed: true }, { symbol: '*', revealed: true }, { symbol: '*', revealed: true }],
      ],
      prize: 170,
      fullyScratched: true,
      winMessage: '★ ALL ROWS! ★',
    }
    const results = getRowResults(t)
    expect(results[0]).toEqual({ win: true, prize: 20, allRevealed: true })
    expect(results[1]).toEqual({ win: true, prize: 50, allRevealed: true })
    expect(results[2]).toEqual({ win: true, prize: 100, allRevealed: true })
  })

  it('returns allRevealed=false for a row with even one hidden cell', () => {
    const t: Ticket = {
      id: 'test-7',
      type: 5,
      cost: 5,
      name: 'DOUBLE DOWN',
      cells: [
        [
          { symbol: '$', revealed: true },
          { symbol: '$', revealed: false },  // hidden
          { symbol: '$', revealed: true },
        ],
        [
          { symbol: '7', revealed: true },
          { symbol: '7', revealed: true },
          { symbol: '7', revealed: true },
        ],
      ],
      prize: 0,
      fullyScratched: false,
      winMessage: '',
    }
    const results = getRowResults(t)
    expect(results[0].allRevealed).toBe(false)
    expect(results[1].allRevealed).toBe(true)
  })
})

// ─── getTicketPrize ───────────────────────────────────────────────────────────

describe('getTicketPrize', () => {
  it('returns the ticket prize value', () => {
    const t = generateTicket(1)
    expect(getTicketPrize(t)).toBe(t.prize)
  })
})

// ─── prize sanity across many generated tickets ───────────────────────────────

describe('prize values are always valid', () => {
  it('$1 ticket prize is always 0, 2, or 5', () => {
    for (let i = 0; i < 200; i++) {
      const prize = generateTicket(1).prize
      expect([0, 2, 5]).toContain(prize)
    }
  })

  it('$5 ticket prize is always a multiple of 5 in range [0, 35]', () => {
    const valid = new Set([0, 10, 25, 35])
    for (let i = 0; i < 200; i++) {
      const prize = generateTicket(5).prize
      expect(valid.has(prize)).toBe(true)
    }
  })

  it('$10 ticket prize is always in the set of valid combinations', () => {
    const valid = new Set([0, 20, 50, 70, 100, 120, 150, 170])
    for (let i = 0; i < 200; i++) {
      const prize = generateTicket(10).prize
      expect(valid.has(prize)).toBe(true)
    }
  })
})
