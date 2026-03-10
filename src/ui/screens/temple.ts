// Temple screen: donate to a god (private/public) and pray for timed buffs.
// Sprint 9: each temple is dedicated to one god; actions infer god from location.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { makeButton, makeHeader, makeDivider, makeInventoryPanel } from '../components';
import { formatCash } from '../../util/format';
import { formatClock, previewClock } from '../../engine/time';
import { getTravelCostRaw } from '../../systems/travel';
import {
  getLocationData,
  getNeighborhoodTemples,
  NEIGHBORHOODS,
  getNeighborhoodBodega,
} from '../../data/locations';
import { getGod } from '../../data/gods';
import balance from '../../data/balance.json';

type Dispatch = (action: GameAction) => void;

const prayerBal = (balance as Record<string, unknown>).prayer as {
  donationAmounts: number[];
  durationOptions: number[];
};

export function renderTemple(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.innerHTML = '';
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

  // ── Inventory ──
  screen.appendChild(makeDivider());
  screen.appendChild(
    makeInventoryPanel(state.inventory, (slotIndex) => {
      dispatch({ type: 'CONSUME_SNACK', slotIndex });
    }),
  );

  // ── Travel ──
  screen.appendChild(makeDivider());
  screen.appendChild(makeHeader('TRAVEL'));

  // Tower (home)
  const towerCost = getTravelCostRaw(state.currentLocation, 'tower');
  const towerClock = previewClock(state.clock, towerCost);
  screen.appendChild(makeButton(
    `TOWER (HOME)  \u2192  ${formatClock(towerClock)}`,
    () => dispatch({ type: 'TRAVEL', destination: 'tower' }),
    'nav-btn',
  ));

  // All neighborhoods: bodegas + temples (skip current location)
  for (const neighborhood of NEIGHBORHOODS) {
    const nbLabel = document.createElement('p');
    nbLabel.className = 'neighborhood-label';
    nbLabel.textContent = neighborhood.name.toUpperCase();
    screen.appendChild(nbLabel);

    // Bodega
    const bodegaId = getNeighborhoodBodega(neighborhood.id);
    const bodegaData = getLocationData(bodegaId);
    const bodegaCost = getTravelCostRaw(state.currentLocation, bodegaId);
    const bodegaClock = previewClock(state.clock, bodegaCost);
    screen.appendChild(makeButton(
      `${bodegaData.displayName}  \u2192  ${formatClock(bodegaClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: bodegaId }),
      'nav-btn',
    ));

    // Temples (skip self)
    const temples = getNeighborhoodTemples(neighborhood.id);
    for (const temple of temples) {
      if (temple.id === state.currentLocation) continue;
      const tCost = getTravelCostRaw(state.currentLocation, temple.id);
      const tClock = previewClock(state.clock, tCost);
      screen.appendChild(makeButton(
        `${temple.displayName}  \u2192  ${formatClock(tClock)}`,
        () => dispatch({ type: 'TRAVEL', destination: temple.id }),
        'nav-btn',
      ));
    }
  }

  container.appendChild(screen);
}
