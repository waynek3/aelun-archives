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
import { applyDonation, applyAffinityDecay, createPrayerBuff, pruneExpiredBuffs } from '../systems/affinity';
import { getLocationData } from '../data/locations';
import type { FurnitureItem, InventoryItem } from '../state/types';
import { getBed, addFurniture, removeFurniture, replaceBed } from '../systems/furniture';
import { getFurnitureDef, getBedSleepRestore } from '../data/furniture';
import { getSpellDef, BOOKBINDING_CLASS } from '../data/spells';
import {
  calcLearningTime,
  isSpellKnown,
  learnSpell,
  canAddToBook,
  addToBook,
  removeFromBook,
  calcAddToBookTime,
  calcRemoveFromBookTime,
} from '../systems/spellbook';
import { applyManaSpend } from '../systems/mana';
import { rng } from '../util/rng';
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
      // Sprint 13: require a bed to sleep.
      const bed = getBed(state.furniture);
      if (!bed) return state;
      const bedRestore = getBedSleepRestore(bed.id);
      const cal = advanceDay(state.day, state.month, state.year);
      const nextState: GameState = {
        ...state,
        clock: balance.dayCycle.wakeTime,
        lastPassoutPenalty: null,
        mana: applyManaRestore(state.mana, bedRestore.sleepMana, state.maxMana),
        chill: applyChillGain(state.chill, bedRestore.sleepChill),
        affinity: applyAffinityDecay(state.affinity, 1),
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

    // ── Sprint 11 ─────────────────────────────────────────────────────────────

    case 'SET_BIRTHDAY': {
      if (state.phase !== 'setup') return state;
      if (action.month < 1 || action.month > 12) return state;
      return { ...state, birthdayMonth: action.month, phase: 'playing' };
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

    // ── Sprint 13 ─────────────────────────────────────────────────────────────

    case 'BUY_FURNITURE': {
      if (state.phase !== 'playing') return state;
      const locData = getLocationData(state.currentLocation);
      if (locData.type !== 'furniture_store') return state;
      const def = getFurnitureDef(action.furnitureId);
      if (state.cash < def.cost) return state;

      const furnitureBalance = balance.furniture as { maxSlots: number };
      const item: FurnitureItem = {
        type: def.type,
        id: def.id,
        name: def.name,
        quality: def.quality,
      };

      // Beds swap: replace existing bed instead of adding.
      if (def.type === 'bed') {
        const existingBed = getBed(state.furniture);
        if (existingBed && existingBed.quality >= def.quality) return state; // can't downgrade
        const newFurniture = existingBed
          ? replaceBed(state.furniture, item)
          : addFurniture(state.furniture, item, furnitureBalance.maxSlots);
        if (!newFurniture) return state;
        return { ...state, cash: state.cash - def.cost, furniture: newFurniture };
      }

      // Non-bed: normal slot check.
      const newFurniture = addFurniture(state.furniture, item, furnitureBalance.maxSlots);
      if (!newFurniture) return state;
      return { ...state, cash: state.cash - def.cost, furniture: newFurniture };
    }

    case 'USE_BONG': {
      if (state.phase !== 'playing' || state.currentLocation !== 'tower') return state;
      const item = state.furniture[action.furnitureIndex];
      if (!item || item.type !== 'bong') return state;

      const bongBalance = (balance.furniture as { bong: { breakChance: number } }).bong;
      const chillRestore = (balance.chill as { bongRestoreAmount: number }).bongRestoreAmount;

      // Roll for break.
      const [roll, nextSeed] = rng(state.rngSeed);
      const broke = roll < bongBalance.breakChance;

      return {
        ...state,
        chill: applyChillGain(state.chill, chillRestore),
        furniture: broke ? removeFurniture(state.furniture, action.furnitureIndex) : state.furniture,
        rngSeed: nextSeed,
      };
    }

    case 'RECYCLE_FURNITURE': {
      if (state.phase !== 'playing' || state.currentLocation !== 'tower') return state;
      if (action.furnitureIndex < 0 || action.furnitureIndex >= state.furniture.length) return state;
      return {
        ...state,
        furniture: removeFurniture(state.furniture, action.furnitureIndex),
      };
    }

    // ── Sprint 14 ─────────────────────────────────────────────────────────────

    case 'ATTEND_CLASS': {
      if (state.phase !== 'playing') return state;
      const locData = getLocationData(state.currentLocation);
      if (locData.type !== 'university') return state;

      // Check university hours.
      const uniBal = (balance as Record<string, unknown>).university as {
        openTime: number; closeTime: number;
      };
      if (state.clock < uniBal.openTime || state.clock >= uniBal.closeTime) return state;

      // Already known?
      if (isSpellKnown(state.knownSpells, action.spellId)) return state;

      const spell = getSpellDef(action.spellId);
      if (state.cash < spell.learningCost) return state;
      if (state.mana < spell.learningMana) return state;

      // Calculate time and check it fits before closing.
      const learnTime = calcLearningTime(spell.learningTime, state.intelligence);
      const newClock = advanceClock(state.clock, learnTime);

      if (isCurfewBreached(newClock, state.currentLocation)) {
        return applyPassout({ ...state, clock: newClock });
      }

      return {
        ...state,
        clock: newClock,
        cash: state.cash - spell.learningCost,
        mana: applyManaSpend(state.mana, spell.learningMana),
        knownSpells: learnSpell(state.knownSpells, action.spellId),
      };
    }

    case 'LEARN_BOOKBINDING': {
      if (state.phase !== 'playing') return state;
      const locData = getLocationData(state.currentLocation);
      if (locData.type !== 'university') return state;

      const uniBal = (balance as Record<string, unknown>).university as {
        openTime: number; closeTime: number;
      };
      if (state.clock < uniBal.openTime || state.clock >= uniBal.closeTime) return state;

      if (state.cash < BOOKBINDING_CLASS.cost) return state;
      if (state.mana < BOOKBINDING_CLASS.mana) return state;

      const learnTime = calcLearningTime(BOOKBINDING_CLASS.baseTime, state.intelligence);
      const newClock = advanceClock(state.clock, learnTime);

      if (isCurfewBreached(newClock, state.currentLocation)) {
        return applyPassout({ ...state, clock: newClock });
      }

      return {
        ...state,
        clock: newClock,
        cash: state.cash - BOOKBINDING_CLASS.cost,
        mana: applyManaSpend(state.mana, BOOKBINDING_CLASS.mana),
        bookbinding: state.bookbinding + 1,
      };
    }

    case 'ADD_SPELL_TO_BOOK': {
      if (state.phase !== 'playing' || state.currentLocation !== 'tower') return state;
      if (!isSpellKnown(state.knownSpells, action.spellId)) return state;
      if (!canAddToBook(state.equippedSpells, state.bookbinding)) return state;

      const spell = getSpellDef(action.spellId);
      const timeCost = calcAddToBookTime(spell.castingTime);
      const newClock = advanceClock(state.clock, timeCost);

      if (isCurfewBreached(newClock, state.currentLocation)) {
        return applyPassout({ ...state, clock: newClock });
      }

      const newEquipped = addToBook(state.equippedSpells, action.spellId, state.bookbinding);
      if (!newEquipped) return state;

      return {
        ...state,
        clock: newClock,
        equippedSpells: newEquipped,
      };
    }

    case 'REMOVE_SPELL_FROM_BOOK': {
      if (state.phase !== 'playing' || state.currentLocation !== 'tower') return state;
      if (!state.equippedSpells.includes(action.spellId)) return state;

      const spell = getSpellDef(action.spellId);
      const timeCost = calcRemoveFromBookTime(spell.castingTime);
      const newClock = advanceClock(state.clock, timeCost);

      if (isCurfewBreached(newClock, state.currentLocation)) {
        return applyPassout({ ...state, clock: newClock });
      }

      return {
        ...state,
        clock: newClock,
        equippedSpells: removeFromBook(state.equippedSpells, action.spellId),
      };
    }

    case 'CAST_SPELL': {
      if (state.phase !== 'playing') return state;
      if (!state.equippedSpells.includes(action.spellId)) return state;

      const spell = getSpellDef(action.spellId);
      if (state.mana < spell.manaCost) return state;

      // Casting time snapped to :15.
      const newClock = advanceClock(state.clock, spell.castingTime);

      if (isCurfewBreached(newClock, state.currentLocation)) {
        return applyPassout({ ...state, clock: newClock });
      }

      // Sprint 14: no effects — just costs mana and time.
      return {
        ...state,
        clock: newClock,
        mana: applyManaSpend(state.mana, spell.manaCost),
      };
    }

    default:
      return state;
  }
}
