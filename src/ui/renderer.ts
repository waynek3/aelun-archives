// Screen manager — decides which screen to show and how to update it.
// Handles the distinction between full re-renders and in-place updates.
// Sprint 2: manages a persistent HUD above the screen area.

import type { GameState } from '../state/types';
import type { GameAction } from '../engine/actions';
import { renderHUD } from './hud';
import { resetAllModals } from './modal';
import { renderBodega } from './screens/bodega';
import { renderScratch, updateScratchCell } from './screens/scratch';
import { renderTower } from './screens/tower';
import { renderTemple } from './screens/temple';
import { renderPassout } from './screens/passout';
import { renderGameOver } from './screens/game-over';
import { renderSetup } from './screens/setup';
import { renderFurnitureStore } from './screens/furniture-store';
import { renderUniversity } from './screens/university';
import { renderSpellScrollStore } from './screens/spell-scroll-store';
import { renderUniversityBookstore } from './screens/university-bookstore';
import { renderDadsHouse } from './screens/dads-house';
import { renderBar } from './screens/bar';
import { makeEventModal } from './components';
import { getLocationType } from '../data/locations';

type Dispatch = (action: GameAction) => void;

type ScreenId = 'setup' | 'tower' | 'bodega' | 'temple' | 'furniture_store' | 'university'
  | 'university_bookstore' | 'spell_scroll_store' | 'dads_house' | 'university_bar'
  | 'scratch' | 'passout' | 'game_over' | 'none';
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
    container.replaceChildren();
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
  // Both elements are guaranteed non-null here: either they existed and passed
  // the contains() check, or they were just created above.
  return { hud: _hudEl as HTMLElement, screen: _screenEl as HTMLElement };
}

// ─── Screen Routing ───────────────────────────────────────────────────────────

function getTargetScreen(state: GameState): ScreenId {
  if (state.phase === 'setup') return 'setup';
  if (state.phase === 'game_over') return 'game_over';
  if (state.phase === 'passedout') return 'passout';
  if (state.phase === 'scratching' && state.scratchSession !== null) return 'scratch';
  // 'playing' and 'event' both route to the current location screen.
  // When phase === 'event', the event modal is overlaid after the location renders.
  if (state.phase === 'playing' || state.phase === 'event') {
    const locType = getLocationType(state.currentLocation);
    if (locType === 'tower') return 'tower';
    if (locType === 'temple') return 'temple';
    if (locType === 'furniture_store') return 'furniture_store';
    if (locType === 'university') return 'university';
    if (locType === 'university_bookstore') return 'university_bookstore';
    if (locType === 'spell_scroll_store') return 'spell_scroll_store';
    if (locType === 'dads_house') return 'dads_house';
    if (locType === 'university_bar') return 'university_bar';
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
  renderHUD(state, hud, dispatch);

  const targetScreen = getTargetScreen(state);

  // Reset all modal state when navigating to a different screen.
  if (targetScreen !== currentScreen) {
    resetAllModals();
  }

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
  } else if (targetScreen === 'furniture_store') {
    currentScreen = 'furniture_store';
    renderFurnitureStore(state, screen, dispatch);
  } else if (targetScreen === 'university') {
    currentScreen = 'university';
    renderUniversity(state, screen, dispatch);
  } else if (targetScreen === 'university_bookstore') {
    currentScreen = 'university_bookstore';
    renderUniversityBookstore(state, screen, dispatch);
  } else if (targetScreen === 'spell_scroll_store') {
    currentScreen = 'spell_scroll_store';
    renderSpellScrollStore(state, screen, dispatch);
  } else if (targetScreen === 'dads_house') {
    currentScreen = 'dads_house';
    renderDadsHouse(state, screen, dispatch);
  } else if (targetScreen === 'university_bar') {
    currentScreen = 'university_bar';
    renderBar(state, screen, dispatch);
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

  // Random events overlay the current location screen as a universal modal.
  // blockClose=true forces an explicit choice — no dismiss-on-outside-click.
  if (state.activeEvent !== null) {
    screen.appendChild(makeEventModal(state.activeEvent, dispatch));
  }

  lastActionType = null;
}

// Store the cell index for in-place scratch updates.
let _lastCellIndex = 0;
export function setLastCellIndex(idx: number): void {
  _lastCellIndex = idx;
}
