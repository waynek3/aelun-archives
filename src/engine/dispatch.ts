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
import { applyManaRestore } from '../systems/mana';
import { applyChillGain } from '../systems/chill';
import { getSnack } from '../data/food';
import { addMultipleItems, canFitItems, removeItem } from '../systems/inventory';
import { applyDonation, createPrayerBuff, pruneExpiredBuffs } from '../systems/affinity';
import { getLocationData } from '../data/locations';
import type { InventoryItem } from '../state/types';
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
      // Sprint 7: combined ticket + snack purchase.
      const snackIds = action.snacks ?? [];

      const ticketCost = Object.entries(action.quantities).reduce(
        (sum, [typeId, qty]) => sum + getTicketType(typeId).cost * qty,
        0,
      );
      const snackCost = snackIds.reduce(
        (sum, id) => sum + getSnack(id).cost,
        0,
      );
      const totalCost = ticketCost + snackCost;

      if (totalCost <= 0) return state;
      if (state.cash < totalCost) return state;

      // Validate inventory space for snacks.
      if (snackIds.length > 0 && !canFitItems(state.inventory, snackIds.length)) return state;

      // Add snacks to inventory.
      let newInventory = state.inventory;
      if (snackIds.length > 0) {
        const items: InventoryItem[] = snackIds.map(id => {
          const def = getSnack(id);
          return { type: 'snack' as const, id: def.id, name: def.name, descriptor: def.descriptor };
        });
        newInventory = addMultipleItems(state.inventory, items) ?? state.inventory;
      }

      let stateWithPurchase: GameState = {
        ...state,
        cash: state.cash - totalCost,
        inventory: newInventory,
      };

      // If no tickets, just return (stay on bodega screen — snack-only purchase).
      const totalTickets = Object.values(action.quantities).reduce((a, b) => a + b, 0);
      if (totalTickets === 0) return stateWithPurchase;

      // Sprint 2: advance clock by scratch session time before creating session.
      const timeCost = calcScratchTimeCost(totalTickets);
      const newClock = advanceClock(stateWithPurchase.clock, timeCost);

      if (isCurfewBreached(newClock, stateWithPurchase.currentLocation)) {
        return applyPassout({ ...stateWithPurchase, clock: newClock });
      }

      return startScratchSession({ ...stateWithPurchase, clock: newClock }, action.quantities);
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
      const manaBalance = balance.mana as Record<string, number>;
      const nextState: GameState = {
        ...state,
        clock: balance.dayCycle.wakeTime,
        lastPassoutPenalty: null,
        mana: applyManaRestore(state.mana, manaBalance.sleepManaRestore, state.maxMana),
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

    // ── Sprint 7 ──────────────────────────────────────────────────────────────

    case 'CONSUME_SNACK': {
      if (state.phase !== 'playing') return state;
      const item = state.inventory[action.slotIndex];
      if (!item || item.type !== 'snack') return state;

      const snackBalance = balance.snacks as { chillRestore: Record<string, number> };
      const restoreAmount = snackBalance.chillRestore[item.descriptor] ?? 0;

      return {
        ...state,
        chill: applyChillGain(state.chill, restoreAmount),
        inventory: removeItem(state.inventory, action.slotIndex),
      };
    }

    // ── Sprint 9 ──────────────────────────────────────────────────────────────

    case 'DONATE_PRIVATE': {
      if (state.phase !== 'playing') return state;
      if (state.cash < action.amount) return state;
      const locData = getLocationData(state.currentLocation);
      if (locData.type !== 'temple' || !locData.godId) return state;
      const godId = locData.godId;
      return {
        ...state,
        cash: state.cash - action.amount,
        affinity: applyDonation(
          state.affinity, godId, action.amount, false,
          state.prayerBuffs, state.clock, state.day, state.month, state.year,
        ),
      };
    }

    case 'DONATE_PUBLIC': {
      if (state.phase !== 'playing') return state;
      if (state.cash < action.amount) return state;
      const locData = getLocationData(state.currentLocation);
      if (locData.type !== 'temple' || !locData.godId) return state;
      const godId = locData.godId;
      return {
        ...state,
        cash: state.cash - action.amount,
        affinity: applyDonation(
          state.affinity, godId, action.amount, true,
          state.prayerBuffs, state.clock, state.day, state.month, state.year,
        ),
        wizardFame: state.wizardFame + balance.affinity.publicDonationFameGain,
      };
    }

    case 'PRAY': {
      if (state.phase !== 'playing') return state;
      const locData = getLocationData(state.currentLocation);
      if (locData.type !== 'temple' || !locData.godId) return state;
      if (action.duration <= 0) return state;
      const godId = locData.godId;

      // Advance clock by prayer duration.
      const newClock = advanceClock(state.clock, action.duration);
      if (isCurfewBreached(newClock, state.currentLocation)) {
        return applyPassout({ ...state, clock: newClock });
      }

      // Mana restore: per-quarter flat amount.
      const prayerBal = (balance as Record<string, unknown>).prayer as { manaRestorePerQuarter: number };
      const quarters = action.duration / 15;
      const newMana = Math.min(state.maxMana, state.mana + quarters * prayerBal.manaRestorePerQuarter);

      // Create prayer buff (expires after same duration from post-prayer clock).
      const buff = createPrayerBuff(godId, action.duration, newClock, state.day, state.month, state.year);

      // Replace any existing buff for this god, prune expired.
      const filteredBuffs = state.prayerBuffs.filter(b => b.godId !== godId);
      const newBuffs = pruneExpiredBuffs([...filteredBuffs, buff], newClock, state.day, state.month, state.year);

      return {
        ...state,
        clock: newClock,
        mana: newMana,
        prayerBuffs: newBuffs,
      };
    }

    default:
      return state;
  }
}
