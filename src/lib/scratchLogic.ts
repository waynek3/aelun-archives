// Scratch-off ticket generation and win logic

export type TicketType = 1 | 5 | 10

export interface ScratchCell {
  symbol: string
  revealed: boolean
}

export interface Ticket {
  id: string
  type: TicketType
  cost: number
  name: string
  cells: ScratchCell[][]  // rows of cells
  prize: number           // 0 until fully scratched
  fullyScratched: boolean
  winMessage: string
}

// Symbols used across tickets
const SYMBOLS = ['$', '7', '*', '#', '!']

function randomSymbol(): string {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
}

function randomSymbolExcept(exclude: string): string {
  const options = SYMBOLS.filter(s => s !== exclude)
  return options[Math.floor(Math.random() * options.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeCells(symbols: string[][]): ScratchCell[][] {
  return symbols.map(row => row.map(symbol => ({ symbol, revealed: false })))
}

// ─── $1 TICKET: Lucky Trio ───────────────────────────────────────────────────
// 3 cells in one row
// Match 2 → $2 | Match 3 → $5
// Win rates: 10% three-match, 20% two-match, 70% no-match
// EV ≈ $0.90

function generateDollarTicket(): Omit<Ticket, 'id'> {
  const roll = Math.random()
  let symbols: string[]
  let prize: number

  if (roll < 0.10) {
    // 3 of a kind
    const sym = randomSymbol()
    symbols = [sym, sym, sym]
    prize = 5
  } else if (roll < 0.30) {
    // 2 of a kind
    const sym = randomSymbol()
    const other = randomSymbolExcept(sym)
    symbols = shuffle([sym, sym, other])
    prize = 2
  } else {
    // All different
    const [a] = shuffle(SYMBOLS)
    const b = randomSymbolExcept(a)
    let c = randomSymbolExcept(a)
    if (c === b) c = randomSymbolExcept(a === b ? a : b)
    symbols = [a, b, c]
    prize = 0
  }

  return {
    type: 1,
    cost: 1,
    name: 'LUCKY TRIO',
    cells: makeCells([symbols]),
    prize,
    fullyScratched: false,
    winMessage: prize === 5 ? '★ THREE OF A KIND! ★' : prize === 2 ? '★ MATCH! ★' : '',
  }
}

// ─── $5 TICKET: Double Down ──────────────────────────────────────────────────
// 2 rows of 3 cells
// Row 1 match → $10 | Row 2 match → $25 | Both → $35
// Each row: 28% chance of matching
// EV ≈ $4.41 (house edge ~12%)

function generateFiveTicket(): Omit<Ticket, 'id'> {
  function makeRow(winChance: number): [string[], boolean] {
    if (Math.random() < winChance) {
      const sym = randomSymbol()
      return [[sym, sym, sym], true]
    } else {
      const sym = randomSymbol()
      const b = randomSymbolExcept(sym)
      const c = randomSymbolExcept(sym)
      return [shuffle([sym, b, c]), false]
    }
  }

  const [row1, row1win] = makeRow(0.28)
  const [row2, row2win] = makeRow(0.20)

  let prize = 0
  const wins: string[] = []
  if (row1win) { prize += 10; wins.push('ROW 1: $10') }
  if (row2win) { prize += 25; wins.push('ROW 2: $25') }

  return {
    type: 5,
    cost: 5,
    name: 'DOUBLE DOWN',
    cells: makeCells([row1, row2]),
    prize,
    fullyScratched: false,
    winMessage: wins.length > 0 ? '★ ' + wins.join(' + ') + '! ★' : '',
  }
}

// ─── $10 TICKET: Big Score ───────────────────────────────────────────────────
// 3 rows of 3 cells
// Row 1 match → $20 | Row 2 match → $50 | Row 3 match → $100
// Win chances: row1 25%, row2 16%, row3 8%
// EV ≈ $8.75 (house edge ~12%)

function generateTenTicket(): Omit<Ticket, 'id'> {
  function makeRow(winChance: number): [string[], boolean] {
    if (Math.random() < winChance) {
      const sym = randomSymbol()
      return [[sym, sym, sym], true]
    } else {
      const sym = randomSymbol()
      const b = randomSymbolExcept(sym)
      const c = randomSymbolExcept(sym)
      return [shuffle([sym, b, c]), false]
    }
  }

  const [row1, row1win] = makeRow(0.25)
  const [row2, row2win] = makeRow(0.16)
  const [row3, row3win] = makeRow(0.08)

  let prize = 0
  const wins: string[] = []
  if (row1win) { prize += 20;  wins.push('ROW 1: $20') }
  if (row2win) { prize += 50;  wins.push('ROW 2: $50') }
  if (row3win) { prize += 100; wins.push('ROW 3: $100') }

  return {
    type: 10,
    cost: 10,
    name: 'BIG SCORE',
    cells: makeCells([row1, row2, row3]),
    prize,
    fullyScratched: false,
    winMessage: wins.length > 0 ? '★ ' + wins.join(' + ') + '! ★' : '',
  }
}

let ticketCounter = 0

export function generateTicket(type: TicketType): Ticket {
  const base = type === 1
    ? generateDollarTicket()
    : type === 5
    ? generateFiveTicket()
    : generateTenTicket()

  return {
    ...base,
    id: `ticket-${Date.now()}-${ticketCounter++}`,
  }
}

export function getTicketPrize(ticket: Ticket): number {
  return ticket.prize
}

// Returns row-by-row win status (for live highlighting as rows are scratched)
export function getRowResults(ticket: Ticket): { win: boolean; prize: number; allRevealed: boolean }[] {
  const rowPrizes: number[] = ticket.type === 1 ? [0] : ticket.type === 5 ? [10, 25] : [20, 50, 100]

  return ticket.cells.map((row, i) => {
    const allRevealed = row.every(c => c.revealed)
    if (!allRevealed) return { win: false, prize: 0, allRevealed: false }
    const symbols = row.map(c => c.symbol)
    const win = symbols.every(s => s === symbols[0])
    return { win, prize: win ? rowPrizes[i] : 0, allRevealed: true }
  })
}

export function isFullyScratched(ticket: Ticket): boolean {
  return ticket.cells.every(row => row.every(c => c.revealed))
}
