// Screen manager — decides which screen to show and how to update it.
// Handles the distinction between full re-renders and in-place updates.
// Sprint 2: manages a persistent HUD above the screen area.

import type { GameState } from '../state/types';
import type { GameAction } from '../engine/actions';
import { renderHUD } from './hud';
import { renderBodega } from './screens/bodega';
import { renderScratch, updateScratchCell } from './screens/scratch';
import { renderTower } from './screens/tower';
import { renderTemple } from './screens/temple';
import { renderPassout } from './screens/passout';
import { renderGameOver } from './screens/game-over';
import { renderSetup } from './screens/setup';
import { getLocationType } from '../data/locations';

type Dispatch = (action: GameAction) => void;

type ScreenId = 'setup' | 'tower' | 'bodega' | 'temple' | 'scratch' | 'passout' | 'game_over' | 'none';
let currentScreen: ScreenId = 'none';

// The last action that triggered a render — used to decide partial vs full update.
let lastActionType: string | null = null;

export function setLastAction(type: string): void {
  lastActionType = type;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

// Lazily create the #hud and #screen child elements inside #app.
// This lets the container start as a plain div and gains structure on first render.
let _hudEl: HTMLElement | null = null;
let _screenEl: HTMLElement | null = null;

function ensureLayout(container: HTMLElement): { hud: HTMLElement; screen: HTMLElement } {
  if (!_hudEl || !container.contains(_hudEl)) {
    container.innerHTML = '';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';

    _hudEl = document.createElement('div');
    _hudEl.id = 'hud';

    _screenEl = document.createElement('div');
    _screenEl.id = 'screen';

    container.appendChild(_hudEl);
    container.appendChild(_screenEl);
    currentScreen = 'none';  // force full re-render after layout reset
  }
  return { hud: _hudEl!, screen: _screenEl! };
}

// ─── Screen Routing ───────────────────────────────────────────────────────────

function getTargetScreen(state: GameState): ScreenId {
  if (state.phase === 'setup') return 'setup';
  if (state.phase === 'game_over') return 'game_over';
  if (state.phase === 'passedout') return 'passout';
  if (state.phase === 'scratching' && state.scratchSession !== null) return 'scratch';
  if (state.phase === 'playing') {
    const locType = getLocationType(state.currentLocation);
    if (locType === 'tower') return 'tower';
    if (locType === 'temple') return 'temple';
    return 'bodega';  // all store-type locations use bodega screen
  }
  return 'bodega';  // fallback
}

export function render(
  state: GameState,
  container: HTMLElement,
  dispatch: Dispatch,
): void {
  const { hud, screen } = ensureLayout(container);

  // HUD always re-renders (it's fast text — no perf concern).
  renderHUD(state, hud);

  const targetScreen = getTargetScreen(state);

  if (targetScreen === 'setup') {
    currentScreen = 'setup';
    renderSetup(state, screen, dispatch);
  } else if (targetScreen === 'scratch') {
    if (currentScreen !== 'scratch') {
      // Full render on screen transition.
      currentScreen = 'scratch';
      renderScratch(state, screen, dispatch);
    } else if (lastActionType === 'SCRATCH_CELL') {
      // In-place cell update — avoid full re-render for tap responsiveness.
      if (state.scratchSession) {
        updateScratchCell(state, _lastCellIndex);
      }
    } else {
      // ADVANCE_TICKET or any other scratch-phase action → full re-render.
      renderScratch(state, screen, dispatch);
    }
  } else if (targetScreen === 'tower') {
    currentScreen = 'tower';
    renderTower(state, screen, dispatch);
  } else if (targetScreen === 'temple') {
    currentScreen = 'temple';
    renderTemple(state, screen, dispatch);
  } else if (targetScreen === 'passout') {
    currentScreen = 'passout';
    renderPassout(state, screen, dispatch);
  } else if (targetScreen === 'game_over') {
    currentScreen = 'game_over';
    renderGameOver(state, screen, dispatch);
  } else {
    // bodega
    currentScreen = 'bodega';
    renderBodega(state, screen, dispatch);
  }

  lastActionType = null;
}

// Store the cell index for in-place scratch updates.
let _lastCellIndex = 0;
export function setLastCellIndex(idx: number): void {
  _lastCellIndex = idx;
}
