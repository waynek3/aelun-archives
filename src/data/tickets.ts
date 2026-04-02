// Ticket type definitions.
// payoutTable[i] = payout for (i+3) matching symbols.
// Index 0 = 3 matches, index 6 = 9+ matches.
// All amounts in whole dollars.
//
// matchWeights[i] = relative weight for (i+3) matches, conditional on winning.
// Index 0 = 3 matches (most common win), etc.
//
// To add or tune tickets, edit tickets.json — no code changes needed.

import rawTickets from './tickets.json';

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

export const TICKET_TYPES: TicketType[] = rawTickets as TicketType[];

export function getTicketType(id: string): TicketType {
  const t = TICKET_TYPES.find(t => t.id === id);
  if (!t) throw new Error(`Unknown ticket type: ${id}`);
  return t;
}
