// Spell definitions — the full spell catalog.
// Sprint 14: metadata only; spell effects are wired in Sprint 15.

import balance from './balance.json';

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

export const SPELL_CATALOG: SpellDef[] = [
  // Affinity manipulation
  {
    id: 'favor_boost',
    name: 'Minor Favor',
    description: 'Nudges a god to look your way.',
    category: 'affinity',
    level: 1,
    manaCost: 5,
    castingTime: 15,
    learningCost: 40,
    learningTime: 30,
    learningMana: 8,
  },
  {
    id: 'divine_slight',
    name: 'Divine Slight',
    description: 'Whispers insults at a god behind their back.',
    category: 'affinity',
    level: 2,
    manaCost: 10,
    castingTime: 15,
    learningCost: 80,
    learningTime: 60,
    learningMana: 15,
  },
  // Luck / odds manipulation
  {
    id: 'lucky_fingers',
    name: 'Lucky Fingers',
    description: 'Your fingertips tingle. Scratchers feel different.',
    category: 'luck',
    level: 1,
    manaCost: 6,
    castingTime: 15,
    learningCost: 50,
    learningTime: 45,
    learningMana: 10,
  },
  {
    id: 'stacked_deck',
    name: 'Stacked Deck',
    description: 'The symbols lean your way. Probably.',
    category: 'luck',
    level: 2,
    manaCost: 12,
    castingTime: 15,
    learningCost: 100,
    learningTime: 60,
    learningMana: 18,
  },
  // Chill manipulation
  {
    id: 'mellow_wave',
    name: 'Mellow Wave',
    description: 'A warm calm washes over you.',
    category: 'chill',
    level: 1,
    manaCost: 4,
    castingTime: 15,
    learningCost: 30,
    learningTime: 30,
    learningMana: 6,
  },
  {
    id: 'deep_calm',
    name: 'Deep Calm',
    description: 'Nothing bothers you. Nothing at all.',
    category: 'chill',
    level: 2,
    manaCost: 9,
    castingTime: 15,
    learningCost: 70,
    learningTime: 45,
    learningMana: 14,
  },
  // Mana restoration
  {
    id: 'mana_siphon',
    name: 'Mana Siphon',
    description: 'Pulls ambient mana from the air. Tastes like ozone.',
    category: 'mana',
    level: 1,
    manaCost: 2,
    castingTime: 15,
    learningCost: 45,
    learningTime: 30,
    learningMana: 8,
  },
  // Reveal — Crystal Ball spells (Sprint 19)
  {
    id: 'true_sight',
    name: 'True Sight',
    description: 'The Crystal Ball shows how chill you really are.',
    category: 'reveal',
    level: 1,
    manaCost: 4,
    castingTime: 15,
    learningCost: 35,
    learningTime: 30,
    learningMana: 6,
  },
  {
    id: 'inner_eye',
    name: 'Inner Eye',
    description: 'The Crystal Ball reveals the depth of your need.',
    category: 'reveal',
    level: 2,
    manaCost: 8,
    castingTime: 15,
    learningCost: 60,
    learningTime: 45,
    learningMana: 12,
  },
  {
    id: 'vital_scan',
    name: 'Vital Scan',
    description: 'The Crystal Ball peers into your body and counts the years.',
    category: 'reveal',
    level: 2,
    manaCost: 10,
    castingTime: 15,
    learningCost: 75,
    learningTime: 60,
    learningMana: 14,
  },
  // Travel
  {
    id: 'swift_step',
    name: 'Swift Step',
    description: 'Your feet move before you decide to walk.',
    category: 'travel',
    level: 1,
    manaCost: 5,
    castingTime: 15,
    learningCost: 35,
    learningTime: 30,
    learningMana: 7,
  },
  // Aging
  {
    id: 'slow_rot',
    name: 'Slow Rot',
    description: 'Time forgets about you. Briefly.',
    category: 'aging',
    level: 3,
    manaCost: 18,
    castingTime: 30,
    learningCost: 150,
    learningTime: 90,
    learningMana: 25,
  },
];

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

const universityBal = (balance as Record<string, unknown>).university as {
  bookbindingCost: number;
  bookbindingTime: number;
  bookbindingMana: number;
} | undefined;

export const BOOKBINDING_CLASS = {
  cost: universityBal?.bookbindingCost ?? 75,
  baseTime: universityBal?.bookbindingTime ?? 30,
  mana: universityBal?.bookbindingMana ?? 8,
};
