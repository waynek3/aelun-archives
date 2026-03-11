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
} from '../../data/locations';
import { FURNITURE_CATALOG } from '../../data/furniture';
import { getBed, hasFurnitureSlot } from '../../systems/furniture';
import balance from '../../data/balance.json';

type Dispatch = (action: GameAction) => void;

export function renderFurnitureStore(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.innerHTML = '';

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
  const furnitureMax = (balance.furniture as { maxSlots: number }).maxSlots;
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
    } else if (def.type === 'lab_table') {
      const hasOne = state.furniture.some(f => f.type === 'lab_table');
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
  }

  // Local neighborhood locations (bodega, temples, other furniture stores in same neighborhood).
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

  container.appendChild(screen);
}
