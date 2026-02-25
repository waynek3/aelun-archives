import type { ColorScheme } from '../state/types';

// All actions a player can take in Sprint 1.
// Each action is a discriminated union so dispatch can exhaustively handle them.

export type GameAction =
  // Buy a batch of tickets and begin a scratch session.
  | { type: 'BUY_TICKETS'; quantities: Record<string, number> }
  // Tap a scratch cell to advance its reveal state (0→1→2→3→4).
  | { type: 'SCRATCH_CELL'; cellIndex: number }
  // Move to the next ticket after the current one is fully revealed.
  | { type: 'ADVANCE_TICKET' }
  // End the scratch session and return to the store.
  | { type: 'FINISH_SESSION' }
  // Toggle the color scheme.
  | { type: 'SET_THEME'; scheme: ColorScheme }
  // Start a fresh game (clears save).
  | { type: 'NEW_GAME' };
