// Central action dispatcher.
// Every player action flows through here: validate → apply → save → render.

import type { GameState } from '../state/types';
import type { GameAction } from './actions';
import { saveGame, saveTheme, clearSave } from '../state/save';
import { createInitialState } from '../state/initial';
import { getTicketType } from '../data/tickets';
import {
  startScratchSession,
  scratchCell,
  advanceTicket,
  finishSession,
} from '../systems/scratch';
import { travel } from '../systems/travel';
import { checkRent } from '../systems/rent';
import { advanceDay, applyPassout, isCurfewBreached, advanceClock } from './time';
import { calcScratchTimeCost } from '../util/format';
import balance from '../data/balance.json';

export type RenderFn = (state: GameState) => void;

let _state: GameState;
let _render: RenderFn;

export function init(initialState: GameState, renderFn: RenderFn): void {
  _state = initialState;
  _render = renderFn;
}

export function getState(): GameState {
  return _state;
}

export function dispatch(action: GameAction): void {
  _state = applyAction(_state, action);
  saveGame(_state);
  _render(_state);
}

// ─── Action Handlers ──────────────────────────────────────────────────────────

function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'BUY_TICKETS': {
      const totalCost = Object.entries(action.quantities).reduce(
        (sum, [typeId, qty]) => sum + getTicketType(typeId).cost * qty,
        0,
      );
      if (totalCost <= 0) return state;
      if (state.cash < totalCost) return state;

      // Sprint 2: advance clock by scratch session time before creating session.
      // The time commitment is made when the player buys, not when they finish.
      const totalTickets = Object.values(action.quantities).reduce((a, b) => a + b, 0);
      const timeCost = calcScratchTimeCost(totalTickets);
      const newClock = advanceClock(state.clock, timeCost);

      if (isCurfewBreached(newClock, state.currentLocation)) {
        // Stayed at bodega past curfew — pass out (tickets are lost, cash deducted).
        const stateAfterBuy: GameState = {
          ...state,
          cash: state.cash - totalCost,
          clock: newClock,
        };
        return applyPassout(stateAfterBuy);
      }

      return startScratchSession({ ...state, clock: newClock }, action.quantities);
    }

    case 'SCRATCH_CELL':
      return scratchCell(state, action.cellIndex);

    case 'ADVANCE_TICKET':
      return advanceTicket(state);

    case 'FINISH_SESSION':
      return finishSession(state);

    case 'SET_THEME': {
      saveTheme(action.scheme);
      document.documentElement.setAttribute('data-theme', action.scheme);
      return { ...state, colorScheme: action.scheme };
    }

    case 'NEW_GAME': {
      clearSave();
      return createInitialState();
    }

    // ── Sprint 2 ──────────────────────────────────────────────────────────────

    case 'TRAVEL': {
      if (state.phase !== 'playing') return state;
      if (state.currentLocation === action.destination) return state;
      return travel(state, action.destination);
    }

    case 'SLEEP': {
      if (state.phase !== 'playing' || state.currentLocation !== 'tower') return state;
      const cal = advanceDay(state.day, state.month, state.year);
      // Sprint 5: restore chill on sleep (placeholder; Sprint 13 refines by bed quality).
      const nextState: GameState = {
        ...state,
        clock: balance.dayCycle.wakeTime,
        chill: Math.min(state.chill + 50, 100),
        lastPassoutPenalty: null,
        ...cal,
      };
      return checkRent(nextState);
    }

    case 'WAKE_UP': {
      if (state.phase !== 'passedout') return state;
      // applyPassout() already advanced the calendar; check rent if we woke on day 1.
      const nextState: GameState = { ...state, phase: 'playing', lastPassoutPenalty: null };
      return checkRent(nextState);
    }

    default:
      return state;
  }
}
