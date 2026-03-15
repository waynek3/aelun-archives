// Addiction mechanic — Sprint 17.
// Hidden stat tracking scratcher dependency.
// All functions are pure — no side effects, no held state.

import balance from '../data/balance.json';

// Grow need when the player buys tickets (frequency-driven).
// Called once per BUY_TICKETS action with the total ticket count purchased.
export function growNeed(need: number, numTickets: number): number {
  return need + numTickets * balance.addiction.needGrowthRate;
}

// Gain satisfaction from completing a scratch session.
// Called at FINISH_SESSION with the total number of tickets scratched in the session.
export function gainSatisfaction(satisfaction: number, numTickets: number): number {
  return satisfaction + numTickets * balance.addiction.satisfactionPerTicket;
}

// Compute effective restingRelaxation given current addiction need.
// Addiction level = floor(need); each level subtracts restingRelaxationPenaltyPerLevel
// from the starting base. Floors at 0.
export function computeRestingRelaxation(need: number): number {
  const level = Math.floor(need);
  const penalty = level * balance.addiction.restingRelaxationPenaltyPerLevel;
  return Math.max(0, balance.starting.restingRelaxation - penalty);
}
