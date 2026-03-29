// Bodega screen: buy scratch-off tickets and snacks.
// Sprint 4: store name is dynamic per neighborhood; travel section lists all other destinations.
// Sprint 7: snack purchasing with inventory warnings + inventory panel with EAT.
// Redesign: INVENTORY and TRAVEL moved to modal popups.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { TICKET_TYPES } from '../../data/tickets';
import { SNACKS } from '../../data/food';
import { formatCash, calcScratchTimeCost } from '../../util/format';
import {
  makeButton, makeHeader, makeCashBar, makeQuantityRow, makeDivider,
  makeInventoryPanel, makeModal, makeTravelPanel,
} from '../components';
import { formatClock } from '../../engine/time';
import { freeSlots } from '../../systems/inventory';
import { getLocationData } from '../../data/locations';
import { getModal, openModal, closeModal } from '../modal';

type Dispatch = (action: GameAction) => void;

const SCREEN = 'bodega';

// Local mutable quantity state (not in GameState — just UI state before purchase).
const quantities: Record<string, number> = {};
const snackQtys: Record<string, number> = {};

// ─── Render ───────────────────────────────────────────────────────────────────

export function renderBodega(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.replaceChildren();

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

  // ── Section buttons ──
  const invCount = state.inventory.filter(i => i !== null).length;
  screen.appendChild(makeButton(
    `INVENTORY (${invCount}/${state.inventory.length})`,
    () => openModal(SCREEN, 'inventory', () => renderBodega(state, container, dispatch)),
    'section-btn',
  ));

  screen.appendChild(makeButton(
    'TRAVEL',
    () => openModal(SCREEN, 'travel', () => renderBodega(state, container, dispatch)),
    'section-btn',
  ));

  container.appendChild(screen);

  // ── Active modal ──
  const activeModal = getModal(SCREEN);
  if (activeModal !== null) {
    const onClose = () => closeModal(SCREEN, () => renderBodega(state, container, dispatch));
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
