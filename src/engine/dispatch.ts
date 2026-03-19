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
import { addMultipleItems, addItem, canFitItems, removeItem } from '../systems/inventory';
import { applyDonation, applyMonumentDonation, applyAffinityDecay, createPrayerBuff, pruneExpiredBuffs } from '../systems/affinity';
import { getLocationData } from '../data/locations';
import type { FurnitureItem, InventoryItem, SpellScrollItem } from '../state/types';
import { getBed, addFurniture, removeFurniture, replaceBed, hasCrystalBall, hasLabTable } from '../systems/furniture';
import { startProject, workOnProject, cancelProject, collectProject, isProjectComplete } from '../systems/projects';
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
  calcMisfireChance,
} from '../systems/spellbook';
import { applyManaSpend } from '../systems/mana';
import { addMinutesToTimestamp, hasPrayerBuff } from '../systems/affinity';
import { getOpposedGod, getGod } from '../data/gods';
import type { LuckBuff } from '../state/types';
import { rng } from '../util/rng';
import { growNeed, gainSatisfaction, computeRestingRelaxation } from '../systems/addiction';
import { takeLoan, repayLoan, accrueInterest, isSpellbookLocked } from '../systems/loan';
import { getLocationType } from '../data/locations';
import { checkForEvent, createActiveEvent, resolveEvent, applyLoanSharkInterest, collectLoanSharkDebt } from '../systems/events';
import { RANDOM_EVENTS } from '../data/events';
import balance from '../data/balance.json';

// ─── Spell balance reference ──────────────────────────────────────────────────
const spellsBal = (balance as Record<string, unknown>).spells as Record<string, unknown> & {
  lucky_fingers: { winChanceBonus: number; durationMinutes: number; baseMisfireChance: number };
};

// Applies the category-specific effect of a spell or scroll to an already-clock-advanced,
// already-mana-spent state. Returns the resulting state.
function applySpellEffect(
  state: GameState,
  spellId: string,
  category: string,
  godId: import('../state/types').GodId | undefined,
  newClock: number,
): GameState {
  let nextState = state;

  switch (category) {
    case 'affinity': {
      if (!godId) break;

      const affData = (spellsBal as Record<string, unknown>)[spellId] as
        | { affinityGain?: number; affinityLoss?: number } | undefined;

      const rawChange = affData?.affinityGain ?? (affData?.affinityLoss ? -(affData.affinityLoss) : 0);
      if (rawChange === 0) break;

      const opposedGod = getOpposedGod(godId);

      const hasTargetBuff = hasPrayerBuff(state.prayerBuffs, godId, newClock, state.day, state.month, state.year);
      const hasOpposedBuff = hasPrayerBuff(state.prayerBuffs, opposedGod, newClock, state.day, state.month, state.year);

      const aff = balance.affinity;
      const isStrongMonth = getGod(godId).strongMonths.includes(state.month);
      const strongMult = isStrongMonth ? aff.strongMonthMultiplier : 1;

      const gain = Math.abs(rawChange) * (hasTargetBuff ? aff.prayerBuffMultiplier : 1) * strongMult;
      const loss = hasOpposedBuff ? Math.abs(rawChange) * aff.prayerDebuffMultiplier : Math.abs(rawChange);

      const newAffinity = { ...nextState.affinity };
      if (rawChange > 0) {
        newAffinity[godId] = newAffinity[godId] + gain;
        newAffinity[opposedGod] = newAffinity[opposedGod] - loss;
      } else {
        newAffinity[godId] = newAffinity[godId] - gain;
        newAffinity[opposedGod] = newAffinity[opposedGod] + loss;
      }
      nextState = { ...nextState, affinity: newAffinity };
      break;
    }

    case 'chill': {
      const chillData = (spellsBal as Record<string, unknown>)[spellId] as
        | { chillRestore: number } | undefined;
      if (chillData?.chillRestore) {
        nextState = { ...nextState, chill: applyChillGain(nextState.chill, chillData.chillRestore) };
      }
      break;
    }

    case 'mana': {
      const manaData = (spellsBal as Record<string, unknown>)[spellId] as
        | { manaRestore: number } | undefined;
      if (manaData?.manaRestore) {
        nextState = { ...nextState, mana: applyManaRestore(nextState.mana, manaData.manaRestore, nextState.maxMana) };
      }
      break;
    }

    case 'luck': {
      const luckData = (spellsBal as Record<string, unknown>)[spellId] as
        | { durationMinutes: number } | undefined;
      if (luckData?.durationMinutes) {
        const expiry = addMinutesToTimestamp(newClock, state.day, state.month, state.year, luckData.durationMinutes);
        const newBuff: LuckBuff = {
          expiresAtClock: expiry.clock,
          expiresOnDay: expiry.day,
          expiresInMonth: expiry.month,
          expiresInYear: expiry.year,
        };
        nextState = { ...nextState, luckBuff: newBuff };
      }
      break;
    }

    // 'reveal', 'travel', 'aging': no effect yet (future sprints)
    default:
      break;
  }

  return nextState;
}

// Returns true if the luck buff is currently active at the given timestamp.
function isLuckBuffActive(
  buff: LuckBuff | null,
  clock: number, day: number, month: number, year: number,
): boolean {
  if (!buff) return false;
  const toMin = (y: number, mo: number, d: number, c: number) =>
    y * 360 * 1440 + mo * 30 * 1440 + d * 1440 + c;
  return toMin(year, month, day, clock) < toMin(buff.expiresInYear, buff.expiresInMonth, buff.expiresOnDay, buff.expiresAtClock);
}

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

  // Sprint 23: check for random event triggers after most actions.
  // Skip event checks during event resolution, setup, game over, and scratch phase.
  if (
    _state.phase === 'playing' &&
    action.type !== 'RESOLVE_EVENT' &&
    action.type !== 'DISMISS_EVENT' &&
    action.type !== 'NEW_GAME' &&
    action.type !== 'SET_THEME' &&
    action.type !== 'SET_BIRTHDAY'
  ) {
    const result = checkForEvent(_state, action);
    if (result) {
      _state = {
        ..._state,
        phase: 'event',
        activeEvent: createActiveEvent(result.event),
        rngSeed: result.rngSeed,
      };
    }
  }

  saveGame(_state);
  _render(_state);
}

// ─── Action Handlers ──────────────────────────────────────────────────────────

function applyAction(state: GameState, action: GameAction): GameState {
  // Sprint 19: clear transient Crystal Ball reveal on every action.
  if (state.crystalBallReveal !== null) {
    state = { ...state, crystalBallReveal: null };
  }

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

      // Sprint 17: grow addiction need with each ticket purchase (frequency-driven).
      const newNeed = growNeed(stateWithPurchase.addictionNeed, totalTickets);
      stateWithPurchase = {
        ...stateWithPurchase,
        addictionNeed: newNeed,
        restingRelaxation: computeRestingRelaxation(newNeed),
      };

      // Sprint 2: advance clock by scratch session time before creating session.
      const timeCost = calcScratchTimeCost(totalTickets);
      const newClock = advanceClock(stateWithPurchase.clock, timeCost);

      if (isCurfewBreached(newClock, stateWithPurchase.currentLocation)) {
        return applyPassout({ ...stateWithPurchase, clock: newClock });
      }

      // Sprint 15: pass luck buff win-chance bonus if active.
      const luckBonus = isLuckBuffActive(stateWithPurchase.luckBuff, newClock, stateWithPurchase.day, stateWithPurchase.month, stateWithPurchase.year)
        ? (spellsBal.lucky_fingers as { winChanceBonus: number }).winChanceBonus
        : 0;

      return startScratchSession({ ...stateWithPurchase, clock: newClock }, action.quantities, luckBonus);
    }

    case 'SCRATCH_CELL':
      return scratchCell(state, action.cellIndex);

    case 'ADVANCE_TICKET':
      return advanceTicket(state);

    case 'FINISH_SESSION': {
      // Sprint 17: gain satisfaction based on session volume before clearing session.
      const sess = state.scratchSession;
      if (!sess) return finishSession(state);
      const numTickets = sess.tickets.length;
      const newSatisfaction = gainSatisfaction(state.addictionSatisfaction, numTickets);
      return finishSession({ ...state, addictionSatisfaction: newSatisfaction });
    }

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
      let nextState: GameState = {
        ...state,
        clock: balance.dayCycle.wakeTime,
        lastPassoutPenalty: null,
        mana: applyManaRestore(state.mana, bedRestore.sleepMana, state.maxMana),
        chill: applyChillGain(state.chill, bedRestore.sleepChill),
        affinity: applyAffinityDecay(state.affinity, 1),
        ...cal,
      };
      // Sprint 22: accrue loan interest on rent day (before rent check).
      if (nextState.day === balance.rent.dueDay) {
        nextState = accrueInterest(nextState);
      }
      // Sprint 23: accrue loan shark interest daily.
      nextState = applyLoanSharkInterest(nextState);
      // Sprint 23: collect loan shark debt on rent day (before rent check).
      if (nextState.day === balance.rent.dueDay) {
        nextState = collectLoanSharkDebt(nextState);
      }
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

      // Restore chill first.
      let nextState: GameState = {
        ...state,
        chill: applyChillGain(state.chill, chillRestore),
      };

      // Roll for break — triggers bong_breaks event instead of silent removal.
      const [roll, nextSeed] = rng(nextState.rngSeed);
      nextState = { ...nextState, rngSeed: nextSeed };

      if (roll < bongBalance.breakChance) {
        // Trigger bong_breaks event.
        const bongEvent = RANDOM_EVENTS.find(e => e.id === 'bong_breaks')!;
        nextState = {
          ...nextState,
          phase: 'event',
          activeEvent: createActiveEvent(bongEvent),
        };
      }

      return nextState;
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
      if (isSpellbookLocked(state)) return state;  // Sprint 22: collateral lock
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
      if (isSpellbookLocked(state)) return state;  // Sprint 22: collateral lock
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
      if (isSpellbookLocked(state)) return state;  // Sprint 22: collateral lock
      if (!state.equippedSpells.includes(action.spellId)) return state;

      const spell = getSpellDef(action.spellId);
      if (state.mana < spell.manaCost) return state;

      // Advance clock and check curfew.
      const newClock = advanceClock(state.clock, spell.castingTime);
      if (isCurfewBreached(newClock, state.currentLocation)) {
        return applyPassout({ ...state, clock: newClock });
      }

      // ── Sprint 15: misfire check ──────────────────────────────────────────
      // Look up per-spell balance data (may be undefined for spells without effects yet).
      const spellEntry = (spellsBal as Record<string, unknown>)[action.spellId] as
        | { baseMisfireChance: number } | undefined;
      const baseMisfireChance = spellEntry?.baseMisfireChance ?? 0.05;

      const misfireChance = calcMisfireChance(baseMisfireChance, state.chill);
      let [roll, nextSeed] = rng(state.rngSeed);

      if (roll < misfireChance) {
        // MISFIRE: spell fires but drains twice the mana.
        const misfireCost = Math.min(state.mana, spell.manaCost * 2);
        return {
          ...state,
          clock: newClock,
          mana: applyManaSpend(state.mana, misfireCost),
          rngSeed: nextSeed,
        };
      }

      // ── No misfire: apply spell effect by category ────────────────────────
      let nextState: GameState = {
        ...state,
        clock: newClock,
        mana: applyManaSpend(state.mana, spell.manaCost),
        rngSeed: nextSeed,
      };

      return applySpellEffect(nextState, action.spellId, spell.category, action.godId, newClock);
    }

    // ── Sprint 16 ─────────────────────────────────────────────────────────────

    case 'BUY_SCROLL': {
      if (state.phase !== 'playing') return state;
      const locData = getLocationData(state.currentLocation);
      if (locData.type !== 'university_bookstore' && locData.type !== 'spell_scroll_store') return state;

      // Can't buy a scroll for a spell already known.
      if (isSpellKnown(state.knownSpells, action.spellId)) return state;

      const spell = getSpellDef(action.spellId);
      const scrollsBal = (balance as Record<string, unknown>).scrolls as {
        priceByLevel: Record<string, number>;
        bookstoreMarkup: number;
        storePurchaseTimeCost: number;
      };
      const basePrice = scrollsBal.priceByLevel[String(spell.level)] ?? 50;
      const price = locData.type === 'university_bookstore'
        ? Math.floor(basePrice * scrollsBal.bookstoreMarkup)
        : basePrice;

      if (state.cash < price) return state;
      if (!canFitItems(state.inventory, 1)) return state;

      const newClock = advanceClock(state.clock, scrollsBal.storePurchaseTimeCost);
      if (isCurfewBreached(newClock, state.currentLocation)) {
        return applyPassout({ ...state, clock: newClock });
      }

      const scrollItem: SpellScrollItem = {
        type: 'spell_scroll',
        id: `scroll_${action.spellId}`,
        name: `Scroll of ${spell.name}`,
        spellId: action.spellId,
      };

      const newInventory = addItem(state.inventory, scrollItem);
      if (!newInventory) return state;

      return {
        ...state,
        clock: newClock,
        cash: state.cash - price,
        inventory: newInventory,
      };
    }

    case 'USE_SCROLL': {
      if (state.phase !== 'playing') return state;
      const item = state.inventory[action.slotIndex];
      if (!item || item.type !== 'spell_scroll') return state;

      const spell = getSpellDef(item.spellId);
      if (state.mana < spell.manaCost) return state;

      const newClock = advanceClock(state.clock, spell.castingTime);
      if (isCurfewBreached(newClock, state.currentLocation)) {
        return applyPassout({ ...state, clock: newClock });
      }

      const spellEntry = (spellsBal as Record<string, unknown>)[item.spellId] as
        | { baseMisfireChance: number } | undefined;
      const baseMisfireChance = spellEntry?.baseMisfireChance ?? 0.05;
      const misfireChance = calcMisfireChance(baseMisfireChance, state.chill);
      const [roll, nextSeed] = rng(state.rngSeed);

      // Scroll is always consumed — remove it from inventory first.
      const inventoryAfterUse = removeItem(state.inventory, action.slotIndex);

      if (roll < misfireChance) {
        const misfireCost = Math.min(state.mana, spell.manaCost * 2);
        return {
          ...state,
          clock: newClock,
          mana: applyManaSpend(state.mana, misfireCost),
          inventory: inventoryAfterUse,
          rngSeed: nextSeed,
        };
      }

      const nextState: GameState = {
        ...state,
        clock: newClock,
        mana: applyManaSpend(state.mana, spell.manaCost),
        inventory: inventoryAfterUse,
        rngSeed: nextSeed,
      };

      return applySpellEffect(nextState, item.spellId, spell.category, action.godId, newClock);
    }

    // ── Sprint 19 ─────────────────────────────────────────────────────────────

    case 'USE_CRYSTAL_BALL': {
      if (state.phase !== 'playing' || state.currentLocation !== 'tower') return state;
      if (!hasCrystalBall(state.furniture)) return state;

      // Map revealType to required spell.
      const revealSpellMap: Record<string, string> = {
        addiction: 'inner_eye',
        chill: 'true_sight',
        ageHealth: 'vital_scan',
      };
      const requiredSpell = revealSpellMap[action.revealType];
      if (!requiredSpell) return state;

      // Reveal spells use knownSpells (not equippedSpells) — learning is the gate.
      if (!isSpellKnown(state.knownSpells, requiredSpell)) return state;

      const crystalBal = (balance as Record<string, unknown>).crystalBall as { revealManaCost: number };
      if (state.mana < crystalBal.revealManaCost) return state;

      // Compute the revealed value.
      let label: string;
      let value: number;
      switch (action.revealType) {
        case 'addiction':
          label = 'Addiction Level';
          value = Math.floor(state.addictionNeed);
          break;
        case 'chill':
          label = 'True Chill';
          value = Math.round(state.chill);
          break;
        case 'ageHealth':
          label = 'Age Health Score';
          value = Math.round(state.ageHealthScore);
          break;
        default:
          return state;
      }

      return {
        ...state,
        mana: applyManaSpend(state.mana, crystalBal.revealManaCost),
        crystalBallReveal: { stat: action.revealType, label, value },
      };
    }

    // ── Sprint 20 ─────────────────────────────────────────────────────────────

    case 'START_PROJECT': {
      if (state.phase !== 'playing' || state.currentLocation !== 'tower') return state;
      if (!hasLabTable(state.furniture)) return state;
      if (state.activeProject) return state;
      const result = startProject(state, action.projectId);
      return result ?? state;
    }

    case 'WORK_ON_PROJECT': {
      if (state.phase !== 'playing' || state.currentLocation !== 'tower') return state;
      if (!state.activeProject) return state;
      if (action.duration <= 0 || action.duration % 15 !== 0) return state;

      // Advance clock and check curfew.
      const newClock = advanceClock(state.clock, action.duration);
      if (isCurfewBreached(newClock, state.currentLocation)) {
        return applyPassout({ ...state, clock: newClock });
      }

      return workOnProject({ ...state, clock: newClock }, action.duration);
    }

    case 'CANCEL_PROJECT': {
      if (state.phase !== 'playing' || state.currentLocation !== 'tower') return state;
      if (!state.activeProject) return state;
      return cancelProject(state);
    }

    case 'COLLECT_PROJECT': {
      if (state.phase !== 'playing' || state.currentLocation !== 'tower') return state;
      if (!state.activeProject) return state;
      if (!isProjectComplete(state.activeProject)) return state;
      const result = collectProject(state);
      return result ?? state;
    }

    case 'DONATE_MONUMENT': {
      if (state.phase !== 'playing') return state;
      const locData = getLocationData(state.currentLocation);
      if (locData.type !== 'temple' || !locData.godId) return state;
      const item = state.inventory[action.slotIndex];
      if (!item || item.type !== 'monument') return state;
      const newAffinity = applyMonumentDonation(
        state.affinity,
        locData.godId,
        item.size,
        state.prayerBuffs,
        state.clock, state.day, state.month, state.year,
      );
      const newInventory = removeItem(state.inventory, action.slotIndex);
      return { ...state, affinity: newAffinity, inventory: newInventory };
    }

    // ── Sprint 22 ─────────────────────────────────────────────────────────────

    case 'TAKE_LOAN': {
      if (state.phase !== 'playing') return state;
      if (getLocationType(state.currentLocation) !== 'dads_house') return state;
      if (!state.dadAlive) return state;
      const result = takeLoan(state, action.amount);
      if (!result) return state;
      const dadBal = balance.dadsHouse as { visitTimeCost: number };
      const newClock = advanceClock(result.clock, dadBal.visitTimeCost);
      if (isCurfewBreached(newClock, state.currentLocation)) {
        return applyPassout({ ...result, clock: newClock });
      }
      return { ...result, clock: newClock };
    }

    case 'REPAY_LOAN': {
      if (state.phase !== 'playing') return state;
      if (getLocationType(state.currentLocation) !== 'dads_house') return state;
      if (!state.dadAlive) return state;
      const result = repayLoan(state, action.amount);
      return result ?? state;
    }

    case 'VISIT_GRAVE': {
      if (state.phase !== 'playing') return state;
      if (getLocationType(state.currentLocation) !== 'dads_house') return state;
      if (state.dadAlive) return state;
      const dadBal = balance.dadsHouse as { visitTimeCost: number; graveManaRestore: number; graveChillLoss: number };
      const newClock = advanceClock(state.clock, dadBal.visitTimeCost);
      if (isCurfewBreached(newClock, state.currentLocation)) {
        return applyPassout({ ...state, clock: newClock });
      }
      return {
        ...state,
        clock: newClock,
        mana: applyManaRestore(state.mana, dadBal.graveManaRestore, state.maxMana),
        chill: Math.max(0, state.chill - dadBal.graveChillLoss),
      };
    }

    // ── Sprint 23 ─────────────────────────────────────────────────────────────

    case 'RESOLVE_EVENT': {
      if (state.phase !== 'event' || !state.activeEvent) return state;
      if (state.activeEvent.resolved) return state;
      let nextState = resolveEvent(state, action.choiceIndex);
      // Track event trigger count.
      const eventId = state.activeEvent.eventId;
      const count = (nextState.eventsTriggered[eventId] ?? 0) + 1;
      nextState = {
        ...nextState,
        eventsTriggered: { ...nextState.eventsTriggered, [eventId]: count },
        notableEvents: count === 1 && !nextState.notableEvents.includes(eventId)
          ? [...nextState.notableEvents, eventId]
          : nextState.notableEvents,
      };
      return nextState;
    }

    case 'DISMISS_EVENT': {
      if (!state.activeEvent || !state.activeEvent.resolved) return state;
      return { ...state, phase: 'playing', activeEvent: null };
    }

    default:
      return state;
  }
}
