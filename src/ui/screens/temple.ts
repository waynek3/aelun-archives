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
  getNeighborhoodFurnitureStore,
  getNeighborhoodUniversity,
  getNeighborhoodScrollStore,
  getNeighborhoodBookstore,
  getNeighborhoodDadsHouse,
  getNeighborhoodBar,
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

  // ── Inventory ──
  screen.appendChild(makeDivider());
  screen.appendChild(
    makeInventoryPanel(
      state.inventory,
      (slotIndex) => dispatch({ type: 'CONSUME_SNACK', slotIndex }),
      (slotIndex, godId) => dispatch({ type: 'USE_SCROLL', slotIndex, godId }),
    ),
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

  // All neighborhoods: bodegas + temples + stores (skip current location)
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

    // Furniture store
    const fsId = getNeighborhoodFurnitureStore(neighborhood.id);
    const fsData = getLocationData(fsId);
    const fsCost = getTravelCostRaw(state.currentLocation, fsId);
    const fsClock = previewClock(state.clock, fsCost);
    screen.appendChild(makeButton(
      `${fsData.displayName}  \u2192  ${formatClock(fsClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: fsId }),
      'nav-btn',
    ));

    // University (only university_heights has one)
    const uniId = getNeighborhoodUniversity(neighborhood.id);
    if (uniId) {
      const uniData = getLocationData(uniId);
      const uniCost = getTravelCostRaw(state.currentLocation, uniId);
      const uniClock = previewClock(state.clock, uniCost);
      screen.appendChild(makeButton(
        `${uniData.displayName}  \u2192  ${formatClock(uniClock)}`,
        () => dispatch({ type: 'TRAVEL', destination: uniId }),
        'nav-btn',
      ));
    }

    // Scroll store
    const ssId = getNeighborhoodScrollStore(neighborhood.id);
    const ssData = getLocationData(ssId);
    const ssCost = getTravelCostRaw(state.currentLocation, ssId);
    const ssClock = previewClock(state.clock, ssCost);
    screen.appendChild(makeButton(
      `${ssData.displayName}  \u2192  ${formatClock(ssClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: ssId }),
      'nav-btn',
    ));

    // University bookstore (only university_heights has one)
    const bsId = getNeighborhoodBookstore(neighborhood.id);
    if (bsId) {
      const bsData = getLocationData(bsId);
      const bsCost = getTravelCostRaw(state.currentLocation, bsId);
      const bsClock = previewClock(state.clock, bsCost);
      screen.appendChild(makeButton(
        `${bsData.displayName}  \u2192  ${formatClock(bsClock)}`,
        () => dispatch({ type: 'TRAVEL', destination: bsId }),
        'nav-btn',
      ));
    }

    // Dad's House (Richville only)
    const dhId = getNeighborhoodDadsHouse(neighborhood.id);
    if (dhId && dhId !== state.currentLocation) {
      const dhData = getLocationData(dhId);
      const dhCost = getTravelCostRaw(state.currentLocation, dhId);
      const dhClock = previewClock(state.clock, dhCost);
      const dhLabel = state.dadAlive ? dhData.displayName : "DAD'S GRAVE";
      screen.appendChild(makeButton(
        `${dhLabel}  \u2192  ${formatClock(dhClock)}`,
        () => dispatch({ type: 'TRAVEL', destination: dhId }),
        'nav-btn',
      ));
    }

    // Sprint 25: University Bar (University Heights only)
    const barId = getNeighborhoodBar(neighborhood.id);
    if (barId) {
      const barData = getLocationData(barId);
      const barCost = getTravelCostRaw(state.currentLocation, barId);
      const barClock = previewClock(state.clock, barCost);
      screen.appendChild(makeButton(
        `${barData.displayName}  \u2192  ${formatClock(barClock)}`,
        () => dispatch({ type: 'TRAVEL', destination: barId }),
        'nav-btn',
      ));
    }
  }

  container.appendChild(screen);
}
