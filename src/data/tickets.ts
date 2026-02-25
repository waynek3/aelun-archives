// Ticket type definitions for Sprint 1.
// payoutTable[i] = payout for (i+3) matching symbols.
// Index 0 = 3 matches, index 6 = 9+ matches.
// All amounts in whole dollars.
//
// matchWeights[i] = relative weight for (i+3) matches, conditional on winning.
// Index 0 = 3 matches (most common win), etc.

export interface TicketType {
  id: string;
  name: string;
  cost: number;
  grid: { rows: number; cols: number };
  winChance: number;
  // payoutTable[0] = payout for 3 matches, [1] = 4 matches, ..., [6] = 9+ matches
  payoutTable: [number, number, number, number, number, number, number];
  // matchWeights[0] = weight for 3 matches, ..., [6] = 9+ matches (conditional on winning)
  matchWeights: [number, number, number, number, number, number, number];
}

export const TICKET_TYPES: TicketType[] = [
  {
    id: 'lucky_9',
    name: 'Lucky 9',
    cost: 1,
    grid: { rows: 3, cols: 3 },  // 9 cells
    winChance: 0.20,
    payoutTable:  [2,   5,   12,  30,   75,  200,  500],
    matchWeights: [70,  15,   8,   4,    2,  0.8,  0.2],
  },
  {
    id: 'double_down',
    name: 'Double Down',
    cost: 2,
    grid: { rows: 3, cols: 3 },  // 9 cells
    winChance: 0.22,
    payoutTable:  [4,   10,  25,  60,  150,  400, 1000],
    matchWeights: [70,  15,   8,   4,    2,  0.8,  0.2],
  },
  {
    id: 'arcane_five',
    name: 'Arcane Five',
    cost: 5,
    grid: { rows: 3, cols: 5 },  // 15 cells
    winChance: 0.25,
    payoutTable:  [10,  25,  60, 150,  350,  900, 2500],
    matchWeights: [55,  20,  12,   7,    4,    1.5, 0.5],
  },
  {
    id: 'wizards_dozen',
    name: "Wizard's Dozen",
    cost: 10,
    grid: { rows: 4, cols: 4 },  // 16 cells
    winChance: 0.28,
    payoutTable:  [20,  50, 120, 300,  700, 1800, 5000],
    matchWeights: [50,  22,  14,   8,    4,    1.5, 0.5],
  },
  {
    id: 'grand_arcana',
    name: 'Grand Arcana',
    cost: 20,
    grid: { rows: 4, cols: 5 },  // 20 cells
    winChance: 0.32,
    payoutTable:  [40, 100, 250, 600, 1500, 4000, 10000],
    matchWeights: [45,  23,  16,   9,    5,    1.5,  0.5],
  },
];

export function getTicketType(id: string): TicketType {
  const t = TICKET_TYPES.find(t => t.id === id);
  if (!t) throw new Error(`Unknown ticket type: ${id}`);
  return t;
}
