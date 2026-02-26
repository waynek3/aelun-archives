// Scratch-off ticket generation and payout resolution.
// All functions are pure — they take state and return new state/values.

import type { GameState, GeneratedTicket, TicketCell, CellState } from '../state/types';
import { SYMBOLS } from '../data/symbols';
import { getTicketType, TICKET_TYPES } from '../data/tickets';
import { rng, weightedRandom, randInt } from '../util/rng';
import { calcScratchTimeCost } from '../util/format';

// ─── Ticket Generation ────────────────────────────────────────────────────────

// Generate all tickets purchased in one go.
// Returns [tickets, newSeed].
export function generateTickets(
  quantities: Record<string, number>,
  seed: number,
): [GeneratedTicket[], number] {
  const tickets: GeneratedTicket[] = [];
  let s = seed;

  for (const ticketType of TICKET_TYPES) {
    const qty = quantities[ticketType.id] ?? 0;
    for (let i = 0; i < qty; i++) {
      const [ticket, nextSeed] = generateTicket(ticketType.id, s);
      tickets.push(ticket);
      s = nextSeed;
    }
  }

  return [tickets, s];
}

// Generate a single ticket. Returns [ticket, newSeed].
function generateTicket(
  typeId: string,
  seed: number,
): [GeneratedTicket, number] {
  const type = getTicketType(typeId);
  const totalCells = type.grid.rows * type.grid.cols;
  let s = seed;

  // ── Determine win or loss ──
  let r: number;
  [r, s] = rng(s);
  const isWin = r < type.winChance;

  if (isWin) {
    // ── Pick match count ──
    let matchIndex: number;
    [matchIndex, s] = weightedRandom(type.matchWeights, s);
    const matchCount = Math.min(matchIndex + 3, totalCells);  // clamp to grid

    // ── Pick winning symbol ──
    let symIdx: number;
    [symIdx, s] = randInt(SYMBOLS.length, s);
    const winningSymbolId = SYMBOLS[symIdx].id;

    // ── Pick positions for the matching symbols ──
    const positions = new Set<number>();
    while (positions.size < matchCount) {
      let pos: number;
      [pos, s] = randInt(totalCells, s);
      positions.add(pos);
    }

    // ── Fill non-winning cells without creating an accidental 3+ match ──
    const [filledCells, finalSeed] = fillLossCells(
      totalCells,
      positions,
      winningSymbolId,
      s,
    );
    s = finalSeed;

    // ── Place winning symbol at chosen positions ──
    for (const pos of positions) {
      filledCells[pos] = { symbolId: winningSymbolId, state: 0 };
    }

    // ── Look up payout ──
    const payoutIndex = Math.min(matchCount - 3, 6);
    const basePayout = type.payoutTable[payoutIndex];

    return [
      {
        typeId,
        typeName: type.name,
        cost: type.cost,
        cells: filledCells,
        rows: type.grid.rows,
        cols: type.grid.cols,
        isWin: true,
        winningSymbolId,
        matchCount,
        basePayout,
        revealed: false,
      },
      s,
    ];
  } else {
    // ── Loss: fill all cells ensuring no 3+ match ──
    const [cells, finalSeed] = fillLossCells(totalCells, new Set(), null, s);
    s = finalSeed;
    return [
      {
        typeId,
        typeName: type.name,
        cost: type.cost,
        cells,
        rows: type.grid.rows,
        cols: type.grid.cols,
        isWin: false,
        winningSymbolId: null,
        matchCount: 0,
        basePayout: 0,
        revealed: false,
      },
      s,
    ];
  }
}

// Fill `totalCells` cells randomly, excluding `reservedPositions` (which
// will later receive the winning symbol) and `excludedSymbolId` (to prevent
// it from appearing 3+ times in the fill region).
// Returns [cells, newSeed]. Cells at reserved positions are set to placeholder.
function fillLossCells(
  totalCells: number,
  reservedPositions: Set<number>,
  excludedSymbolId: number | null,
  seed: number,
): [TicketCell[], number] {
  const cells: TicketCell[] = new Array(totalCells).fill(null).map(() => ({
    symbolId: 0,
    state: 0 as CellState,
  }));
  let s = seed;

  // Track counts to avoid accidental 3+ of any non-excluded symbol.
  const counts: Record<number, number> = {};

  // Eligible symbols: all except the excluded one (if any).
  const eligible = SYMBOLS.filter(sym => sym.id !== excludedSymbolId);

  for (let i = 0; i < totalCells; i++) {
    if (reservedPositions.has(i)) continue;  // will be filled by caller

    // Filter out symbols already at count 2.
    const available = eligible.filter(sym => (counts[sym.id] ?? 0) < 2);

    let pick: number;
    if (available.length === 0) {
      // Extremely unlikely with 30 symbols and ≤20 cells, but fall back.
      [pick, s] = randInt(eligible.length, s);
      const sym = eligible[pick];
      cells[i] = { symbolId: sym.id, state: 0 };
      counts[sym.id] = (counts[sym.id] ?? 0) + 1;
    } else {
      [pick, s] = randInt(available.length, s);
      const sym = available[pick];
      cells[i] = { symbolId: sym.id, state: 0 };
      counts[sym.id] = (counts[sym.id] ?? 0) + 1;
    }
  }

  return [cells, s];
}

// ─── Scratch Session ──────────────────────────────────────────────────────────

// Create a scratch session from a set of ticket quantities and current state.
// Returns [newState].
export function startScratchSession(
  state: GameState,
  quantities: Record<string, number>,
): GameState {
  const totalCost = Object.entries(quantities).reduce((sum, [typeId, qty]) => {
    return sum + getTicketType(typeId).cost * qty;
  }, 0);

  if (totalCost === 0) return state;
  if (state.cash < totalCost) return state;  // can't afford — caller should validate

  const [tickets, newSeed] = generateTickets(quantities, state.rngSeed);
  const numTickets = tickets.length;
  const timeCostMinutes = calcScratchTimeCost(numTickets);

  return {
    ...state,
    phase: 'scratching',
    cash: state.cash - totalCost,
    rngSeed: newSeed,
    scratchSession: {
      tickets,
      currentTicketIndex: 0,
      timeCostMinutes,
      totalPayout: 0,
      totalCost,
    },
  };
}

// ─── Cell Reveal ─────────────────────────────────────────────────────────────

// Advance a cell's state by one step.
// If advancing the last cell completes the ticket, apply payout and mark revealed.
export function scratchCell(
  state: GameState,
  cellIndex: number,
): GameState {
  if (!state.scratchSession) return state;

  const session = state.scratchSession;
  const ticketIdx = session.currentTicketIndex;
  if (ticketIdx >= session.tickets.length) return state;

  const ticket = session.tickets[ticketIdx];
  if (ticket.revealed) return state;

  const cell = ticket.cells[cellIndex];
  if (!cell || cell.state >= 4) return state;

  // Clone tickets array and the specific ticket.
  const newTickets = [...session.tickets];
  const newCells = [...ticket.cells];
  newCells[cellIndex] = { ...cell, state: (cell.state + 1) as CellState };

  const allRevealed = newCells.every(c => c.state >= 4);

  const newTicket: GeneratedTicket = {
    ...ticket,
    cells: newCells,
    revealed: allRevealed,
  };
  newTickets[ticketIdx] = newTicket;

  let newCash = state.cash;
  let newTotalPayout = session.totalPayout;
  let newBestSingleWin = state.bestSingleWin;
  let newTotalScratched = state.totalTicketsScratched;

  if (allRevealed) {
    // Apply payout immediately when ticket is fully revealed.
    newCash += newTicket.basePayout;
    newTotalPayout += newTicket.basePayout;
    newBestSingleWin = Math.max(newBestSingleWin, newTicket.basePayout);
    newTotalScratched += 1;
  }

  return {
    ...state,
    cash: newCash,
    bestSingleWin: newBestSingleWin,
    totalTicketsScratched: newTotalScratched,
    scratchSession: {
      ...session,
      tickets: newTickets,
      totalPayout: newTotalPayout,
    },
  };
}

// ─── Ticket Navigation ────────────────────────────────────────────────────────

// Advance to the next ticket (called after the current one is fully revealed).
export function advanceTicket(state: GameState): GameState {
  if (!state.scratchSession) return state;

  const session = state.scratchSession;
  const currentTicket = session.tickets[session.currentTicketIndex];

  // Only advance if the current ticket is fully revealed.
  if (!currentTicket?.revealed) return state;

  return {
    ...state,
    scratchSession: {
      ...session,
      currentTicketIndex: session.currentTicketIndex + 1,
    },
  };
}

// End the scratch session and return to the store.
export function finishSession(state: GameState): GameState {
  return {
    ...state,
    phase: 'playing',
    currentLocation: 'bodega',  // Sprint 2: player finishes at the bodega counter
    scratchSession: null,
  };
}
