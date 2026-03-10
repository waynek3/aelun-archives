import type { ColorScheme, LocationId } from '../state/types';

// All actions a player can take.
// Each action is a discriminated union so dispatch can exhaustively handle them.

export type GameAction =
  // Buy tickets and/or snacks at a bodega.  Snacks are added to inventory;
  // if tickets > 0, a scratch session begins.
  | { type: 'BUY_TICKETS'; quantities: Record<string, number>; snacks?: string[] }
  // Tap a scratch cell to advance its reveal state (0→1→2→3→4).
  | { type: 'SCRATCH_CELL'; cellIndex: number }
  // Move to the next ticket after the current one is fully revealed.
  | { type: 'ADVANCE_TICKET' }
  // End the scratch session and return to the store.
  | { type: 'FINISH_SESSION' }
  // Toggle the color scheme.
  | { type: 'SET_THEME'; scheme: ColorScheme }
  // Start a fresh game (clears save).
  | { type: 'NEW_GAME' }
  // Sprint 2: travel to a location within the current neighborhood.
  | { type: 'TRAVEL'; destination: LocationId }
  // Sprint 2: sleep at the tower (ends the current day, advances to next morning).
  | { type: 'SLEEP' }
  // Sprint 2: dismiss the passout screen after waking up.
  | { type: 'WAKE_UP' }
  // Sprint 7: consume a snack from inventory (instant, no time cost).
  | { type: 'CONSUME_SNACK'; slotIndex: number }
  // Sprint 9: temple actions (god inferred from currentLocation).
  | { type: 'DONATE_PRIVATE'; amount: number }
  | { type: 'DONATE_PUBLIC'; amount: number }
  | { type: 'PRAY'; duration: number }
  // Sprint 11: set birthday month during new-run setup.
  | { type: 'SET_BIRTHDAY'; month: number };
