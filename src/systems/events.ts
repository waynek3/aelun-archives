// Random event system (Sprint 23).
// Pure functions: check triggers, create events, resolve outcomes.

import type { GameState, ActiveEvent, GodId } from '../state/types';
import type { GameAction } from '../engine/actions';
import { RANDOM_EVENTS } from '../data/events';
import type { RandomEventDef } from '../data/events';
import { getLocationType, getLocationData } from '../data/locations';
import { rng } from '../util/rng';
import { applyChillGain } from './chill';
import { applyManaRestore } from './mana';
import { removeFurniture } from './furniture';
import { growNeed } from './addiction';
import { getGod } from '../data/gods';
import { advanceClock } from '../engine/time';
import balance from '../data/balance.json';

const evtBal = (balance as Record<string, unknown>).randomEvents as Record<string, Record<string, number>>;

// ─── Trigger Checking ────────────────────────────────────────────────────────

/** Check if an event should trigger. Returns event def + updated seed, or null. */
export function checkForEvent(
  state: GameState,
  action: GameAction,
): { event: RandomEventDef; rngSeed: number } | null {
  // Don't trigger events while already in an event or non-playing phase.
  if (state.phase !== 'playing') return null;

  let seed = state.rngSeed;

  // ── Birthday check (special: deterministic, no RNG roll) ──
  if (state.month === state.birthdayMonth && state.lastBirthdayYear < state.year) {
    const def = RANDOM_EVENTS.find(e => e.id === 'birthday')!;
    return { event: def, rngSeed: seed };
  }

  // ── Bong break is handled separately (via dispatch) ──
  // ── Storm warning only on cross-neighborhood travel ──
  if (action.type === 'TRAVEL') {
    const destNeighborhood = getLocationData(action.destination).neighborhood;
    if (destNeighborhood !== state.currentNeighborhood) {
      const stormDef = RANDOM_EVENTS.find(e => e.id === 'storm_warning')!;
      const [roll, nextSeed] = rng(seed);
      seed = nextSeed;
      if (roll < stormDef.baseProbability) {
        return { event: stormDef, rngSeed: seed };
      }
    }
  }

  // ── Location-based events ──
  const locType = getLocationType(state.currentLocation);
  const neighborhood = state.currentNeighborhood;

  // Filter eligible events.
  const eligible = RANDOM_EVENTS.filter(def => {
    if (def.triggerOn === 'birthday') return false;
    if (def.triggerOn === 'bong_break') return false;
    if (def.triggerOn === 'travel') return false;

    // One-time check.
    if (def.oneTime && (state.eventsTriggered[def.id] ?? 0) > 0) return false;

    // Dad Dies: require dadAlive and minimum year.
    if (def.id === 'dad_dies') {
      if (!state.dadAlive) return false;
      const minYear = evtBal.dad_dies?.minYear ?? 3;
      if (state.year < minYear) return false;
    }

    // Fame threshold.
    if (def.minWizardFame !== undefined && state.wizardFame < def.minWizardFame) return false;

    // Location type check.
    if (def.validLocationTypes !== 'any' && def.validLocationTypes !== 'travel') {
      if (!def.validLocationTypes.includes(locType)) return false;
    }

    // Neighborhood restriction.
    if (def.validNeighborhoods && !def.validNeighborhoods.includes(neighborhood)) return false;

    // Loan shark: skip if already have loan shark debt.
    if (def.id === 'loan_shark' && state.loanSharkDebt > 0) return false;

    return true;
  });

  // Roll for each eligible event.
  for (const def of eligible) {
    const [roll, nextSeed] = rng(seed);
    seed = nextSeed;
    if (roll < def.baseProbability) {
      return { event: def, rngSeed: seed };
    }
  }

  return null;
}

// ─── Event Creation ──────────────────────────────────────────────────────────

export function createActiveEvent(def: RandomEventDef): ActiveEvent {
  return {
    eventId: def.id,
    flavor: def.flavor,
    choices: def.choices.map(c => ({ label: c.label })),
    resolved: false,
    outcomeText: null,
    choiceIndex: null,
  };
}

// ─── Event Resolution ────────────────────────────────────────────────────────

export function resolveEvent(state: GameState, choiceIndex: number): GameState {
  if (!state.activeEvent) return state;
  const eventId = state.activeEvent.eventId;

  switch (eventId) {
    case 'birthday': return resolveBirthday(state, choiceIndex);
    case 'dad_dies': return resolveDadDies(state, choiceIndex);
    case 'bong_breaks': return resolveBongBreaks(state, choiceIndex);
    case 'suspicious_clerk': return resolveSuspiciousClerk(state, choiceIndex);
    case 'fellow_scratcher': return resolveFellowScratcher(state, choiceIndex);
    case 'temple_judgment': return resolveTempleJudgment(state, choiceIndex);
    case 'campus_encounter': return resolveCampusEncounter(state, choiceIndex);
    case 'loan_shark': return resolveLoanShark(state, choiceIndex);
    case 'storm_warning': return resolveStormWarning(state, choiceIndex);
    case 'winning_ticket': return resolveWinningTicket(state, choiceIndex);
    case 'wizard_fame_moment': return resolveWizardFameMoment(state, choiceIndex);
    case 'bad_batch': return resolveBadBatch(state, choiceIndex);
    default: return state;
  }
}

// ─── Per-Event Resolution ────────────────────────────────────────────────────

function resolveBirthday(state: GameState, choice: number): GameState {
  const bal = evtBal.birthday;
  // Show which god is strong this month.
  const strongGods = ['mesin', 'gul', 'klossa', 'skarhol', 'marena', 'azorius', 'ara', 'finhorn', 'beroan', 'sofiel']
    .filter(id => getGod(id as GodId).strongMonths.includes(state.month));
  const godName = strongGods.length > 0 ? strongGods.map(id => getGod(id as GodId).name).join(' & ') : 'none';

  let outcomeText: string;
  let nextState = { ...state, lastBirthdayYear: state.year };

  switch (choice) {
    case 0: // Celebrate alone
      nextState = { ...nextState, chill: applyChillGain(nextState.chill, bal.celebrateChillGain) };
      outcomeText = `You eat cake alone. Chill restored. ${godName} is strong this month.`;
      break;
    case 1: // Buy something
      if (nextState.cash >= bal.buySomethingCost) {
        nextState = {
          ...nextState,
          cash: nextState.cash - bal.buySomethingCost,
          chill: applyChillGain(nextState.chill, bal.buySomethingChillGain),
        };
        outcomeText = `You treated yourself. -$${bal.buySomethingCost}. ${godName} is strong this month.`;
      } else {
        nextState = { ...nextState, chill: applyChillGain(nextState.chill, bal.celebrateChillGain) };
        outcomeText = `Can't afford it. You celebrate alone instead. ${godName} is strong this month.`;
      }
      break;
    case 2: // Contemplate mortality
      nextState = { ...nextState, mana: applyManaRestore(nextState.mana, bal.contemplateManaGain, nextState.maxMana) };
      outcomeText = `You stare into the void. Mana restored. ${godName} is strong this month.`;
      break;
    default:
      outcomeText = 'Happy birthday.';
  }

  return setOutcome(nextState, outcomeText, choice);
}

function resolveDadDies(state: GameState, choice: number): GameState {
  const bal = evtBal.dad_dies;
  let outcomeText: string;
  let nextState = { ...state, dadAlive: false };

  switch (choice) {
    case 0: // Grieve
      nextState = {
        ...nextState,
        chill: Math.max(0, nextState.chill - bal.grieveChillLoss),
        mana: applyManaRestore(nextState.mana, bal.grieveManaGain, nextState.maxMana),
      };
      outcomeText = 'You let yourself feel it. The magic stirs.';
      break;
    case 1: // Check the will
      nextState = { ...nextState, cash: nextState.cash + bal.inheritanceCash };
      outcomeText = `He left you $${bal.inheritanceCash}. Typical.`;
      break;
    case 2: // Already dead to me
      nextState = { ...nextState, chill: applyChillGain(nextState.chill, bal.dismissChillGain) };
      outcomeText = "You shrug it off. You've been doing that your whole life.";
      break;
    default:
      outcomeText = 'Dad is gone.';
  }

  return setOutcome(nextState, outcomeText, choice);
}

function resolveBongBreaks(state: GameState, choice: number): GameState {
  const bal = evtBal.bong_breaks;
  let outcomeText: string;
  let nextState = state;

  // Find the bong furniture index.
  const bongIdx = state.furniture.findIndex(f => f.type === 'bong');

  switch (choice) {
    case 0: // Mourn it
      nextState = {
        ...nextState,
        chill: Math.max(0, nextState.chill - bal.mournChillLoss),
        furniture: bongIdx >= 0 ? removeFurniture(nextState.furniture, bongIdx) : nextState.furniture,
      };
      outcomeText = 'Gone but not forgotten. Your chill drops.';
      break;
    case 1: { // Try to fix it
      const [roll, nextSeed] = rng(nextState.rngSeed);
      nextState = { ...nextState, rngSeed: nextSeed };
      if (roll < bal.fixChance) {
        nextState = { ...nextState, chill: applyChillGain(nextState.chill, bal.fixSuccessChillGain) };
        outcomeText = "You managed to fix it! It's not pretty, but it works.";
      } else {
        nextState = {
          ...nextState,
          chill: Math.max(0, nextState.chill - bal.fixFailChillLoss),
          furniture: bongIdx >= 0 ? removeFurniture(nextState.furniture, bongIdx) : nextState.furniture,
        };
        outcomeText = 'The repair failed. It shatters completely.';
      }
      break;
    }
    case 2: // Throw it out
      nextState = {
        ...nextState,
        chill: applyChillGain(nextState.chill, bal.throwOutChillGain),
        furniture: bongIdx >= 0 ? removeFurniture(nextState.furniture, bongIdx) : nextState.furniture,
      };
      outcomeText = 'You toss it. Somehow that feels right.';
      break;
    default:
      outcomeText = 'The bong is gone.';
  }

  return setOutcome(nextState, outcomeText, choice);
}

function resolveSuspiciousClerk(state: GameState, choice: number): GameState {
  const bal = evtBal.suspicious_clerk;
  let outcomeText: string;
  let nextState = state;

  switch (choice) {
    case 0: // Act natural
      nextState = { ...nextState, chill: applyChillGain(nextState.chill, bal.actNaturalChillGain) };
      outcomeText = 'You play it cool. The clerk loses interest.';
      break;
    case 1: // Leave
      nextState = { ...nextState, chill: Math.max(0, nextState.chill - bal.leaveChillLoss) };
      outcomeText = 'You leave. The paranoia lingers.';
      break;
    case 2: // Smooth talk
      if (state.wizardFame >= bal.smoothTalkFameReq) {
        nextState = { ...nextState, chill: applyChillGain(nextState.chill, bal.smoothTalkChillGain) };
        outcomeText = 'You charm the clerk. They even give you a discount smile.';
      } else {
        nextState = { ...nextState, chill: Math.max(0, nextState.chill - bal.leaveChillLoss) };
        outcomeText = "The clerk isn't buying it. Awkward.";
      }
      break;
    default:
      outcomeText = 'The clerk watches you leave.';
  }

  return setOutcome(nextState, outcomeText, choice);
}

function resolveFellowScratcher(state: GameState, choice: number): GameState {
  const bal = evtBal.fellow_scratcher;
  let outcomeText: string;
  let nextState = state;

  switch (choice) {
    case 0: // Chat
      nextState = { ...nextState, chill: applyChillGain(nextState.chill, bal.chatChillGain) };
      outcomeText = 'You swap stories. Feels good to not be the only one.';
      break;
    case 1: // Ignore
      nextState = { ...nextState, cash: nextState.cash + bal.ignoreCashFind };
      outcomeText = `You look away and find $${bal.ignoreCashFind} on the ground. Nice.`;
      break;
    case 2: { // Share tips
      // Pick a random god to boost affinity.
      const gods: GodId[] = ['mesin', 'gul', 'klossa', 'skarhol', 'marena', 'azorius', 'ara', 'finhorn', 'beroan', 'sofiel'];
      const [roll, nextSeed] = rng(nextState.rngSeed);
      nextState = { ...nextState, rngSeed: nextSeed };
      const godIdx = Math.floor(roll * gods.length);
      const godId = gods[godIdx];
      const godName = getGod(godId).name;
      const newAffinity = { ...nextState.affinity };
      newAffinity[godId] = newAffinity[godId] + bal.shareTipAffinityGain;
      nextState = { ...nextState, affinity: newAffinity };
      outcomeText = `You share a tip about ${godName}'s symbols. Good karma.`;
      break;
    }
    default:
      outcomeText = 'The other scratcher walks away.';
  }

  return setOutcome(nextState, outcomeText, choice);
}

function resolveTempleJudgment(state: GameState, choice: number): GameState {
  const bal = evtBal.temple_judgment;
  let outcomeText: string;
  let nextState = state;

  // Get the temple's god.
  const locData = getLocationData(state.currentLocation);
  const godId = locData.godId;
  if (!godId) return setOutcome(state, 'The priest turns away.', choice);

  const godName = getGod(godId).name;

  switch (choice) {
    case 0: // Confess
      const newAff = { ...nextState.affinity };
      newAff[godId] = newAff[godId] + bal.confessAffinityGain;
      nextState = { ...nextState, affinity: newAff };
      outcomeText = `You confess. ${godName} approves.`;
      break;
    case 1: // Deny
      const newAff2 = { ...nextState.affinity };
      newAff2[godId] = newAff2[godId] - bal.denyAffinityLoss;
      nextState = {
        ...nextState,
        chill: Math.max(0, nextState.chill - bal.denyChillLoss),
        affinity: newAff2,
      };
      outcomeText = `You deny it. ${godName} is not amused.`;
      break;
    case 2: // Laugh
      nextState = { ...nextState, wizardFame: nextState.wizardFame + bal.laughFameGain };
      outcomeText = 'You laugh. A nearby pilgrim is impressed by your confidence.';
      break;
    default:
      outcomeText = 'The priest walks away.';
  }

  return setOutcome(nextState, outcomeText, choice);
}

function resolveCampusEncounter(state: GameState, choice: number): GameState {
  const bal = evtBal.campus_encounter;
  let outcomeText: string;
  let nextState = state;

  switch (choice) {
    case 0: // Brag
      nextState = { ...nextState, wizardFame: nextState.wizardFame + bal.bragFameGain };
      outcomeText = "You embellish wildly. They're impressed.";
      break;
    case 1: // Hide
      outcomeText = 'You duck behind a pillar. They walk past.';
      break;
    case 2: // Catch up
      nextState = {
        ...nextState,
        chill: applyChillGain(nextState.chill, bal.chatChillGain),
        wizardFame: nextState.wizardFame + bal.chatFameGain,
      };
      outcomeText = 'You catch up. It feels almost normal.';
      break;
    default:
      outcomeText = 'They walk away.';
  }

  return setOutcome(nextState, outcomeText, choice);
}

function resolveLoanShark(state: GameState, choice: number): GameState {
  const bal = evtBal.loan_shark;
  let outcomeText: string;
  let nextState = state;

  switch (choice) {
    case 0: // Take the money
      nextState = {
        ...nextState,
        cash: nextState.cash + bal.loanAmount,
        loanSharkDebt: bal.loanAmount,
        loanSharkInterestRate: bal.interestRate,
      };
      outcomeText = `You take $${bal.loanAmount}. The coat smiles. You owe them.`;
      break;
    case 1: // Decline
      nextState = { ...nextState, chill: applyChillGain(nextState.chill, bal.declineChillGain) };
      outcomeText = "You decline. They shrug and walk away.";
      break;
    case 2: // Tell them off
      nextState = { ...nextState, chill: Math.max(0, nextState.chill - bal.intimidateChillLoss) };
      outcomeText = 'They lean in close. You regret that immediately.';
      break;
    default:
      outcomeText = 'The coat disappears.';
  }

  return setOutcome(nextState, outcomeText, choice);
}

function resolveStormWarning(state: GameState, choice: number): GameState {
  const bal = evtBal.storm_warning;
  let outcomeText: string;
  let nextState = state;

  switch (choice) {
    case 0: // Push through
      nextState = {
        ...nextState,
        clock: advanceClock(nextState.clock, bal.pushThroughExtraMinutes),
        chill: Math.max(0, nextState.chill - bal.pushThroughChillLoss),
      };
      outcomeText = 'You push through the storm. Soaked and rattled.';
      break;
    case 1: // Find shelter
      nextState = {
        ...nextState,
        clock: advanceClock(nextState.clock, bal.shelterExtraMinutes),
        chill: applyChillGain(nextState.chill, bal.shelterChillGain),
      };
      outcomeText = 'You wait it out under an awning. Not bad, actually.';
      break;
    case 2: // Turn back
      // Cancel the travel — stay at current location. No time penalty beyond the event itself.
      outcomeText = 'You turn back. Better safe than sorry.';
      break;
    default:
      outcomeText = 'The storm passes.';
  }

  return setOutcome(nextState, outcomeText, choice);
}

function resolveWinningTicket(state: GameState, choice: number): GameState {
  const bal = evtBal.winning_ticket;
  let outcomeText: string;
  let nextState = state;

  switch (choice) {
    case 0: // Cheer
      nextState = { ...nextState, chill: applyChillGain(nextState.chill, bal.cheerChillGain) };
      outcomeText = "You cheer. They buy you a coffee. Life's alright.";
      break;
    case 1: // Seethe
      nextState = {
        ...nextState,
        chill: Math.max(0, nextState.chill - bal.envyChillLoss),
        addictionNeed: growNeed(nextState.addictionNeed, 1),
      };
      outcomeText = 'The jealousy burns. You need to scratch.';
      break;
    case 2: // Ask for cut
      nextState = { ...nextState, cash: nextState.cash + bal.hustleCashGain };
      outcomeText = `They laugh but toss you $${bal.hustleCashGain}. Not bad.`;
      break;
    default:
      outcomeText = 'The winner walks away.';
  }

  return setOutcome(nextState, outcomeText, choice);
}

function resolveWizardFameMoment(state: GameState, choice: number): GameState {
  const bal = evtBal.wizard_fame_moment;
  let outcomeText: string;
  let nextState = state;

  switch (choice) {
    case 0: // Embrace
      nextState = {
        ...nextState,
        wizardFame: nextState.wizardFame + bal.embraceFameGain,
        chill: applyChillGain(nextState.chill, bal.embraceChillGain),
      };
      outcomeText = 'You wave. They wave back. Celebrity vibes.';
      break;
    case 1: // Deny
      nextState = { ...nextState, wizardFame: Math.max(0, nextState.wizardFame - bal.denyFameLoss) };
      outcomeText = '"Wrong wizard." They look confused.';
      break;
    case 2: // Exploit
      nextState = {
        ...nextState,
        cash: nextState.cash + bal.exploitCashGain,
        wizardFame: Math.max(0, nextState.wizardFame - bal.exploitFameLoss),
      };
      outcomeText = `You sign autographs for $${bal.exploitCashGain}. Fame fades.`;
      break;
    default:
      outcomeText = 'They walk away.';
  }

  return setOutcome(nextState, outcomeText, choice);
}

function resolveBadBatch(state: GameState, choice: number): GameState {
  const bal = evtBal.bad_batch;
  let outcomeText: string;
  let nextState = state;

  switch (choice) {
    case 0: // Scratch anyway
      // The odds modifier would need to be applied to the next scratch session.
      // For now, apply chill loss. The modifier is stored transiently via the event system.
      nextState = { ...nextState, chill: Math.max(0, nextState.chill - bal.scratchAnywayChillLoss) };
      outcomeText = 'You scratch them. They feel wrong in your hands.';
      break;
    case 1: // Swap tickets
      nextState = { ...nextState, clock: advanceClock(nextState.clock, bal.swapTicketsTimeCost) };
      outcomeText = 'The clerk swaps them out. Took a while.';
      break;
    case 2: // Leave
      nextState = { ...nextState, chill: Math.max(0, nextState.chill - bal.leaveChillLoss) };
      outcomeText = 'You leave empty-handed. The paranoia lingers.';
      break;
    default:
      outcomeText = 'Something felt off.';
  }

  return setOutcome(nextState, outcomeText, choice);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setOutcome(state: GameState, outcomeText: string, choiceIndex: number): GameState {
  if (!state.activeEvent) return state;
  return {
    ...state,
    activeEvent: {
      ...state.activeEvent,
      resolved: true,
      outcomeText,
      choiceIndex,
    },
  };
}

/** Apply loan shark interest on day rollover. */
export function applyLoanSharkInterest(state: GameState): GameState {
  if (state.loanSharkDebt <= 0) return state;
  const interest = Math.round(state.loanSharkDebt * state.loanSharkInterestRate * 100) / 100;
  return { ...state, loanSharkDebt: state.loanSharkDebt + interest };
}

/** Attempt loan shark debt collection on rent day. */
export function collectLoanSharkDebt(state: GameState): GameState {
  if (state.loanSharkDebt <= 0) return state;

  const owed = Math.ceil(state.loanSharkDebt);
  if (state.cash >= owed) {
    // Full repayment.
    return { ...state, cash: state.cash - owed, loanSharkDebt: 0, loanSharkInterestRate: 0 };
  }

  // Partial: take what they can, chill penalty for remaining.
  const taken = state.cash;
  const remaining = state.loanSharkDebt - taken;
  return {
    ...state,
    cash: 0,
    loanSharkDebt: remaining,
    chill: Math.max(0, state.chill - 15),  // intimidation penalty
  };
}
