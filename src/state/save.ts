import type { GameState, SaveData } from './types';
import { SAVE_VERSION } from './initial';

const SAVE_KEY = 'chill_wizard_save';
const THEME_KEY = 'chill_wizard_theme';

// ─── Migrations ───────────────────────────────────────────────────────────────

// Keyed by the version they migrate FROM → TO.
// e.g. migrations[1] upgrades a version-1 save to version-2.
const MIGRATIONS: Record<number, (s: unknown) => unknown> = {
  // Sprint 1 is version 1; no migrations needed yet.
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
