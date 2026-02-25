// Entry point: initializes state, wires up dispatch, starts the render loop.

import type { GameState } from './state/types';
import type { GameAction } from './engine/actions';
import { loadGame, saveGame } from './state/save';
import { createInitialState } from './state/initial';
import { init as initDispatch, dispatch as rawDispatch, getState } from './engine/dispatch';
import { render, setLastAction, setLastCellIndex } from './ui/renderer';
import { initTheme } from './ui/theme';
import './style.css';

const containerEl = document.getElementById('app');
if (!containerEl) throw new Error('No #app element found.');
const container: HTMLElement = containerEl;

// ─── Boot ─────────────────────────────────────────────────────────────────────

let state: GameState = loadGame() ?? createInitialState();
const resolvedScheme = initTheme(state.colorScheme);
if (state.colorScheme !== resolvedScheme) {
  state = { ...state, colorScheme: resolvedScheme };
}

// ─── Dispatch wiring ──────────────────────────────────────────────────────────

function dispatch(action: GameAction): void {
  // Track action metadata for the renderer before applying.
  setLastAction(action.type);
  if (action.type === 'SCRATCH_CELL') {
    setLastCellIndex(action.cellIndex);
  }
  rawDispatch(action);
}

function renderCurrent(s: GameState): void {
  render(s, container, dispatch);
}

initDispatch(state, renderCurrent);

// ─── Auto-save hooks ──────────────────────────────────────────────────────────

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveGame(getState());
  }
});

window.addEventListener('beforeunload', () => {
  saveGame(getState());
});

// ─── Initial render ───────────────────────────────────────────────────────────

renderCurrent(state);
