// Spellbook system — pure functions for learning, equipping, and casting spells.
// Sprint 14: no spell effects yet (Sprint 15).

import { snapToQuarter } from '../engine/time';
import { getAllSpells, type SpellDef } from '../data/spells';
import { randInt } from '../util/rng';
import balance from '../data/balance.json';

const universityBal = (balance as Record<string, unknown>).university as {
  intelligenceSpeedFactor: number;
};

const spellbookBal = (balance as Record<string, unknown>).spellbook as {
  addTimeMultiplier: number;
  removeTimeMultiplier: number;
};

// ─── Daily Class Selection ───────────────────────────────────────────────────

// Deterministic: same day/month/year always produces the same 3 classes.
// Uses a seed derived from calendar date (not the game RNG seed, so it's
// consistent regardless of player actions earlier that day).
export function getDailyClasses(
  day: number,
  month: number,
  year: number,
  numClasses: number,
): SpellDef[] {
  const allSpells = getAllSpells();
  if (numClasses >= allSpells.length) return [...allSpells];

  // Derive a day-specific seed from the calendar date.
  let seed = (year * 1000000 + month * 10000 + day * 100 + 7) | 0;

  const indices: number[] = [];
  const available = allSpells.map((_, i) => i);

  for (let i = 0; i < numClasses; i++) {
    const [roll, nextSeed] = randInt(available.length, seed);
    seed = nextSeed;
    indices.push(available[roll]);
    available.splice(roll, 1);
  }

  return indices.map(i => allSpells[i]);
}

// ─── Learning Time ───────────────────────────────────────────────────────────

// Apply intelligence modifier to base learning time, then snap to :15.
// Formula: adjustedTime = baseTime / (1 + intelligence * factor)
// At INT 10, factor 0.05 → divisor 1.5 → 2/3 of base time.
export function calcLearningTime(baseTime: number, intelligence: number): number {
  const factor = universityBal.intelligenceSpeedFactor;
  const adjusted = baseTime / (1 + intelligence * factor);
  return Math.max(15, snapToQuarter(Math.ceil(adjusted)));
}

// ─── Spellbook Capacity ──────────────────────────────────────────────────────

export function canAddToBook(equippedSpells: string[], bookbinding: number): boolean {
  return equippedSpells.length < bookbinding;
}

export function addToBook(
  equippedSpells: string[],
  spellId: string,
  bookbinding: number,
): string[] | null {
  if (equippedSpells.length >= bookbinding) return null;
  if (equippedSpells.includes(spellId)) return null;
  return [...equippedSpells, spellId];
}

export function removeFromBook(equippedSpells: string[], spellId: string): string[] {
  return equippedSpells.filter(id => id !== spellId);
}

// ─── Known Spells ────────────────────────────────────────────────────────────

export function isSpellKnown(knownSpells: string[], spellId: string): boolean {
  return knownSpells.includes(spellId);
}

export function learnSpell(knownSpells: string[], spellId: string): string[] {
  if (knownSpells.includes(spellId)) return knownSpells;
  return [...knownSpells, spellId];
}

// ─── Time Costs for Book Management ──────────────────────────────────────────

// Adding a spell to the book: 3x casting time, snapped to :15, min 15.
export function calcAddToBookTime(castingTime: number): number {
  return Math.max(15, snapToQuarter(Math.ceil(castingTime * spellbookBal.addTimeMultiplier)));
}

// Removing a spell from the book: 0.5x casting time, snapped to :15, min 15.
export function calcRemoveFromBookTime(castingTime: number): number {
  return Math.max(15, snapToQuarter(Math.ceil(castingTime * spellbookBal.removeTimeMultiplier)));
}
