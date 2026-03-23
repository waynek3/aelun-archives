import type { GameState, SaveData } from './types';
import { SAVE_VERSION } from './initial';

const SAVE_KEY = 'chill_wizard_save';
const THEME_KEY = 'chill_wizard_theme';

// ─── Migrations ───────────────────────────────────────────────────────────────

// Keyed by the version they migrate FROM → TO.
// e.g. migrations[1] upgrades a version-1 save to version-2.
const MIGRATIONS: Record<number, (s: unknown) => unknown> = {
  // Sprint 1 → Sprint 2: add time/location fields.
  // Old saves had phase='playing' which meant "at bodega"; map to currentLocation='bodega'.
  1: (s: unknown) => {
    const state = s as Record<string, unknown>;
    return {
      ...state,
      clock: 600,
      day: 1,
      month: 1,
      year: 1,
      currentNeighborhood: 'the_skids',
      currentLocation: state.phase === 'playing' ? 'bodega' : 'tower',
      lastPassoutPenalty: null,
    };
  },
  // Sprint 2 → Sprint 3/4: rename 'bodega' → 'the_skids_bodega'.
  2: (s: unknown) => {
    const state = s as Record<string, unknown>;
    return {
      ...state,
      currentLocation: state.currentLocation === 'bodega'
        ? 'the_skids_bodega'
        : state.currentLocation,
    };
  },
  // Sprint 4 → Sprint 5: add chill meter.
  3: (s: unknown) => {
    const state = s as Record<string, unknown>;
    return { ...state, chill: 50 };
  },
  // Sprint 5 → Sprint 6: add mana pool.
  4: (s: unknown) => {
    const state = s as Record<string, unknown>;
    return { ...state, mana: 20, maxMana: 30 };
  },
  // Sprint 6 → Sprint 7: add inventory.
  5: (s: unknown) => {
    const state = s as Record<string, unknown>;
    return { ...state, inventory: [null, null, null, null, null] };
  },
  // Sprint 7 → Sprint 8: add player stats.
  6: (s: unknown) => {
    const state = s as Record<string, unknown>;
    return {
      ...state,
      intelligence: 10,
      bookbinding: 1,
      wizardFame: 0,
      relaxationRate: 1.0,
      restingRelaxation: 50,
    };
  },
  // Sprint 8 → Sprint 9: add god affinity and prayer buffs.
  7: (s: unknown) => {
    const state = s as Record<string, unknown>;
    return {
      ...state,
      affinity: {
        mesin: 0, gul: 0, klossa: 0, skarhol: 0, marena: 0,
        azorius: 0, ara: 0, finhorn: 0, beroan: 0, sofiel: 0,
      },
      prayerBuffs: [],
    };
  },
  // Sprint 9 → Sprint 11: add birthdayMonth (default 1 = January for existing runs).
  8: (s: unknown) => {
    const state = s as Record<string, unknown>;
    return { ...state, birthdayMonth: 1 };
  },
  // Sprint 11 → Sprint 13: add furniture with one basic bed.
  9: (s: unknown) => {
    const state = s as Record<string, unknown>;
    return {
      ...state,
      furniture: [{ type: 'bed', id: 'bed_basic', name: 'Dusty Mattress', quality: 1 }],
    };
  },
  // Sprint 13 → Sprint 14: add spellbook fields.
  10: (s: unknown) => {
    const state = s as Record<string, unknown>;
    return {
      ...state,
      knownSpells: [],
      equippedSpells: [],
    };
  },
  // Sprint 14 → Sprint 15: add luck buff field.
  11: (s: unknown) => {
    const state = s as Record<string, unknown>;
    return { ...state, luckBuff: null };
  },
  // Sprint 16 → Sprint 17: add hidden addiction stats.
  12: (s: unknown) => {
    const state = s as Record<string, unknown>;
    return { ...state, addictionNeed: 0, addictionSatisfaction: 0 };
  },
  // Sprint 17 → Sprint 19: add age health score stub and crystal ball reveal.
  13: (s: unknown) => {
    const state = s as Record<string, unknown>;
    return { ...state, ageHealthScore: 100, crystalBallReveal: null };
  },
  // Sprint 19 → Sprint 20: add wizard projects.
  14: (s: unknown) => {
    const state = s as Record<string, unknown>;
    return { ...state, activeProject: null };
  },
  // Sprint 20 → Sprint 22+23: add Dad's House loans and random events.
  15: (s: unknown) => {
    const state = s as Record<string, unknown>;
    return {
      ...state,
      dadAlive: true,
      loan: null,
      activeEvent: null,
      eventsTriggered: {},
      notableEvents: [],
      loanSharkDebt: 0,
      loanSharkInterestRate: 0,
      lastBirthdayYear: 0,
    };
  },
  // Sprint 26: add peakWizardFame tracking.
  16: (s: unknown) => {
    const state = s as Record<string, unknown>;
    return { ...state, peakWizardFame: 0 };
  },
};

function migrate(data: SaveData): GameState {
  let v = data.version;
  let s: unknown = data.state;
  while (v < SAVE_VERSION) {
    const migFn = MIGRATIONS[v];
    if (migFn) s = migFn(s);
    v++;
  }
  return s as GameState;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function saveGame(state: GameState): void {
  try {
    const data: SaveData = {
      version: SAVE_VERSION,
      state,
      timestamp: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors — game keeps running from in-memory state.
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data: SaveData = JSON.parse(raw);
    if (typeof data.version !== 'number' || !data.state) return null;
    const state = migrate(data);
    // Guard against stale saves (e.g. from a previous game version) where
    // phase is 'scratching' but scratchSession was never written or used a
    // different field name.  Without this check renderScratch clears the
    // container and returns early, producing a blank blue screen.
    if (state.phase === 'scratching' && !state.scratchSession) {
      return { ...state, phase: 'playing', scratchSession: null };
    }
    return state;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

// Color scheme is stored separately so it persists across new runs.
export function saveTheme(scheme: string): void {
  try {
    localStorage.setItem(THEME_KEY, scheme);
  } catch {
    // ignore
  }
}

export function loadTheme(): string | null {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}
