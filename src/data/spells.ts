// Spell definitions — the full spell catalog.
// Sprint 14: metadata only; spell effects are wired in Sprint 15.
// To add or tune spells, edit spells.json — no code changes needed.

import rawSpells from './spells.json';
import { bal } from './balance-types';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SpellId = string;

export type SpellCategory =
  | 'affinity'
  | 'luck'
  | 'chill'
  | 'mana'
  | 'reveal'
  | 'travel'
  | 'aging';

export interface SpellDef {
  id: SpellId;
  name: string;
  description: string;       // flavor text shown in university and spellbook
  category: SpellCategory;
  level: number;              // 1–3; higher = more expensive to learn & cast
  manaCost: number;           // mana consumed per casting
  castingTime: number;        // minutes to cast (snapped to :15 by dispatch)
  learningCost: number;       // $ to attend class
  learningTime: number;       // base minutes to learn (before INT modifier)
  learningMana: number;       // mana consumed during learning
}

// ─── Spell Catalog ───────────────────────────────────────────────────────────

export const SPELL_CATALOG: SpellDef[] = rawSpells as SpellDef[];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getSpellDef(id: SpellId): SpellDef {
  const spell = SPELL_CATALOG.find(s => s.id === id);
  if (!spell) throw new Error(`Unknown spell: ${id}`);
  return spell;
}

export function getAllSpells(): SpellDef[] {
  return SPELL_CATALOG;
}

export function getSpellsByCategory(category: SpellCategory): SpellDef[] {
  return SPELL_CATALOG.filter(s => s.category === category);
}

// ─── Bookbinding class data ──────────────────────────────────────────────────
// Bookbinding is learned at the university like a spell, but it's a skill.
// Cost/time/mana come from balance.json → university section.

const universityBal = bal.university;

export const BOOKBINDING_CLASS = {
  cost: universityBal.bookbindingCost,
  baseTime: universityBal.bookbindingTime,
  mana: universityBal.bookbindingMana,
};
