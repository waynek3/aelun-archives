// Persistent HUD bar — always visible above the screen area.
// Sprint 2: shows Cash, Clock, and Calendar.
// Sprint 5: adds Chill bar. Sprint 6+: adds Mana bar.

import type { GameState } from '../state/types';
import { formatCash, progressBar } from '../util/format';
import { formatClock, formatDate } from '../engine/time';

export function renderHUD(state: GameState, el: HTMLElement): void {
  el.className = 'hud';

  const cashEl = document.createElement('span');
  cashEl.className = 'hud-cash';
  cashEl.textContent = formatCash(state.cash);

  const clockEl = document.createElement('span');
  clockEl.className = 'hud-clock';
  clockEl.textContent = formatClock(state.clock);

  const dateEl = document.createElement('span');
  dateEl.className = 'hud-date';
  dateEl.textContent = formatDate(state.day, state.month, state.year);

  // Sprint 5: chill % bar — no numeric value shown per UI rules.
  const chillEl = document.createElement('span');
  chillEl.className = 'hud-chill';
  chillEl.textContent = `CHILL ${progressBar(state.chill, 100, 10)}`;

  el.innerHTML = '';
  el.appendChild(cashEl);
  el.appendChild(clockEl);
  el.appendChild(dateEl);
  el.appendChild(chillEl);
}
