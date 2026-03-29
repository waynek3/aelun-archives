// Temple screen: donate to a god (private/public) and pray for timed buffs.
// Sprint 9: each temple is dedicated to one god; actions infer god from location.
// Redesign: INVENTORY and TRAVEL moved to modal popups.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import {
  makeButton, makeHeader, makeDivider, makeInventoryPanel, makeModal, makeTravelPanel,
} from '../components';
import { formatCash } from '../../util/format';
import { formatClock, previewClock } from '../../engine/time';
import { getLocationData } from '../../data/locations';
import { getGod } from '../../data/gods';
import { bal } from '../../data/balance-types';
import { getModal, openModal, closeModal } from '../modal';

type Dispatch = (action: GameAction) => void;

const SCREEN = 'temple';
const prayerBal = bal.prayer;

export function renderTemple(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.replaceChildren();
  const screen = document.createElement('div');
  screen.className = 'screen temple-screen';

  const locData = getLocationData(state.currentLocation);
  const godId = locData.godId!;
  const god = getGod(godId);

  // ── Header ──
  screen.appendChild(makeHeader(locData.displayName));
  const subtitle = document.createElement('p');
  subtitle.className = 'temple-subtitle';
  subtitle.textContent = `Dedicated to ${god.name}`;
  screen.appendChild(subtitle);

  // Sprint 11: show strong month indicator when current month is god's strong month.
  if (god.strongMonths.includes(state.month)) {
    const strongLine = document.createElement('p');
    strongLine.className = 'temple-strong-month';
    strongLine.textContent = '\u2605 STRONG MONTH \u2014 AFFINITY GAINS DOUBLED';
    screen.appendChild(strongLine);
  }

  screen.appendChild(makeDivider());

  // ── Cash ──
  const cashLine = document.createElement('p');
  cashLine.className = 'temple-cash';
  cashLine.textContent = `Cash: ${formatCash(state.cash)}`;
  screen.appendChild(cashLine);
  screen.appendChild(makeDivider());

  // ── Monument Donation ──
  screen.appendChild(makeHeader('MONUMENT DONATION'));
  const monNote = document.createElement('p');
  monNote.className = 'temple-note';
  monNote.textContent = 'Consecrate a crafted monument. Greater than any cash gift.';
  screen.appendChild(monNote);

  const monuments = state.inventory
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => item !== null && item.type === 'monument');

  if (monuments.length === 0) {
    const noMon = document.createElement('p');
    noMon.className = 'temple-note';
    noMon.textContent = 'No monuments in inventory.';
    screen.appendChild(noMon);
  } else {
    const sizeLabel: Record<string, string> = {
      small: 'Small (moderate)',
      medium: 'Medium (significant)',
      large: 'Large (major)',
    };
    for (const { item, i } of monuments) {
      if (!item || item.type !== 'monument') continue;
      const label = `${sizeLabel[item.size] ?? item.size} Monument`;
      const btn = makeButton(
        `DONATE  \u2192  ${label}`,
        () => dispatch({ type: 'DONATE_MONUMENT', slotIndex: i }),
        'temple-btn',
      );
      screen.appendChild(btn);
    }
  }

  screen.appendChild(makeDivider());

  // ── Private Donation ──
  screen.appendChild(makeHeader('PRIVATE DONATION'));
  const privNote = document.createElement('p');
  privNote.className = 'temple-note';
  privNote.textContent = 'Higher devotion. Known only to the god.';
  screen.appendChild(privNote);

  for (const amount of prayerBal.donationAmounts) {
    const btn = makeButton(
      `Donate ${formatCash(amount)}`,
      () => dispatch({ type: 'DONATE_PRIVATE', amount }),
      'temple-btn',
    );
    if (state.cash < amount) btn.disabled = true;
    screen.appendChild(btn);
  }

  screen.appendChild(makeDivider());

  // ── Public Donation ──
  screen.appendChild(makeHeader('PUBLIC DONATION'));
  const pubNote = document.createElement('p');
  pubNote.className = 'temple-note';
  pubNote.textContent = 'Lesser devotion. Word spreads. (+Fame)';
  screen.appendChild(pubNote);

  for (const amount of prayerBal.donationAmounts) {
    const btn = makeButton(
      `Donate ${formatCash(amount)}  (+FAME)`,
      () => dispatch({ type: 'DONATE_PUBLIC', amount }),
      'temple-btn',
    );
    if (state.cash < amount) btn.disabled = true;
    screen.appendChild(btn);
  }

  screen.appendChild(makeDivider());

  // ── Prayer ──
  screen.appendChild(makeHeader('PRAY'));
  const prayNote = document.createElement('p');
  prayNote.className = 'temple-note';
  prayNote.textContent = 'Meditate. Restores mana. Grants a timed blessing.';
  screen.appendChild(prayNote);

  for (const minutes of prayerBal.durationOptions) {
    const arrivalClock = previewClock(state.clock, minutes);
    const btn = makeButton(
      `Pray ${minutes} min  \u2192  ${formatClock(arrivalClock)}`,
      () => dispatch({ type: 'PRAY', duration: minutes }),
      'temple-btn',
    );
    screen.appendChild(btn);
  }

  // ── Section buttons ──
  screen.appendChild(makeDivider());

  const invCount = state.inventory.filter(i => i !== null).length;
  screen.appendChild(makeButton(
    `INVENTORY (${invCount}/${state.inventory.length})`,
    () => openModal(SCREEN, 'inventory', () => renderTemple(state, container, dispatch)),
    'section-btn',
  ));

  screen.appendChild(makeButton(
    'TRAVEL',
    () => openModal(SCREEN, 'travel', () => renderTemple(state, container, dispatch)),
    'section-btn',
  ));

  container.appendChild(screen);

  // ── Active modal ──
  const activeModal = getModal(SCREEN);
  if (activeModal !== null) {
    const onClose = () => closeModal(SCREEN, () => renderTemple(state, container, dispatch));
    let body: HTMLElement;
    let title: string;

    if (activeModal === 'inventory') {
      title = 'INVENTORY';
      body = makeInventoryPanel(
        state.inventory,
        (slotIndex) => dispatch({ type: 'CONSUME_SNACK', slotIndex }),
        (slotIndex, godId) => dispatch({ type: 'USE_SCROLL', slotIndex, godId }),
      );
    } else {
      title = 'TRAVEL';
      body = makeTravelPanel(state, dispatch);
    }

    container.appendChild(makeModal(title, body, onClose));
  }
}
