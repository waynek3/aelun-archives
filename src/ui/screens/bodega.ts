// Bodega screen: buy scratch-off tickets and snacks.
// Sprint 4: store name is dynamic per neighborhood; travel section lists all other destinations.
// Sprint 7: snack purchasing with inventory warnings + inventory panel with EAT.
// Redesign: INVENTORY and TRAVEL moved to modal popups.
// Refactor: SCRATCH TICKETS and SNACKS each open their own modal.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { TICKET_TYPES } from '../../data/tickets';
import { SNACKS } from '../../data/food';
import { formatCash, calcScratchTimeCost } from '../../util/format';
import {
  makeButton, makeHeader, makeCashBar, makeQuantityRow, makeDivider,
  makeInventoryPanel, makeModal, makeTravelPanel, makeGodSelectPanel,
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

// ─── Helpers (module-level so modal builders can share them) ──────────────────

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

  // ── Section buttons ──
  screen.appendChild(makeButton(
    'SCRATCH TICKETS',
    () => openModal(SCREEN, 'tickets', () => renderBodega(state, container, dispatch)),
    'section-btn',
  ));

  screen.appendChild(makeButton(
    'SNACKS',
    () => openModal(SCREEN, 'snacks', () => renderBodega(state, container, dispatch)),
    'section-btn',
  ));

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
    const rerender = () => renderBodega(state, container, dispatch);
    const onClose = () => closeModal(SCREEN, rerender);

    if (activeModal === 'tickets') {
      container.appendChild(makeModal({
        title: 'SCRATCH TICKETS',
        body: makeTicketsPanel(state, dispatch),
        onClose,
      }));
    } else if (activeModal === 'snacks') {
      container.appendChild(makeModal({
        title: 'SNACKS',
        body: makeSnacksPanel(state, dispatch),
        onClose,
      }));
    } else if (activeModal === 'inventory') {
      container.appendChild(makeModal({
        title: 'INVENTORY',
        body: makeInventoryPanel(
          state.inventory,
          (slotIndex) => dispatch({ type: 'CONSUME_SNACK', slotIndex }),
          (slotIndex, godId) => dispatch({ type: 'USE_SCROLL', slotIndex, godId }),
          (slotIndex) => openModal(SCREEN, `god_select:${slotIndex}`, rerender),
        ),
        onClose,
      }));
    } else if (activeModal.startsWith('god_select:')) {
      const slotIndex = parseInt(activeModal.slice(11), 10);
      container.appendChild(makeModal({
        title: 'SELECT GOD',
        body: makeGodSelectPanel((godId) => dispatch({ type: 'USE_SCROLL', slotIndex, godId })),
        onClose,
        onBack: () => openModal(SCREEN, 'inventory', rerender),
      }));
    } else if (activeModal === 'travel' || activeModal.startsWith('travel:')) {
      const isLevel2 = activeModal.startsWith('travel:');
      const nbName = isLevel2 ? activeModal.slice(7).replace(/_/g, ' ').toUpperCase() : 'TRAVEL';
      container.appendChild(makeModal({
        title: nbName,
        body: makeTravelPanel(state, dispatch, SCREEN, activeModal, rerender),
        onClose,
        onBack: isLevel2 ? () => openModal(SCREEN, 'travel', rerender) : undefined,
      }));
    }
  }
}

// ── Tickets panel (modal body) ────────────────────────────────────────────────

function makeTicketsPanel(state: GameState, dispatch: Dispatch): HTMLElement {
  const panel = document.createElement('div');

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
            refreshTicketsUI(state);
          }
        },
        onIncrement: () => {
          const projected = projectedCost() + ticketType.cost;
          if (projected <= state.cash) {
            quantities[ticketType.id]++;
            updateQty(quantities[ticketType.id]);
            refreshTicketsUI(state);
          }
        },
      },
    );
    panel.appendChild(row);
  }

  panel.appendChild(makeDivider());

  const totalEl = document.createElement('div');
  totalEl.className = 'total-row';
  const totalLabel = document.createElement('span');
  totalLabel.textContent = 'Total:';
  const totalValue = document.createElement('span');
  totalValue.id = 'bodega-total';
  totalValue.textContent = formatCash(0);
  totalEl.appendChild(totalLabel);
  totalEl.appendChild(totalValue);
  panel.appendChild(totalEl);

  const buyBtn = makeButton('BUY', () => {
    if (!Object.values(quantities).some(q => q > 0)) return;
    dispatch({ type: 'BUY_TICKETS', quantities: { ...quantities }, snacks: undefined });
  }, 'buy-btn');
  buyBtn.id = 'buy-btn';
  buyBtn.disabled = true;
  panel.appendChild(buyBtn);

  return panel;
}

function refreshTicketsUI(state: GameState): void {
  const totalEl = document.getElementById('bodega-total');
  if (totalEl) totalEl.textContent = formatCash(projectedCost());

  const buyBtnEl = document.getElementById('buy-btn') as HTMLButtonElement | null;
  if (buyBtnEl) {
    const nTickets = totalTicketCount();
    buyBtnEl.disabled = nTickets === 0;
    if (nTickets > 0) {
      const finishClock = state.clock + calcScratchTimeCost(nTickets);
      buyBtnEl.textContent = `BUY  \u2014  done ${formatClock(finishClock)}`;
    } else {
      buyBtnEl.textContent = 'BUY';
    }
  }
}

// ── Snacks panel (modal body) ─────────────────────────────────────────────────

function makeSnacksPanel(state: GameState, dispatch: Dispatch): HTMLElement {
  const panel = document.createElement('div');

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
            refreshSnacksUI(state);
          }
        },
        onIncrement: () => {
          const projected = projectedCost() + snack.cost;
          if (projected > state.cash) return;
          const totalSnackQty = totalSnackCount();
          if (totalSnackQty >= freeSlots(state.inventory)) return;
          snackQtys[snack.id]++;
          updateQty(snackQtys[snack.id]);
          refreshSnacksUI(state);
        },
      },
    );
    panel.appendChild(row);
  }

  const invWarning = document.createElement('p');
  invWarning.className = 'inv-warning';
  invWarning.id = 'bodega-inv-warning';
  invWarning.style.display = 'none';
  panel.appendChild(invWarning);

  panel.appendChild(makeDivider());

  const totalEl = document.createElement('div');
  totalEl.className = 'total-row';
  const totalLabel = document.createElement('span');
  totalLabel.textContent = 'Total:';
  const totalValue = document.createElement('span');
  totalValue.id = 'bodega-snack-total';
  totalValue.textContent = formatCash(0);
  totalEl.appendChild(totalLabel);
  totalEl.appendChild(totalValue);
  panel.appendChild(totalEl);

  const buyBtn = makeButton('BUY SNACKS', () => {
    const snackIdList: string[] = [];
    for (const s of SNACKS) {
      for (let i = 0; i < (snackQtys[s.id] ?? 0); i++) snackIdList.push(s.id);
    }
    if (snackIdList.length === 0) return;
    dispatch({ type: 'BUY_TICKETS', quantities: {}, snacks: snackIdList });
  }, 'buy-snacks-btn');
  buyBtn.id = 'buy-snacks-btn';
  buyBtn.disabled = true;
  panel.appendChild(buyBtn);

  return panel;
}

function refreshSnacksUI(state: GameState): void {
  const totalEl = document.getElementById('bodega-snack-total');
  if (totalEl) totalEl.textContent = formatCash(projectedCost());

  const free = freeSlots(state.inventory);
  const snackCount = totalSnackCount();
  const warn = document.getElementById('bodega-inv-warning');
  if (warn) {
    if (free === 0 || snackCount >= free) {
      warn.textContent = `! BAG FULL (${free}/${state.inventory.length} free) !`;
      warn.style.display = '';
    } else {
      warn.style.display = 'none';
    }
  }

  const buyBtnEl = document.getElementById('buy-snacks-btn') as HTMLButtonElement | null;
  if (buyBtnEl) {
    buyBtnEl.disabled = snackCount === 0;
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
