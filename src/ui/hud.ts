// Persistent HUD bar — always visible above the screen area.
// Sprint 2: shows Cash, Clock, and Calendar.
// Sprint 5: adds Chill bar. Sprint 6+: adds Mana bar.

import type { GameState } from '../state/types';
import { formatCash, progressBar } from '../util/format';
import { formatClock, formatDate } from '../engine/time';

export function renderHUD(state: GameState, el: HTMLElement): void {
  el.className = 'hud';

  // ── Row 1: Cash | Clock | Date ──
  const row1 = document.createElement('div');
  row1.className = 'hud-row';

  const cashEl = document.createElement('span');
  cashEl.className = 'hud-cash';
  cashEl.textContent = formatCash(state.cash);

  const clockEl = document.createElement('span');
  clockEl.className = 'hud-clock';
  clockEl.textContent = formatClock(state.clock);

  const dateEl = document.createElement('span');
  dateEl.className = 'hud-date';
  dateEl.textContent = formatDate(state.day, state.month, state.year);

  row1.appendChild(cashEl);
  row1.appendChild(clockEl);
  row1.appendChild(dateEl);

  // ── Row 2: Chill & Mana bars ──
  const row2 = document.createElement('div');
  row2.className = 'hud-bars';

  const chillEl = document.createElement('span');
  chillEl.className = 'hud-chill';
  chillEl.textContent = `CHILL ${progressBar(state.chill, 100, 20)}`;

  const manaEl = document.createElement('span');
  manaEl.className = 'hud-mana';
  manaEl.textContent = `MANA  ${progressBar(state.mana, state.maxMana, 20)}`;

  row2.appendChild(chillEl);
  row2.appendChild(manaEl);

  el.replaceChildren(row1, row2);
}
