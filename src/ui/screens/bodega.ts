// Bodega screen: buy scratch-off tickets.
// The player adjusts quantities of each ticket tier and presses BUY.
// Sprint 4: store name is dynamic per neighborhood; travel section lists all other destinations.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { TICKET_TYPES } from '../../data/tickets';
import { formatCash, calcScratchTimeCost } from '../../util/format';
import { makeButton, makeHeader, makeCashBar, makeQuantityRow, makeDivider } from '../components';
import { formatClock, previewClock } from '../../engine/time';
import { getTravelCostRaw } from '../../systems/travel';
import {
  getLocationData,
  getLocationNeighborhood,
  NEIGHBORHOODS,
  getNeighborhoodBodega,
} from '../../data/locations';

type Dispatch = (action: GameAction) => void;

// Local mutable quantity state (not in GameState — just UI state before purchase).
const quantities: Record<string, number> = {};

// ─── Render ───────────────────────────────────────────────────────────────────

export function renderBodega(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.innerHTML = '';

  // Reset quantities on fresh render.
  for (const t of TICKET_TYPES) quantities[t.id] = 0;

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
          // Check if adding one more would exceed cash.
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
    if (!hasTickets) return;
    dispatch({ type: 'BUY_TICKETS', quantities: { ...quantities } });
  }, 'buy-btn');
  buyBtn.id = 'buy-btn';
  screen.appendChild(buyBtn);

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

  // Other neighborhoods' bodegas (skip the current neighborhood).
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
  }

  container.appendChild(screen);

  // ── Helpers ──
  function projectedCost(): number {
    return TICKET_TYPES.reduce((sum, t) => sum + t.cost * (quantities[t.id] ?? 0), 0);
  }

  function totalTicketCount(): number {
    return TICKET_TYPES.reduce((sum, t) => sum + (quantities[t.id] ?? 0), 0);
  }

  function refreshTotal(): void {
    const cost = projectedCost();
    const totalEl = document.getElementById('bodega-total');
    if (totalEl) totalEl.textContent = formatCash(cost);

    const buyBtnEl = document.getElementById('buy-btn') as HTMLButtonElement | null;
    if (buyBtnEl) {
      const n = totalTicketCount();
      const hasTickets = n > 0;
      buyBtnEl.disabled = !hasTickets;
      if (hasTickets) {
        const finishClock = state.clock + calcScratchTimeCost(n);
        buyBtnEl.textContent = `BUY  \u2014  done ${formatClock(finishClock)}`;
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
