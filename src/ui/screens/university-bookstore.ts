// University Bookstore screen — buy spell scrolls at a premium.
// Sprint 16: University Heights only; prices are 1.5× the standard scroll store.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { formatCash } from '../../util/format';
import { makeButton, makeHeader, makeDivider, makeInventoryPanel } from '../components';
import { formatClock, previewClock } from '../../engine/time';
import { getTravelCostRaw } from '../../systems/travel';
import { canFitItems } from '../../systems/inventory';
import { isSpellKnown } from '../../systems/spellbook';
import { SPELL_CATALOG } from '../../data/spells';
import {
  getLocationData,
  getLocationNeighborhood,
  NEIGHBORHOODS,
  getNeighborhoodBodega,
  getNeighborhoodTemples,
  getNeighborhoodFurnitureStore,
  getNeighborhoodUniversity,
  getNeighborhoodScrollStore,
  getNeighborhoodBookstore,
  getNeighborhoodDadsHouse,
} from '../../data/locations';
import balance from '../../data/balance.json';

type Dispatch = (action: GameAction) => void;

const scrollsBal = (balance as Record<string, unknown>).scrolls as {
  priceByLevel: Record<string, number>;
  bookstoreMarkup: number;
  storePurchaseTimeCost: number;
};

export function renderUniversityBookstore(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.innerHTML = '';

  const screen = document.createElement('div');
  screen.className = 'screen university-bookstore-screen';

  const locData = getLocationData(state.currentLocation);
  screen.appendChild(makeHeader(locData.displayName));
  screen.appendChild(makeDivider());

  // ── Cash display ──
  const cashRow = document.createElement('p');
  cashRow.className = 'cash-bar';
  cashRow.textContent = `Cash: ${formatCash(state.cash)}`;
  screen.appendChild(cashRow);

  // ── Flavor note ──
  const flavorEl = document.createElement('p');
  flavorEl.className = 'bookstore-flavor';
  flavorEl.textContent = 'One-use scrolls. Fine parchment. Premium prices.';
  screen.appendChild(flavorEl);

  screen.appendChild(makeDivider());

  // ── Scroll catalog ──
  screen.appendChild(makeHeader('SPELL SCROLLS FOR SALE'));

  const unknownSpells = SPELL_CATALOG.filter(spell => !isSpellKnown(state.knownSpells, spell.id));

  if (unknownSpells.length === 0) {
    const noneEl = document.createElement('p');
    noneEl.className = 'scroll-none';
    noneEl.textContent = 'You know all these spells. Nothing here for you.';
    screen.appendChild(noneEl);
  } else {
    const hasInventorySpace = canFitItems(state.inventory, 1);

    for (const spell of unknownSpells) {
      const basePrice = scrollsBal.priceByLevel[String(spell.level)] ?? 50;
      const price = Math.floor(basePrice * scrollsBal.bookstoreMarkup);
      const canAfford = state.cash >= price;

      const row = document.createElement('div');
      row.className = 'scroll-store-row';

      const nameEl = document.createElement('p');
      nameEl.className = 'scroll-store-name';
      nameEl.textContent = `${spell.name} (Lvl ${spell.level})  ${formatCash(price)}`;
      row.appendChild(nameEl);

      const descEl = document.createElement('p');
      descEl.className = 'scroll-store-desc';
      descEl.textContent = spell.description;
      row.appendChild(descEl);

      const buyBtn = makeButton('[BUY]', () => {
        dispatch({ type: 'BUY_SCROLL', spellId: spell.id });
      }, 'scroll-btn');
      if (!canAfford || !hasInventorySpace) buyBtn.disabled = true;
      row.appendChild(buyBtn);

      screen.appendChild(row);
    }
  }

  // ── Inventory panel ──
  screen.appendChild(makeDivider());
  screen.appendChild(
    makeInventoryPanel(
      state.inventory,
      (slotIndex) => dispatch({ type: 'CONSUME_SNACK', slotIndex }),
      (slotIndex, godId) => dispatch({ type: 'USE_SCROLL', slotIndex, godId }),
    ),
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

  const currentNeighborhood = getLocationNeighborhood(state.currentLocation);

  // Other neighborhoods.
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

    const fsId = getNeighborhoodFurnitureStore(neighborhood.id);
    const fsData = getLocationData(fsId);
    const fsCost = getTravelCostRaw(state.currentLocation, fsId);
    const fsClock = previewClock(state.clock, fsCost);
    screen.appendChild(makeButton(
      `${fsData.displayName}  \u2192  ${formatClock(fsClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: fsId }),
      'nav-btn',
    ));

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

    const ssId = getNeighborhoodScrollStore(neighborhood.id);
    const ssData = getLocationData(ssId);
    const ssCost = getTravelCostRaw(state.currentLocation, ssId);
    const ssClock = previewClock(state.clock, ssCost);
    screen.appendChild(makeButton(
      `${ssData.displayName}  \u2192  ${formatClock(ssClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: ssId }),
      'nav-btn',
    ));

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
  }

  // Local neighborhood (University Heights — show everything except self).
  const localBodega = getNeighborhoodBodega(currentNeighborhood);
  const localBodegaData = getLocationData(localBodega);
  const lbCost = getTravelCostRaw(state.currentLocation, localBodega);
  const lbClock = previewClock(state.clock, lbCost);
  screen.appendChild(makeButton(
    `${localBodegaData.displayName}  \u2192  ${formatClock(lbClock)}`,
    () => dispatch({ type: 'TRAVEL', destination: localBodega }),
    'nav-btn',
  ));

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

  const localFsId = getNeighborhoodFurnitureStore(currentNeighborhood);
  const localFsData = getLocationData(localFsId);
  const localFsCost = getTravelCostRaw(state.currentLocation, localFsId);
  const localFsClock = previewClock(state.clock, localFsCost);
  screen.appendChild(makeButton(
    `${localFsData.displayName}  \u2192  ${formatClock(localFsClock)}`,
    () => dispatch({ type: 'TRAVEL', destination: localFsId }),
    'nav-btn',
  ));

  const localUniId = getNeighborhoodUniversity(currentNeighborhood);
  if (localUniId) {
    const localUniData = getLocationData(localUniId);
    const localUniCost = getTravelCostRaw(state.currentLocation, localUniId);
    const localUniClock = previewClock(state.clock, localUniCost);
    screen.appendChild(makeButton(
      `${localUniData.displayName}  \u2192  ${formatClock(localUniClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: localUniId }),
      'nav-btn',
    ));
  }

  const localSsId = getNeighborhoodScrollStore(currentNeighborhood);
  const localSsData = getLocationData(localSsId);
  const localSsCost = getTravelCostRaw(state.currentLocation, localSsId);
  const localSsClock = previewClock(state.clock, localSsCost);
  screen.appendChild(makeButton(
    `${localSsData.displayName}  \u2192  ${formatClock(localSsClock)}`,
    () => dispatch({ type: 'TRAVEL', destination: localSsId }),
    'nav-btn',
  ));
  // Dad's House (Richville only)
  const localDhId = getNeighborhoodDadsHouse(currentNeighborhood);
  if (localDhId && localDhId !== state.currentLocation) {
    const localDhData = getLocationData(localDhId);
    const localDhCost = getTravelCostRaw(state.currentLocation, localDhId);
    const localDhClock = previewClock(state.clock, localDhCost);
    const localDhLabel = state.dadAlive ? localDhData.displayName : "DAD'S GRAVE";
    screen.appendChild(makeButton(
      `${localDhLabel}  \u2192  ${formatClock(localDhClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: localDhId }),
      'nav-btn',
    ));
  }
  // (Self — bookstore — is omitted.)

  container.appendChild(screen);
}
