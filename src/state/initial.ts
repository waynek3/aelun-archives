import type { GameState } from './types';
import balance from '../data/balance.json';

export const SAVE_VERSION = 12;

export function createInitialState(): GameState {
  return {
    phase: 'setup',
    cash: balance.starting.cash,
    // Sprint 2: time & calendar
    clock: balance.dayCycle.wakeTime,  // 600 = 10:00 AM
    day: 1,
    month: 1,
    year: 1,
    // Sprint 2: location
    currentNeighborhood: 'the_skids',
    currentLocation: 'tower',          // new runs start at the tower
    lastPassoutPenalty: null,
    // Sprint 5: chill meter
    chill: balance.starting.chill,
    // Sprint 6: mana pool
    mana: balance.starting.mana,
    maxMana: balance.starting.maxMana,
    // Sprint 7: inventory
    inventory: [null, null, null, null, null],
    // Sprint 8: player stats
    intelligence: balance.starting.intelligence,
    bookbinding: balance.starting.bookbinding,
    wizardFame: balance.starting.wizardFame,
    relaxationRate: balance.starting.relaxationRate,
    restingRelaxation: balance.starting.restingRelaxation,
    // Sprint 13: furniture (start with one basic bed)
    furniture: [{ type: 'bed' as const, id: 'bed_basic', name: 'Dusty Mattress', quality: 1 }],
    // Sprint 14: spellbook
    knownSpells: [],
    equippedSpells: [],
    // Sprint 15: spell buffs
    luckBuff: null,
    // Sprint 11: birthday month (set by player during setup)
    birthdayMonth: 1,
    // Sprint 9: god affinity
    affinity: {
      mesin: 0, gul: 0, klossa: 0, skarhol: 0, marena: 0,
      azorius: 0, ara: 0, finhorn: 0, beroan: 0, sofiel: 0,
    },
    prayerBuffs: [],
    // Scratch session
    scratchSession: null,
    totalTicketsScratched: 0,
    bestSingleWin: 0,
    rngSeed: (Math.random() * 0xFFFFFFFF) | 0,
    colorScheme: 'blue',
  };
}
