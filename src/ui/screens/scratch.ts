// Scratch screen: reveals tickets one at a time.
// Cells are updated in-place on SCRATCH_CELL actions (no full re-render per tap).

import type { GameState, GeneratedTicket } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { getSymbol } from '../../data/symbols';
import { getTicketType } from '../../data/tickets';
import { formatCash, formatNet } from '../../util/format';
import { makeButton, makeHeader, makePanel, makeDivider, makeResultLine } from '../components';

type Dispatch = (action: GameAction) => void;

// Degradation sequence: covered → revealed.
const CELL_CHARS = ['█', '▓', '▒', '░'];

// ─── Full Render ──────────────────────────────────────────────────────────────

export function renderScratch(
  state: GameState,
  container: HTMLElement,
  dispatch: Dispatch,
): void {
  container.innerHTML = '';
  if (!state.scratchSession) return;

  const session = state.scratchSession;
  const isDone = session.currentTicketIndex >= session.tickets.length;

  if (isDone) {
    renderSummary(state, container, dispatch);
    return;
  }

  const ticket = session.tickets[session.currentTicketIndex];
  const ticketNum = session.currentTicketIndex + 1;
  const ticketTotal = session.tickets.length;

  const screen = document.createElement('div');
  screen.className = 'screen scratch-screen';
  screen.id = 'scratch-screen';

  // ── Ticket header panel ──
  const ticketPanel = makePanel();

  const headerRow = document.createElement('div');
  headerRow.className = 'ticket-header-row';

  const titleEl = document.createElement('span');
  titleEl.className = 'ticket-title';
  titleEl.textContent = `$${ticket.cost} ${ticket.typeName.toUpperCase()}`;

  const badgeEl = document.createElement('span');
  badgeEl.className = 'ticket-type-badge';
  badgeEl.textContent = 'SCRATCH-OFF';

  headerRow.appendChild(titleEl);
  headerRow.appendChild(badgeEl);
  ticketPanel.appendChild(headerRow);

  if (ticketTotal > 1) {
    const counterEl = document.createElement('div');
    counterEl.className = 'ticket-counter';
    counterEl.textContent = `${ticketNum} / ${ticketTotal}`;
    ticketPanel.appendChild(counterEl);
  }

  screen.appendChild(ticketPanel);

  // ── Wallet panel ──
  const walletPanel = makePanel('WALLET');
  walletPanel.id = 'wallet-panel';
  const walletAmount = document.createElement('div');
  walletAmount.className = 'wallet-amount';
  walletAmount.id = 'wallet-amount';
  walletAmount.textContent = formatCash(state.cash);
  walletPanel.appendChild(walletAmount);
  screen.appendChild(walletPanel);

  // ── Scratch area panel ──
  const scratchPanel = makePanel();

  const instruction = document.createElement('div');
  instruction.className = 'scratch-instruction';
  instruction.textContent = '▼ CLICK CELLS TO SCRATCH ▼';
  scratchPanel.appendChild(instruction);

  scratchPanel.appendChild(buildGrid(ticket, dispatch));

  // Result area (populated after reveal)
  const resultArea = document.createElement('div');
  resultArea.id = 'ticket-result';
  resultArea.className = 'ticket-result';
  if (ticket.revealed) {
    populateResult(resultArea, ticket);
  }
  scratchPanel.appendChild(resultArea);
  screen.appendChild(scratchPanel);

  // ── Info panel ──
  const infoPanel = makePanel();
  const infoText = document.createElement('p');
  infoText.className = 'info-text';
  infoText.textContent = 'Match 3 or more identical symbols to win. Higher matches pay more.';
  infoPanel.appendChild(infoText);
  screen.appendChild(infoPanel);

  // ── Scratch all button ──
  const scratchAllBtn = makeButton('[ SCRATCH ALL ]', () => {
    if (!state.scratchSession) return;
    const t = state.scratchSession.tickets[state.scratchSession.currentTicketIndex];
    if (!t || t.revealed) return;
    t.cells.forEach((cell, idx) => {
      const steps = 4 - cell.state;
      for (let i = 0; i < steps; i++) {
        dispatch({ type: 'SCRATCH_CELL', cellIndex: idx });
      }
    });
  }, 'scratch-all-btn');
  scratchAllBtn.id = 'scratch-all-btn';
  scratchAllBtn.style.display = ticket.revealed ? 'none' : '';
  screen.appendChild(scratchAllBtn);

  // ── Nav button ──
  const navBtn = makeButton(
    ticketNum < ticketTotal ? 'NEXT TICKET' : 'FINISH',
    () => dispatch({ type: 'ADVANCE_TICKET' }),
    'nav-btn',
  );
  navBtn.id = 'scratch-nav-btn';
  navBtn.style.display = ticket.revealed ? '' : 'none';
  screen.appendChild(navBtn);

  container.appendChild(screen);
}

// ─── In-place Cell Update ─────────────────────────────────────────────────────

// Called on SCRATCH_CELL — updates only the affected cell, then checks if
// the ticket is fully revealed (if so, shows result and nav button).
export function updateScratchCell(
  state: GameState,
  cellIndex: number,
): void {
  if (!state.scratchSession) return;

  const session = state.scratchSession;
  const ticket = session.tickets[session.currentTicketIndex];
  if (!ticket) return;

  const cell = ticket.cells[cellIndex];
  if (!cell) return;

  // Update wallet display.
  const walletAmountEl = document.getElementById('wallet-amount');
  if (walletAmountEl) walletAmountEl.textContent = formatCash(state.cash);

  const cellEl = document.querySelector<HTMLElement>(
    `[data-cell-index="${cellIndex}"]`,
  );
  if (!cellEl) return;

  if (cell.state < 4) {
    // Show the degradation char for the current state (0=█ 1=▓ 2=▒ 3=░).
    cellEl.textContent = CELL_CHARS[cell.state] ?? CELL_CHARS[0];
    cellEl.className = cell.state > 0 ? 'scratch-cell scratching' : 'scratch-cell';
  } else {
    // Fully revealed — show symbol glyph.
    const sym = getSymbol(cell.symbolId);
    cellEl.textContent = sym.glyph;
    cellEl.style.color = sym.color;
    cellEl.className = 'scratch-cell revealed';
    cellEl.setAttribute('aria-label', sym.name);
    // Remove click handler by replacing with a clone.
    const clone = cellEl.cloneNode(true) as HTMLElement;
    cellEl.parentNode?.replaceChild(clone, cellEl);
  }

  // If the ticket is now fully revealed, show result + nav button, hide scratch-all.
  if (ticket.revealed) {
    const resultArea = document.getElementById('ticket-result');
    if (resultArea) populateResult(resultArea, ticket);

    const navBtn = document.getElementById('scratch-nav-btn') as HTMLElement | null;
    if (navBtn) navBtn.style.display = '';

    const scratchAllBtn = document.getElementById('scratch-all-btn') as HTMLElement | null;
    if (scratchAllBtn) scratchAllBtn.style.display = 'none';
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildGrid(ticket: GeneratedTicket, dispatch: Dispatch): HTMLElement {
  const container = document.createElement('div');
  container.className = 'scratch-grid-container';

  const ticketType = getTicketType(ticket.typeId);

  for (let r = 0; r < ticket.rows; r++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'scratch-row';

    const cellsEl = document.createElement('div');
    cellsEl.className = 'scratch-cells';

    for (let c = 0; c < ticket.cols; c++) {
      const idx = r * ticket.cols + c;
      const cell = ticket.cells[idx];

      const btn = document.createElement('button');
      btn.className = 'scratch-cell';
      btn.dataset.cellIndex = String(idx);

      if (cell.state < 4) {
        btn.textContent = CELL_CHARS[cell.state];
        if (cell.state > 0) btn.classList.add('scratching');
      } else {
        const sym = getSymbol(cell.symbolId);
        btn.textContent = sym.glyph;
        btn.style.color = sym.color;
        btn.classList.add('revealed');
        btn.setAttribute('aria-label', sym.name);
      }

      if (cell.state < 4) {
        btn.addEventListener('click', () =>
          dispatch({ type: 'SCRATCH_CELL', cellIndex: idx }),
        );
      }

      cellsEl.appendChild(btn);
    }

    rowEl.appendChild(cellsEl);

    // Prize for this row: payoutTable[0] = 3 matches, [1] = 4 matches, etc.
    const prizeEl = document.createElement('span');
    prizeEl.className = 'row-prize';
    const prizeValue = ticketType.payoutTable[r] ?? ticketType.payoutTable[ticketType.payoutTable.length - 1];
    prizeEl.textContent = `$${prizeValue}`;
    rowEl.appendChild(prizeEl);

    container.appendChild(rowEl);
  }

  return container;
}

function populateResult(el: HTMLElement, ticket: GeneratedTicket): void {
  el.innerHTML = '';
  el.appendChild(makeDivider());

  if (ticket.isWin) {
    const sym = getSymbol(ticket.winningSymbolId!);
    const matchLine = makeResultLine(
      `${ticket.matchCount}× ${sym.glyph} ${sym.name}`,
      'win-line',
    );
    el.appendChild(matchLine);
    const payoutLine = makeResultLine(formatNet(ticket.basePayout), 'payout-win');
    el.appendChild(payoutLine);
  } else {
    el.appendChild(makeResultLine('No match.', 'loss-line'));
    el.appendChild(makeResultLine(formatNet(0), 'payout-loss'));
  }
}

// ─── Summary Screen ───────────────────────────────────────────────────────────

function renderSummary(
  state: GameState,
  container: HTMLElement,
  dispatch: Dispatch,
): void {
  const session = state.scratchSession!;
  const screen = document.createElement('div');
  screen.className = 'screen scratch-screen summary-screen';

  screen.appendChild(makeHeader('SCRATCH COMPLETE'));
  screen.appendChild(makeDivider());

  const spent = makeResultLine(`Spent:  ${formatCash(session.totalCost)}`);
  const won   = makeResultLine(`Won:    ${formatCash(session.totalPayout)}`);
  const net   = session.totalPayout - session.totalCost;
  const netEl = makeResultLine(`Net:    ${formatNet(net)}`, net >= 0 ? 'payout-win' : 'payout-loss');

  screen.appendChild(spent);
  screen.appendChild(won);
  screen.appendChild(netEl);

  screen.appendChild(makeDivider());

  const cashLine = makeResultLine(`Cash:   ${formatCash(state.cash)}`);
  screen.appendChild(cashLine);

  screen.appendChild(makeDivider());

  const backBtn = makeButton('BACK TO STORE', () => dispatch({ type: 'FINISH_SESSION' }), 'nav-btn');
  screen.appendChild(backBtn);

  container.appendChild(screen);
}
