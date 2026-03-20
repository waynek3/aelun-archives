// Bodega screen: buy scratch-off tickets and snacks.
// Sprint 4: store name is dynamic per neighborhood; travel section lists all other destinations.
// Sprint 7: snack purchasing with inventory warnings + inventory panel with EAT.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { TICKET_TYPES } from '../../data/tickets';
import { SNACKS } from '../../data/food';
import { formatCash, calcScratchTimeCost } from '../../util/format';
import { makeButton, makeHeader, makeCashBar, makeQuantityRow, makeDivider, makeInventoryPanel } from '../components';
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

// Local mutable quantity state (not in GameState — just UI state before purchase).
const quantities: Record<string, number> = {};
const snackQtys: Record<string, number> = {};

// ─── Render ───────────────────────────────────────────────────────────────────

export function renderBodega(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.innerHTML = '';

  // Reset quantities on fresh render.
  for (const t of TICKET_TYPES) quantities[t.id] = 0;
  for (const s of SNACKS) snackQtys[s.id] = 0;

  const screen = document.createElement('div');
  screen.className = 'screen bodega-screen';

  // ── Store name (dynamic per neighborhood) ──
  const locData = getLocationData(state.currentLocation);
  screen.appendChild(makeHeader(locData.displayName));
  screen.appendChild(makeDivider());

  // ── Cash display ──
  const cashBar = makeCashBar('Cash:', formatCash(state.cash));
  cashBar.id = 'bodega-cash';
  screen.appendChild(cashBar);
  screen.appendChild(makeDivider());

  // ── Ticket list ──
  screen.appendChild(makeHeader('SCRATCH TICKETS'));

  for (const ticketType of TICKET_TYPES) {
    const { row, updateQty } = makeQuantityRow(
      ticketType.name,
      formatCash(ticketType.cost),
      0,
      {
        onDecrement: () => {
          if (quantities[ticketType.id] > 0) {
            quantities[ticketType.id]--;
            updateQty(quantities[ticketType.id]);
            refreshTotal();
          }
        },
        onIncrement: () => {
          const projected = projectedCost() + ticketType.cost;
          if (projected <= state.cash) {
            quantities[ticketType.id]++;
            updateQty(quantities[ticketType.id]);
            refreshTotal();
          }
        },
      },
    );
    screen.appendChild(row);
  }

  screen.appendChild(makeDivider());

  // ── Snack list (Sprint 7) ──
  screen.appendChild(makeHeader('SNACKS'));

  // Track snack +/- updaters so we can disable when full.
  const snackUpdaters: Array<{ updateQty: (n: number) => void }> = [];

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
            refreshTotal();
          }
        },
        onIncrement: () => {
          // Check cash limit.
          const projected = projectedCost() + snack.cost;
          if (projected > state.cash) return;
          // Check inventory space: free slots minus already-selected snacks.
          const totalSnackQty = totalSnackCount();
          if (totalSnackQty >= freeSlots(state.inventory)) return;
          snackQtys[snack.id]++;
          updateQty(snackQtys[snack.id]);
          refreshTotal();
        },
      },
    );
    snackUpdaters.push({ updateQty });
    screen.appendChild(row);
  }

  // Inventory warning (shown when bag is full).
  const invWarning = document.createElement('p');
  invWarning.className = 'inv-warning';
  invWarning.id = 'bodega-inv-warning';
  invWarning.style.display = 'none';
  screen.appendChild(invWarning);

  screen.appendChild(makeDivider());

  // ── Total row ──
  const totalEl = document.createElement('div');
  totalEl.className = 'total-row';
  const totalLabel = document.createElement('span');
  totalLabel.textContent = 'Total:';
  const totalValue = document.createElement('span');
  totalValue.id = 'bodega-total';
  totalValue.textContent = formatCash(0);
  totalEl.appendChild(totalLabel);
  totalEl.appendChild(totalValue);
  screen.appendChild(totalEl);

  // ── BUY button ──
  const buyBtn = makeButton('BUY', () => {
    const hasTickets = Object.values(quantities).some(q => q > 0);
    const hasSnacks = Object.values(snackQtys).some(q => q > 0);
    if (!hasTickets && !hasSnacks) return;

    // Build snack ID array from quantities.
    const snackIdList: string[] = [];
    for (const s of SNACKS) {
      for (let i = 0; i < (snackQtys[s.id] ?? 0); i++) {
        snackIdList.push(s.id);
      }
    }

    dispatch({
      type: 'BUY_TICKETS',
      quantities: { ...quantities },
      snacks: snackIdList.length > 0 ? snackIdList : undefined,
    });
  }, 'buy-btn');
  buyBtn.id = 'buy-btn';
  screen.appendChild(buyBtn);

  // ── Inventory panel (Sprint 7) ──
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
  const returnBtn = makeButton(
    `TOWER (HOME)  \u2192  ${formatClock(towerClock)}`,
    () => dispatch({ type: 'TRAVEL', destination: 'tower' }),
    'nav-btn',
  );
  screen.appendChild(returnBtn);

  // Other neighborhoods' bodegas, temples, and stores (skip the current neighborhood's bodega).
  const currentNeighborhood = getLocationNeighborhood(state.currentLocation);
  for (const neighborhood of NEIGHBORHOODS) {
    if (neighborhood.id === currentNeighborhood) continue;
    const destId = getNeighborhoodBodega(neighborhood.id);
    const destData = getLocationData(destId);
    const cost = getTravelCostRaw(state.currentLocation, destId);
    const arrival = previewClock(state.clock, cost);
    const btn = makeButton(
      `${neighborhood.name.toUpperCase()}: ${destData.displayName}  \u2192  ${formatClock(arrival)}`,
      () => dispatch({ type: 'TRAVEL', destination: destId }),
      'nav-btn',
    );
    screen.appendChild(btn);

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

  // Local neighborhood locations (temples, furniture store, university if any, scroll store, bookstore if any).
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

  container.appendChild(screen);

  // ── Helpers ──
  function projectedCost(): number {
    const ticketCost = TICKET_TYPES.reduce((sum, t) => sum + t.cost * (quantities[t.id] ?? 0), 0);
    const snackCost = SNACKS.reduce((sum, s) => sum + s.cost * (snackQtys[s.id] ?? 0), 0);
    return ticketCost + snackCost;
  }

  function totalTicketCount(): number {
    return TICKET_TYPES.reduce((sum, t) => sum + (quantities[t.id] ?? 0), 0);
  }

  function totalSnackCount(): number {
    return SNACKS.reduce((sum, s) => sum + (snackQtys[s.id] ?? 0), 0);
  }

  function refreshTotal(): void {
    const cost = projectedCost();
    const totalEl = document.getElementById('bodega-total');
    if (totalEl) totalEl.textContent = formatCash(cost);

    // Inventory warning.
    const free = freeSlots(state.inventory);
    const snackCount = totalSnackCount();
    const warn = document.getElementById('bodega-inv-warning');
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

    // BUY button.
    const buyBtnEl = document.getElementById('buy-btn') as HTMLButtonElement | null;
    if (buyBtnEl) {
      const nTickets = totalTicketCount();
      const hasAnything = nTickets > 0 || snackCount > 0;
      buyBtnEl.disabled = !hasAnything;
      if (nTickets > 0) {
        const finishClock = state.clock + calcScratchTimeCost(nTickets);
        buyBtnEl.textContent = `BUY  \u2014  done ${formatClock(finishClock)}`;
      } else if (hasAnything) {
        buyBtnEl.textContent = 'BUY SNACKS';
      } else {
        buyBtnEl.textContent = 'BUY';
      }
    }
  }
}

// Update just the cash display without a full re-render (Sprint 2+ use).
export function updateBodegaCash(state: GameState): void {
  const el = document.getElementById('bodega-cash');
  if (el) {
    const value = el.querySelector('.cash-value');
    if (value) value.textContent = formatCash(state.cash);
  }
}
