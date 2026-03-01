// Pure time utilities for the in-game clock and calendar.
// All functions are pure — no side effects, no state mutation.

import type { GameState } from '../state/types';
import balance from '../data/balance.json';

// ─── Clock Math ───────────────────────────────────────────────────────────────

// Snap a raw arrival time (in minutes) to the next :15 boundary.
// e.g. 605 → 615, 615 → 615, 620 → 630
export function snapToQuarter(minutes: number): number {
  if (minutes <= 0) return 0;
  return Math.ceil(minutes / 15) * 15;
}

// Advance the clock by a raw cost (snapped to next :15 boundary on arrival).
// Travel cost of 5 min from 10:00 → arrival snaps to 10:15.
// Snap applies to the ARRIVAL time, not just the cost.
export function advanceClock(clock: number, costMinutes: number): number {
  return snapToQuarter(clock + costMinutes);
}

// Preview what the clock would be after an action (same as advanceClock).
export function previewClock(clock: number, costMinutes: number): number {
  return advanceClock(clock, costMinutes);
}

// ─── Curfew ───────────────────────────────────────────────────────────────────

// Has the curfew been breached?
// Arriving AT the tower is always safe (player made it home).
// Arriving anywhere else at or past curfew → pass out.
export function isCurfewBreached(
  clock: number,
  location: GameState['currentLocation'],
): boolean {
  return clock >= balance.dayCycle.curfewTime && location !== 'tower';
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

// Advance by one calendar day (30-day months, 12 months/year).
export function advanceDay(
  day: number,
  month: number,
  year: number,
): { day: number; month: number; year: number } {
  let d = day + 1;
  let m = month;
  let y = year;
  if (d > 30) { d = 1; m++; }
  if (m > 12) { m = 1; y++; }
  return { day: d, month: m, year: y };
}

// ─── Passout ──────────────────────────────────────────────────────────────────

// Apply a passout: charge cash penalty, restore chill to neighborhood ratio,
// advance to next day, reset to tower.
// Call this when isCurfewBreached returns true.
export function applyPassout(state: GameState): GameState {
  const penalties = balance.passout as Record<string, { cashPenalty: number; chillRestore: number; manaRestore: number }>;
  const entry = penalties[state.currentNeighborhood];
  const penalty = entry?.cashPenalty ?? 20;
  const chillRestore = entry?.chillRestore ?? 0.15;
  const manaRestore = entry?.manaRestore ?? 0.25;
  const cal = advanceDay(state.day, state.month, state.year);
  return {
    ...state,
    phase: 'passedout',
    cash: Math.max(0, state.cash - penalty),
    chill: Math.round(chillRestore * 100),
    mana: Math.round(manaRestore * state.maxMana),
    clock: balance.dayCycle.wakeTime,
    currentLocation: 'tower',
    lastPassoutPenalty: penalty,
    scratchSession: null,
    ...cal,
  };
}

// ─── Formatting ───────────────────────────────────────────────────────────────

// Format minutes-from-midnight as 12-hour time.
// 600 → "10:00 AM", 780 → "1:00 PM", 1560 → "2:00 AM"
export function formatClock(clock: number): string {
  const total = clock % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

// Format the in-game calendar date.
// 1/1/1 → "Day 1  Mo 1  Yr 1"
export function formatDate(day: number, month: number, year: number): string {
  return `Day ${day}  Mo ${month}  Yr ${year}`;
}
