// University screen — learn spells and bookbinding.
// Sprint 14: classes available 10am–4pm, 3 random spells per day.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { makeButton, makeHeader, makeDivider, makeInventoryPanel } from '../components';
import { formatCash } from '../../util/format';
import { formatClock, previewClock } from '../../engine/time';
import { getTravelCostRaw } from '../../systems/travel';
import { getDailyClasses, calcLearningTime, isSpellKnown } from '../../systems/spellbook';
import { BOOKBINDING_CLASS } from '../../data/spells';
import {
  NEIGHBORHOODS,
  getNeighborhoodBodega,
  getNeighborhoodTemples,
  getLocationData,
  getLocationNeighborhood,
} from '../../data/locations';
import balance from '../../data/balance.json';

type Dispatch = (action: GameAction) => void;

const uniBal = (balance as Record<string, unknown>).university as {
  openTime: number;
  closeTime: number;
  classesPerDay: number;
};

export function renderUniversity(
  state: GameState,
  container: HTMLElement,
  dispatch: Dispatch,
): void {
  container.innerHTML = '';

  const screen = document.createElement('div');
  screen.className = 'screen university-screen';

  // ── Header ──
  screen.appendChild(makeHeader('UNIVERSITY'));
  screen.appendChild(makeDivider());

  // ── Hours status ──
  const isOpen = state.clock >= uniBal.openTime && state.clock < uniBal.closeTime;
  const statusEl = document.createElement('p');
  statusEl.className = 'university-status';
  statusEl.textContent = isOpen
    ? `OPEN  ${formatClock(uniBal.openTime)} \u2013 ${formatClock(uniBal.closeTime)}`
    : `CLOSED  (opens ${formatClock(uniBal.openTime)})`;
  screen.appendChild(statusEl);

  screen.appendChild(makeDivider());

  // ── Classes available today ──
  screen.appendChild(makeHeader('CLASSES TODAY'));

  const dailyClasses = getDailyClasses(
    state.day, state.month, state.year,
    uniBal.classesPerDay,
  );

  for (const spell of dailyClasses) {
    const known = isSpellKnown(state.knownSpells, spell.id);
    const learnTime = calcLearningTime(spell.learningTime, state.intelligence);

    const row = document.createElement('div');
    row.className = 'class-row';

    const nameEl = document.createElement('p');
    nameEl.className = 'class-name';
    nameEl.textContent = known
      ? `${spell.name} (Lvl ${spell.level}) \u2713 known`
      : `${spell.name} (Lvl ${spell.level})`;
    row.appendChild(nameEl);

    const descEl = document.createElement('p');
    descEl.className = 'class-desc';
    descEl.textContent = spell.description;
    row.appendChild(descEl);

    if (!known) {
      const costEl = document.createElement('p');
      costEl.className = 'class-cost';
      costEl.textContent = `${formatCash(spell.learningCost)} | ~${learnTime} min | ${spell.learningMana} mana`;
      row.appendChild(costEl);

      const canAfford = state.cash >= spell.learningCost;
      const hasMana = state.mana >= spell.learningMana;

      const learnBtn = makeButton('[LEARN]', () => {
        dispatch({ type: 'ATTEND_CLASS', spellId: spell.id });
      }, 'class-btn');

      if (!isOpen || !canAfford || !hasMana) {
        learnBtn.disabled = true;
      }

      row.appendChild(learnBtn);
    }

    screen.appendChild(row);
  }

  // ── Bookbinding class ──
  screen.appendChild(makeDivider());
  screen.appendChild(makeHeader(`BOOKBINDING (Rank ${state.bookbinding})`));

  const bbTime = calcLearningTime(BOOKBINDING_CLASS.baseTime, state.intelligence);
  const bbCostEl = document.createElement('p');
  bbCostEl.className = 'class-cost';
  bbCostEl.textContent = `${formatCash(BOOKBINDING_CLASS.cost)} | ~${bbTime} min | ${BOOKBINDING_CLASS.mana} mana`;
  screen.appendChild(bbCostEl);

  const canAffordBB = state.cash >= BOOKBINDING_CLASS.cost;
  const hasManaBB = state.mana >= BOOKBINDING_CLASS.mana;

  const bbBtn = makeButton('[LEARN BOOKBINDING]', () => {
    dispatch({ type: 'LEARN_BOOKBINDING' });
  }, 'class-btn');

  if (!isOpen || !canAffordBB || !hasManaBB) {
    bbBtn.disabled = true;
  }
  screen.appendChild(bbBtn);

  // ── Inventory panel ──
  screen.appendChild(makeDivider());
  screen.appendChild(
    makeInventoryPanel(state.inventory, (slotIndex) => {
      dispatch({ type: 'CONSUME_SNACK', slotIndex });
    }),
  );

  // ── Travel section ──
  screen.appendChild(makeDivider());
  screen.appendChild(makeHeader('TRAVEL'));

  // Tower (home) always first.
  const towerCost = getTravelCostRaw(state.currentLocation, 'tower');
  const towerClock = previewClock(state.clock, towerCost);
  screen.appendChild(makeButton(
    `TOWER (HOME)  \u2192  ${formatClock(towerClock)}`,
    () => dispatch({ type: 'TRAVEL', destination: 'tower' }),
    'nav-btn',
  ));

  // Other neighborhoods' locations.
  const currentNeighborhood = getLocationNeighborhood(state.currentLocation);
  for (const neighborhood of NEIGHBORHOODS) {
    if (neighborhood.id === currentNeighborhood) continue;
    const destId = getNeighborhoodBodega(neighborhood.id);
    const destData = getLocationData(destId);
    const cost = getTravelCostRaw(state.currentLocation, destId);
    const arrival = previewClock(state.clock, cost);
    screen.appendChild(makeButton(
      `${neighborhood.name.toUpperCase()}: ${destData.displayName}  \u2192  ${formatClock(arrival)}`,
      () => dispatch({ type: 'TRAVEL', destination: destId }),
      'nav-btn',
    ));

    // Temples in this neighborhood.
    const temples = getNeighborhoodTemples(neighborhood.id);
    for (const temple of temples) {
      const tCost = getTravelCostRaw(state.currentLocation, temple.id);
      const tClock = previewClock(state.clock, tCost);
      screen.appendChild(makeButton(
        `${temple.displayName}  \u2192  ${formatClock(tClock)}`,
        () => dispatch({ type: 'TRAVEL', destination: temple.id }),
        'nav-btn',
      ));
    }
  }

  // Local neighborhood temples.
  const localTemples = getNeighborhoodTemples(currentNeighborhood);
  for (const temple of localTemples) {
    const tCost = getTravelCostRaw(state.currentLocation, temple.id);
    const tClock = previewClock(state.clock, tCost);
    screen.appendChild(makeButton(
      `${temple.displayName}  \u2192  ${formatClock(tClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: temple.id }),
      'nav-btn',
    ));
  }

  container.appendChild(screen);
}
