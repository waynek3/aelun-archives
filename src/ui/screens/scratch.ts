// Scratch screen: reveals tickets one at a time.
// Cells are updated in-place on SCRATCH_CELL actions (no full re-render per tap).

import type { GameState, GeneratedTicket } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { getSymbol } from '../../data/symbols';
import { formatCash, formatNet, progressBar } from '../../util/format';
import { makeButton, makeHeader, makeDivider, makeResultLine } from '../components';

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
  const screen = document.createElement('div');
  screen.className = 'screen scratch-screen';
  screen.id = 'scratch-screen';

  // ── Header ──
  const ticketNum = session.currentTicketIndex + 1;
  const ticketTotal = session.tickets.length;
  screen.appendChild(makeHeader(
    `Ticket ${ticketNum} of ${ticketTotal}: ${ticket.typeName} (${formatCash(ticket.cost)})`,
  ));
  screen.appendChild(makeDivider());

  // ── Session progress bar ──
  const barEl = makeResultLine(progressBar(session.currentTicketIndex, ticketTotal, 28));
  barEl.className = 'session-progress';
  screen.appendChild(barEl);

  // ── Scratch grid ──
  const grid = buildGrid(ticket, dispatch);
  screen.appendChild(grid);

  // ── Result area (hidden until revealed) ──
  const resultArea = document.createElement('div');
  resultArea.id = 'ticket-result';
  resultArea.className = 'ticket-result';
  if (ticket.revealed) {
    populateResult(resultArea, ticket);
  }
  screen.appendChild(resultArea);

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

  // If the ticket is now fully revealed, show result + nav button.
  if (ticket.revealed) {
    const resultArea = document.getElementById('ticket-result');
    if (resultArea) populateResult(resultArea, ticket);

    const navBtn = document.getElementById('scratch-nav-btn') as HTMLElement | null;
    if (navBtn) navBtn.style.display = '';
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildGrid(ticket: GeneratedTicket, dispatch: Dispatch): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'ticket-grid';
  grid.style.gridTemplateColumns = `repeat(${ticket.cols}, 1fr)`;

  ticket.cells.forEach((cell, idx) => {
    const btn = document.createElement('button');
    btn.className = 'scratch-cell';
    btn.dataset.cellIndex = String(idx);

    if (cell.state < 4) {
      // state 0=█ 1=▓ 2=▒ 3=░
      btn.textContent = CELL_CHARS[cell.state];
      if (cell.state > 0) btn.className += ' scratching';
    } else {
      const sym = getSymbol(cell.symbolId);
      btn.textContent = sym.glyph;
      btn.style.color = sym.color;
      btn.className += ' revealed';
      btn.setAttribute('aria-label', sym.name);
    }

    if (cell.state < 4) {
      btn.addEventListener('click', () =>
        dispatch({ type: 'SCRATCH_CELL', cellIndex: idx }),
      );
    }

    grid.appendChild(btn);
  });

  return grid;
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
