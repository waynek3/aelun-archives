// Furniture Store screen: buy furniture for the wizard tower.
// Sprint 13: Beds (swap upgrade), Lab Table, Bong.
// Redesign: INVENTORY and TRAVEL moved to modal popups.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { formatCash } from '../../util/format';
import {
  makeButton, makeHeader, makeDivider, makeInventoryPanel, makeModal, makeTravelPanel,
} from '../components';
import { getLocationData } from '../../data/locations';
import { FURNITURE_CATALOG } from '../../data/furniture';
import { getBed, hasFurnitureSlot } from '../../systems/furniture';
import { bal } from '../../data/balance-types';
import { getModal, openModal, closeModal } from '../modal';

type Dispatch = (action: GameAction) => void;

const SCREEN = 'furniture_store';

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

  // ── Section buttons ──
  screen.appendChild(makeDivider());

  const invCount = state.inventory.filter(i => i !== null).length;
  screen.appendChild(makeButton(
    `INVENTORY (${invCount}/${state.inventory.length})`,
    () => openModal(SCREEN, 'inventory', () => renderFurnitureStore(state, container, dispatch)),
    'section-btn',
  ));

  screen.appendChild(makeButton(
    'TRAVEL',
    () => openModal(SCREEN, 'travel', () => renderFurnitureStore(state, container, dispatch)),
    'section-btn',
  ));

  container.appendChild(screen);

  // ── Active modal ──
  const activeModal = getModal(SCREEN);
  if (activeModal !== null) {
    const onClose = () => closeModal(SCREEN, () => renderFurnitureStore(state, container, dispatch));
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
