// University screen — learn spells and bookbinding.
// Sprint 14: classes available 10am–4pm, 3 random spells per day.
// Redesign: INVENTORY and TRAVEL moved to modal popups.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import {
  makeButton, makeHeader, makeDivider, makeInventoryPanel, makeModal, makeTravelPanel,
  makeGodSelectPanel,
} from '../components';
import { formatCash } from '../../util/format';
import { formatClock } from '../../engine/time';
import { getDailyClasses, calcLearningTime, isSpellKnown } from '../../systems/spellbook';
import { BOOKBINDING_CLASS } from '../../data/spells';
import { bal } from '../../data/balance-types';
import { getModal, openModal, closeModal } from '../modal';

type Dispatch = (action: GameAction) => void;

const SCREEN = 'university';
const uniBal = bal.university;

export function renderUniversity(
  state: GameState,
  container: HTMLElement,
  dispatch: Dispatch,
): void {
  container.replaceChildren();

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

  // ── Section buttons ──
  screen.appendChild(makeDivider());

  const invCount = state.inventory.filter(i => i !== null).length;
  screen.appendChild(makeButton(
    `INVENTORY (${invCount}/${state.inventory.length})`,
    () => openModal(SCREEN, 'inventory', () => renderUniversity(state, container, dispatch)),
    'section-btn',
  ));

  screen.appendChild(makeButton(
    'TRAVEL',
    () => openModal(SCREEN, 'travel', () => renderUniversity(state, container, dispatch)),
    'section-btn',
  ));

  container.appendChild(screen);

  // ── Active modal ──
  const activeModal = getModal(SCREEN);
  if (activeModal !== null) {
    const rerender = () => renderUniversity(state, container, dispatch);
    const onClose = () => closeModal(SCREEN, rerender);

    if (activeModal === 'inventory') {
      container.appendChild(makeModal({
        title: 'INVENTORY',
        body: makeInventoryPanel(
          state.inventory,
          (slotIndex) => dispatch({ type: 'CONSUME_SNACK', slotIndex }),
          (slotIndex, godId) => dispatch({ type: 'USE_SCROLL', slotIndex, godId }),
          (slotIndex) => openModal(SCREEN, `god_select:${slotIndex}`, rerender),
        ),
        onClose,
      }));
    } else if (activeModal.startsWith('god_select:')) {
      const slotIndex = parseInt(activeModal.slice(11), 10);
      container.appendChild(makeModal({
        title: 'SELECT GOD',
        body: makeGodSelectPanel((godId) => dispatch({ type: 'USE_SCROLL', slotIndex, godId })),
        onClose,
        onBack: () => openModal(SCREEN, 'inventory', rerender),
      }));
    } else if (activeModal === 'travel' || activeModal.startsWith('travel:')) {
      const isLevel2 = activeModal.startsWith('travel:');
      const nbName = isLevel2 ? activeModal.slice(7).replace(/_/g, ' ').toUpperCase() : 'TRAVEL';
      container.appendChild(makeModal({
        title: nbName,
        body: makeTravelPanel(state, dispatch, SCREEN, activeModal, rerender),
        onClose,
        onBack: isLevel2 ? () => openModal(SCREEN, 'travel', rerender) : undefined,
      }));
    }
  }
}
