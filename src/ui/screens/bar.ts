// University Bar screen: order drinks (immediate chill/mana effect) and buy snacks for inventory.
// Sprint 25: University Heights only.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { DRINKS } from '../../data/drinks';
import { SNACKS } from '../../data/food';
import { formatCash } from '../../util/format';
import {
  makeButton, makeHeader, makeCashBar, makeQuantityRow, makeDivider, makeInventoryPanel,
} from '../components';
import { formatClock, previewClock } from '../../engine/time';
import { getTravelCostRaw } from '../../systems/travel';
import { freeSlots } from '../../systems/inventory';
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

type Dispatch = (action: GameAction) => void;

// Local snack quantity state (UI-only, reset on each render).
const snackQtys: Record<string, number> = {};

// ─── Render ───────────────────────────────────────────────────────────────────

export function renderBar(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.innerHTML = '';

  // Reset snack quantities on fresh render.
  for (const s of SNACKS) snackQtys[s.id] = 0;

  const screen = document.createElement('div');
  screen.className = 'screen bar-screen';

  // ── Header ──
  const locData = getLocationData(state.currentLocation);
  screen.appendChild(makeHeader(locData.displayName));
  screen.appendChild(makeDivider());

  // ── Cash display ──
  const cashBar = makeCashBar('Cash:', formatCash(state.cash));
  cashBar.id = 'bar-cash';
  screen.appendChild(cashBar);
  screen.appendChild(makeDivider());

  // ── Drinks section ──
  screen.appendChild(makeHeader('DRINKS'));

  for (const drink of DRINKS) {
    const row = document.createElement('div');
    row.className = 'drink-row';

    const infoEl = document.createElement('p');
    infoEl.className = 'drink-info';
    const arrivalClock = previewClock(state.clock, drink.timeMinutes);
    infoEl.textContent = `${drink.name}  ${formatCash(drink.cost)}  \u2192  ${formatClock(arrivalClock)}`;
    row.appendChild(infoEl);

    const descEl = document.createElement('p');
    descEl.className = 'drink-desc';
    descEl.textContent = `chill up  |  mana down`;
    row.appendChild(descEl);

    const orderBtn = makeButton('[ORDER]', () => {
      const snackIdList: string[] = [];
      for (const s of SNACKS) {
        for (let i = 0; i < (snackQtys[s.id] ?? 0); i++) {
          snackIdList.push(s.id);
        }
      }
      dispatch({
        type: 'ORDER_DRINK',
        drinkId: drink.id,
        snacks: snackIdList.length > 0 ? snackIdList : undefined,
      });
    }, 'drink-btn');

    const totalWithDrink = drink.cost + projectedSnackCost();
    if (state.cash < totalWithDrink) orderBtn.disabled = true;

    row.appendChild(orderBtn);
    screen.appendChild(row);
  }

  screen.appendChild(makeDivider());

  // ── Food section ──
  screen.appendChild(makeHeader('FOOD'));

  for (const snack of SNACKS) {
    const { row, updateQty } = makeQuantityRow(
      snack.name,
      formatCash(snack.cost),
      0,
      {
        onDecrement: () => {
          if (snackQtys[snack.id] > 0) {
            snackQtys[snack.id]--;
            updateQty(snackQtys[snack.id]);
            refreshDrinkButtons();
          }
        },
        onIncrement: () => {
          const free = freeSlots(state.inventory);
          if (totalSnackCount() >= free) return;
          const snackCost = projectedSnackCost() + snack.cost;
          const cheapestDrink = Math.min(...DRINKS.map(d => d.cost));
          if (state.cash < cheapestDrink + snackCost) return;
          snackQtys[snack.id]++;
          updateQty(snackQtys[snack.id]);
          refreshDrinkButtons();
        },
      },
    );
    screen.appendChild(row);
  }

  // Inventory warning.
  const invWarning = document.createElement('p');
  invWarning.className = 'inv-warning';
  invWarning.id = 'bar-inv-warning';
  invWarning.style.display = 'none';
  screen.appendChild(invWarning);

  screen.appendChild(makeDivider());

  // ── Inventory panel ──
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

  // Tower always first.
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

  // Local neighborhood (University Heights — show everything except the bar itself).
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
  // (Self — the bar — is omitted from travel section.)

  container.appendChild(screen);

  // ── Helpers ──
  function projectedSnackCost(): number {
    return SNACKS.reduce((sum, s) => sum + s.cost * (snackQtys[s.id] ?? 0), 0);
  }

  function totalSnackCount(): number {
    return SNACKS.reduce((sum, s) => sum + (snackQtys[s.id] ?? 0), 0);
  }

  function refreshDrinkButtons(): void {
    // Update ORDER button disabled states based on current snack selection + cash.
    const snackCount = totalSnackCount();
    const snackCost = projectedSnackCost();

    // Inventory warning.
    const warn = document.getElementById('bar-inv-warning');
    const free = freeSlots(state.inventory);
    if (warn) {
      if (snackCount >= free && free > 0) {
        warn.textContent = `! BAG FULL (${free}/${state.inventory.length} free) !`;
        warn.style.display = '';
      } else if (free === 0) {
        warn.textContent = `! BAG FULL (0/${state.inventory.length} free) !`;
        warn.style.display = '';
      } else {
        warn.style.display = 'none';
      }
    }

    // Re-evaluate each ORDER button.
    const drinkBtns = screen.querySelectorAll<HTMLButtonElement>('button.btn.drink-btn');
    DRINKS.forEach((drink, i) => {
      const btn = drinkBtns[i];
      if (btn) {
        btn.disabled = state.cash < drink.cost + snackCost;
      }
    });
  }
}
