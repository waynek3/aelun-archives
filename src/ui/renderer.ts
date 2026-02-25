// Screen manager — decides which screen to show and how to update it.
// Handles the distinction between full re-renders and in-place updates.

import type { GameState } from '../state/types';
import type { GameAction } from '../engine/actions';
import { renderBodega } from './screens/bodega';
import { renderScratch, updateScratchCell } from './screens/scratch';

type Dispatch = (action: GameAction) => void;

type ScreenId = 'bodega' | 'scratch' | 'none';
let currentScreen: ScreenId = 'none';

// The last action that triggered a render — used to decide partial vs full update.
let lastActionType: string | null = null;

export function setLastAction(type: string): void {
  lastActionType = type;
}

export function render(
  state: GameState,
  container: HTMLElement,
  dispatch: Dispatch,
): void {
  // Guard: scratchSession must be present to show the scratch screen.
  // A null session with phase='scratching' (e.g. stale save from a previous
  // game version) would cause renderScratch to clear the container and return
  // immediately, leaving only the CSS background visible.
  const targetScreen: ScreenId =
    state.phase === 'scratching' && state.scratchSession !== null ? 'scratch' : 'bodega';

  if (targetScreen === 'scratch') {
    if (currentScreen !== 'scratch') {
      // Full render on screen transition.
      currentScreen = 'scratch';
      renderScratch(state, container, dispatch);
    } else if (lastActionType === 'SCRATCH_CELL') {
      // In-place cell update — avoid full re-render for tap responsiveness.
      const session = state.scratchSession;
      if (session) {
        // The cell that was tapped is the one whose state just changed.
        // We find it by scanning for the cell index stored in lastCellIndex.
        updateScratchCell(state, _lastCellIndex);
      }
    } else {
      // ADVANCE_TICKET or any other scratch-phase action → full re-render.
      renderScratch(state, container, dispatch);
    }
  } else {
    // bodega
    if (currentScreen !== 'bodega') {
      currentScreen = 'bodega';
      renderBodega(state, container, dispatch);
    } else {
      // Bodega is already shown; re-render to reflect cash changes.
      renderBodega(state, container, dispatch);
    }
  }

  lastActionType = null;
}

// Store the cell index for in-place scratch updates.
let _lastCellIndex = 0;
export function setLastCellIndex(idx: number): void {
  _lastCellIndex = idx;
}
