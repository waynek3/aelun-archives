// Wizard Tower screen — home base. Player wakes here each morning.
// Actions: travel to any neighborhood's store, sleep (end the day).
// Sprint 13: furniture panel with bong USE / recycle buttons.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { makeButton, makeHeader, makeDivider, makeInventoryPanel, makeStatsPanel } from '../components';
import { formatClock, previewClock } from '../../engine/time';
import { getTravelCostRaw } from '../../systems/travel';
import {
  NEIGHBORHOODS,
  getNeighborhoodBodega,
  getNeighborhoodTemples,
  getNeighborhoodFurnitureStore,
  getLocationData,
} from '../../data/locations';
import { getBed } from '../../systems/furniture';
import balance from '../../data/balance.json';

type Dispatch = (action: GameAction) => void;

export function renderTower(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.innerHTML = '';

  const screen = document.createElement('div');
  screen.className = 'screen tower-screen';

  // ── Location name ──
  screen.appendChild(makeHeader('WIZARD\'S TOWER'));
  screen.appendChild(makeDivider());

  // ── Location flavor ──
  const flavor = document.createElement('p');
  flavor.className = 'tower-flavor';
  flavor.textContent = 'Your dingy tower. Home sweet home.';
  screen.appendChild(flavor);

  // ── Stats (Sprint 8) ──
  screen.appendChild(makeStatsPanel(state));

  // ── Inventory (Sprint 7) ──
  screen.appendChild(
    makeInventoryPanel(state.inventory, (slotIndex) => {
      dispatch({ type: 'CONSUME_SNACK', slotIndex });
    }),
  );

  // ── Furniture (Sprint 13) ──
  const furnitureMax = (balance.furniture as { maxSlots: number }).maxSlots;
  screen.appendChild(makeFurniturePanel(state, furnitureMax, dispatch));

  screen.appendChild(makeDivider());

  // ── Travel destinations ──
  // One section per neighborhood; each shows the neighborhood name and its bodega.
  screen.appendChild(makeHeader('TRAVEL'));

  for (const neighborhood of NEIGHBORHOODS) {
    // Neighborhood label
    const nbLabel = document.createElement('p');
    nbLabel.className = 'neighborhood-label';
    nbLabel.textContent = neighborhood.name.toUpperCase();
    screen.appendChild(nbLabel);

    const destId = getNeighborhoodBodega(neighborhood.id);
    const destData = getLocationData(destId);
    const travelCost = getTravelCostRaw('tower', destId);
    const arrivalClock = previewClock(state.clock, travelCost);

    const travelBtn = makeButton(
      `${destData.displayName}  \u2192  ${formatClock(arrivalClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: destId }),
      'nav-btn',
    );
    screen.appendChild(travelBtn);

    // Sprint 9: temples in this neighborhood
    const temples = getNeighborhoodTemples(neighborhood.id);
    for (const temple of temples) {
      const templeCost = getTravelCostRaw('tower', temple.id);
      const templeClock = previewClock(state.clock, templeCost);
      screen.appendChild(makeButton(
        `${temple.displayName}  \u2192  ${formatClock(templeClock)}`,
        () => dispatch({ type: 'TRAVEL', destination: temple.id }),
        'nav-btn',
      ));
    }

    // Sprint 13: furniture store in this neighborhood
    const furnitureStoreId = getNeighborhoodFurnitureStore(neighborhood.id);
    const furnitureStoreData = getLocationData(furnitureStoreId);
    const fsCost = getTravelCostRaw('tower', furnitureStoreId);
    const fsClock = previewClock(state.clock, fsCost);
    screen.appendChild(makeButton(
      `${furnitureStoreData.displayName}  \u2192  ${formatClock(fsClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: furnitureStoreId }),
      'nav-btn',
    ));
  }

  screen.appendChild(makeDivider());

  // ── Sleep ──
  const bed = getBed(state.furniture);
  if (!bed) {
    const warning = document.createElement('p');
    warning.className = 'inv-warning';
    warning.textContent = '! You need a bed to sleep !';
    screen.appendChild(warning);
  }
  const sleepBtn = makeButton(
    `SLEEP  (tomorrow: ${formatClock(600)})`,
    () => dispatch({ type: 'SLEEP' }),
    'nav-btn',
  );
  if (!bed) sleepBtn.disabled = true;
  screen.appendChild(sleepBtn);

  // ── Theme toggle ──
  screen.appendChild(makeDivider());
  const themeRow = document.createElement('div');
  themeRow.className = 'theme-row';
  const themes: Array<{ scheme: GameState['colorScheme']; label: string }> = [
    { scheme: 'blue', label: 'BLU' },
    { scheme: 'green', label: 'GRN' },
    { scheme: 'orange', label: 'AMB' },
  ];
  for (const { scheme, label } of themes) {
    const btn = makeButton(label, () => dispatch({ type: 'SET_THEME', scheme }), 'theme-btn');
    if (state.colorScheme === scheme) btn.classList.add('active');
    themeRow.appendChild(btn);
  }
  screen.appendChild(themeRow);

  container.appendChild(screen);
}

// ── Furniture Panel ──────────────────────────────────────────────────────────

function makeFurniturePanel(
  state: GameState,
  maxSlots: number,
  dispatch: Dispatch,
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'furniture-panel';

  panel.appendChild(makeHeader(`FURNITURE (${state.furniture.length}/${maxSlots})`));

  if (state.furniture.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'inv-empty';
    empty.textContent = '[ empty tower ]';
    panel.appendChild(empty);
    return panel;
  }

  for (let i = 0; i < state.furniture.length; i++) {
    const item = state.furniture[i];
    const row = document.createElement('div');
    row.className = 'furniture-row';

    const nameEl = document.createElement('span');
    nameEl.className = 'furniture-name';

    if (item.type === 'lab_table') {
      nameEl.textContent = `${item.name}  (Gathering dust...)`;
    } else {
      nameEl.textContent = item.name;
    }
    row.appendChild(nameEl);

    // Bong: USE button
    if (item.type === 'bong') {
      const useBtn = makeButton('[USE]', () => {
        dispatch({ type: 'USE_BONG', furnitureIndex: i });
      }, 'furniture-btn');
      row.appendChild(useBtn);
    }

    // All items: RECYCLE button
    const recycleBtn = makeButton('[RECYCLE]', () => {
      dispatch({ type: 'RECYCLE_FURNITURE', furnitureIndex: i });
    }, 'furniture-btn');
    row.appendChild(recycleBtn);

    panel.appendChild(row);
  }

  return panel;
}
