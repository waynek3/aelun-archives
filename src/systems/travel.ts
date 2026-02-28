// Travel system: move between locations.
// Sprint 2: same-neighborhood travel only (5 min, snapped to :15).
// Sprint 4: cross-neighborhood travel (15 min raw); currentNeighborhood updated on travel.

import type { GameState, LocationId } from '../state/types';
import balance from '../data/balance.json';
import { advanceClock, isCurfewBreached, applyPassout, snapToQuarter } from '../engine/time';
import { getLocationNeighborhood } from '../data/locations';

// ─── Travel Cost ──────────────────────────────────────────────────────────────

// Raw travel cost before snapping.
// Same neighborhood: 5 min. Different neighborhood: 15 min.
export function getTravelCostRaw(from: LocationId, to: LocationId): number {
  const fromNeighborhood = getLocationNeighborhood(from);
  const toNeighborhood   = getLocationNeighborhood(to);
  if (fromNeighborhood === toNeighborhood) {
    return balance.travel.sameNeighborhoodMinutes;
  }
  return balance.travel.crossNeighborhoodMinutes;
}

// How much the clock visually advances for this trip (snapped to :15).
export function getTravelCostDisplay(from: LocationId, to: LocationId): number {
  return snapToQuarter(getTravelCostRaw(from, to));
}

// ─── Execute Travel ───────────────────────────────────────────────────────────

// Move to a destination.
// Advances the clock, updates location and neighborhood, then checks curfew.
// Arriving AT the tower is always safe (even past curfew) — the player made it home.
// Arriving anywhere else at/past curfew triggers passout.
export function travel(state: GameState, destination: LocationId): GameState {
  const rawCost = getTravelCostRaw(state.currentLocation, destination);
  const newClock = advanceClock(state.clock, rawCost);
  const nextState: GameState = {
    ...state,
    clock: newClock,
    currentLocation: destination,
    currentNeighborhood: getLocationNeighborhood(destination),
  };

  if (isCurfewBreached(newClock, destination)) {
    return applyPassout(nextState);
  }

  return nextState;
}
