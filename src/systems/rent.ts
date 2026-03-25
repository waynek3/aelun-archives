// Rent system — checks if rent is due and applies game over if unpaid.
// Called after any action that advances the calendar day.
// Pure functions only; no side effects.

import type { GameState } from '../state/types';
import { bal } from '../data/balance-types';

// Compute days survived from the game calendar.
// Day 1, Month 1, Year 1 = 0 days survived.
// 30-day months, 12-month years.
export function calcDaysSurvived(day: number, month: number, year: number): number {
  return (year - 1) * 360 + (month - 1) * 30 + (day - 1);
}

// Check if rent is due and apply it.
// Call this after any day-advance action that may land on dueDay (= 1).
//   - day !== dueDay  →  no-op, return state unchanged
//   - day === dueDay, cash >= amount  →  deduct rent, continue
//   - day === dueDay, cash < amount   →  game over
export function checkRent(state: GameState): GameState {
  if (state.day !== bal.rent.dueDay) return state;
  const rentAmount = bal.rent.amount;
  if (state.cash < rentAmount) {
    return { ...state, phase: 'game_over' };
  }
  return { ...state, cash: state.cash - rentAmount };
}
