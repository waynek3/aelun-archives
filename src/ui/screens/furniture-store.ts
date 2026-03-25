// Furniture Store screen: buy furniture for the wizard tower.
// Sprint 13: Beds (swap upgrade), Lab Table, Bong.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { formatCash } from '../../util/format';
import { makeButton, makeHeader, makeDivider, makeInventoryPanel } from '../components';
import { formatClock, previewClock } from '../../engine/time';
import { getTravelCostRaw } from '../../systems/travel';
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
  getNeighborhoodBar,
} from '../../data/locations';
import { FURNITURE_CATALOG } from '../../data/furniture';
import { getBed, hasFurnitureSlot } from '../../systems/furniture';
import { bal } from '../../data/balance-types';

type Dispatch = (action: GameAction) => void;

export function renderFurnitureStore(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.replaceChildren();

  const screen = document.createElement('div');
  screen.className = 'screen furniture-store-screen';

  const locData = getLocationData(state.currentLocation);
  screen.appendChild(makeHeader(locData.displayName));
  screen.appendChild(makeDivider());

  // ── Cash display ──
  const cashRow = document.createElement('p');
  cashRow.className = 'cash-bar';
  cashRow.textContent = `Cash: ${formatCash(state.cash)}`;
  screen.appendChild(cashRow);

  // ── Tower slot count ──
  const furnitureMax = bal.furniture.maxSlots;
  const slotInfo = document.createElement('p');
  slotInfo.className = 'slot-info';
  slotInfo.textContent = `Tower: ${state.furniture.length}/${furnitureMax} slots`;
  screen.appendChild(slotInfo);

  screen.appendChild(makeDivider());

  // ── Furniture catalog ──
  screen.appendChild(makeHeader('FOR SALE'));

  const currentBed = getBed(state.furniture);
  const slotsAvailable = hasFurnitureSlot(state.furniture, furnitureMax);

  for (const def of FURNITURE_CATALOG) {
    const row = document.createElement('div');
    row.className = 'furniture-store-row';

    const nameEl = document.createElement('span');
    nameEl.className = 'furniture-store-name';

    let label = `${def.name}  ${formatCash(def.cost)}`;
    let canBuy = state.cash >= def.cost;
    let owned = false;

    if (def.type === 'bed') {
      if (currentBed && currentBed.id === def.id) {
        label += '  (owned)';
        canBuy = false;
        owned = true;
      } else if (currentBed && currentBed.quality >= def.quality) {
        label += '  (downgrade)';
        canBuy = false;
      } else if (currentBed) {
        label += '  (upgrade)';
      }
    } else if (def.type === 'lab_table' || def.type === 'crystal_ball') {
      const hasOne = state.furniture.some(f => f.type === def.type);
      if (hasOne) {
        label += '  (owned)';
        canBuy = false;
        owned = true;
      } else if (!slotsAvailable) {
        canBuy = false;
      }
    } else {
      // bong — can buy multiples if slots available
      if (!slotsAvailable) {
        canBuy = false;
      }
    }

    nameEl.textContent = label;
    row.appendChild(nameEl);

    if (!owned) {
      const buyBtn = makeButton('BUY', () => {
        dispatch({ type: 'BUY_FURNITURE', furnitureId: def.id });
      }, 'furniture-btn');
      if (!canBuy) buyBtn.disabled = true;
      row.appendChild(buyBtn);
    }

    screen.appendChild(row);
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

  // Local neighborhood locations (bodega, temples, university if any, scroll store, bookstore if any).
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

  const localBsId = getNeighborhoodBookstore(currentNeighborhood);
  if (localBsId) {
    const localBsData = getLocationData(localBsId);
    const localBsCost = getTravelCostRaw(state.currentLocation, localBsId);
    const localBsClock = previewClock(state.clock, localBsCost);
    screen.appendChild(makeButton(
      `${localBsData.displayName}  \u2192  ${formatClock(localBsClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: localBsId }),
      'nav-btn',
    ));
  }

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

  // Sprint 25: University Bar (University Heights only)
  const localBarId = getNeighborhoodBar(currentNeighborhood);
  if (localBarId && localBarId !== state.currentLocation) {
    const localBarData = getLocationData(localBarId);
    const localBarCost = getTravelCostRaw(state.currentLocation, localBarId);
    const localBarClock = previewClock(state.clock, localBarCost);
    screen.appendChild(makeButton(
      `${localBarData.displayName}  \u2192  ${formatClock(localBarClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: localBarId }),
      'nav-btn',
    ));
  }

  container.appendChild(screen);
}
