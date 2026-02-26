// Travel system: move between locations within a neighborhood.
// Sprint 2: same-neighborhood travel only (5 min, snapped to :15).
// Sprint 4 adds cross-neighborhood travel.

import type { GameState, LocationId } from '../state/types';
import balance from '../data/balance.json';
import { advanceClock, isCurfewBreached, applyPassout, snapToQuarter } from '../engine/time';

// ─── Travel Cost ──────────────────────────────────────────────────────────────

// Raw travel cost before snapping (always same-neighborhood in Sprint 2).
export function getTravelCostRaw(_from: LocationId, _to: LocationId): number {
  return balance.travel.sameNeighborhoodMinutes;  // 5 min
}

// How much the clock advances for this trip (snapped to :15).
export function getTravelCostDisplay(_from: LocationId, _to: LocationId): number {
  return snapToQuarter(getTravelCostRaw(_from, _to));
}

// ─── Execute Travel ───────────────────────────────────────────────────────────

// Move to a destination.
// Advances the clock, then checks curfew.
// Arriving AT the tower is always safe (even past curfew) — the player made it home.
// Arriving anywhere else at/past curfew triggers passout.
export function travel(state: GameState, destination: LocationId): GameState {
  const rawCost = getTravelCostRaw(state.currentLocation, destination);
  const newClock = advanceClock(state.clock, rawCost);
  const nextState: GameState = { ...state, clock: newClock, currentLocation: destination };

  if (isCurfewBreached(newClock, destination)) {
    return applyPassout(nextState);
  }

  return nextState;
}
