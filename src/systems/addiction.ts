// Addiction mechanic — Sprint 17.
// Hidden stat tracking scratcher dependency.
// All functions are pure — no side effects, no held state.

import { bal } from '../data/balance-types';

// Grow need when the player buys tickets (frequency-driven).
// Called once per BUY_TICKETS action with the total ticket count purchased.
export function growNeed(need: number, numTickets: number): number {
  return need + numTickets * bal.addiction.needGrowthRate;
}

// Gain satisfaction from completing a scratch session.
// Called at FINISH_SESSION with the total number of tickets scratched in the session.
export function gainSatisfaction(satisfaction: number, numTickets: number): number {
  return satisfaction + numTickets * bal.addiction.satisfactionPerTicket;
}

// Compute effective restingRelaxation given current addiction need.
// Addiction level = floor(need); each level subtracts restingRelaxationPenaltyPerLevel
// from the starting base. Floors at 0.
export function computeRestingRelaxation(need: number): number {
  const level = Math.floor(need);
  const penalty = level * bal.addiction.restingRelaxationPenaltyPerLevel;
  return Math.max(0, bal.starting.restingRelaxation - penalty);
}
