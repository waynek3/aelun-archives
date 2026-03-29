// Persistent HUD bar — always visible above the screen area.
// Sprint 2: shows Cash, Clock, and Calendar.
// Sprint 5: adds Chill bar. Sprint 6+: adds Mana bar.
// Redesign: theme toggle (BLU/GRN/AMB) moved here from tower screen.

import type { GameState } from '../state/types';
import type { GameAction } from '../engine/actions';
import { formatCash, progressBar } from '../util/format';
import { formatClock, formatDate } from '../engine/time';

type Dispatch = (action: GameAction) => void;

export function renderHUD(state: GameState, el: HTMLElement, dispatch: Dispatch): void {
  el.className = 'hud';

  // ── Row 1: Cash | Clock | Theme toggle ──
  const row1 = document.createElement('div');
  row1.className = 'hud-row';

  const cashEl = document.createElement('span');
  cashEl.className = 'hud-cash';
  cashEl.textContent = formatCash(state.cash);

  const clockEl = document.createElement('span');
  clockEl.className = 'hud-clock';
  clockEl.textContent = formatClock(state.clock);

  // Theme toggle (BLU / GRN / AMB) — small buttons, deliberately not using .btn
  // to avoid its 44px min-height bloating the HUD row.
  const themeGroup = document.createElement('div');
  themeGroup.className = 'hud-theme-group';

  const themes: Array<{ scheme: GameState['colorScheme']; label: string }> = [
    { scheme: 'blue',   label: 'BLU' },
    { scheme: 'green',  label: 'GRN' },
    { scheme: 'orange', label: 'AMB' },
  ];
  for (const { scheme, label } of themes) {
    const btn = document.createElement('button');
    btn.className = `hud-theme-btn${state.colorScheme === scheme ? ' active' : ''}`;
    btn.textContent = label;
    btn.addEventListener('click', () => dispatch({ type: 'SET_THEME', scheme }));
    themeGroup.appendChild(btn);
  }

  row1.appendChild(cashEl);
  row1.appendChild(clockEl);
  row1.appendChild(themeGroup);

  // ── Row 2: Date | Chill bar | Mana bar ──
  const row2 = document.createElement('div');
  row2.className = 'hud-bars';

  const dateEl = document.createElement('span');
  dateEl.className = 'hud-date';
  dateEl.textContent = formatDate(state.day, state.month, state.year);

  const chillEl = document.createElement('span');
  chillEl.className = 'hud-chill';
  chillEl.textContent = `CHILL ${progressBar(state.chill, 100, 16)}`;

  const manaEl = document.createElement('span');
  manaEl.className = 'hud-mana';
  manaEl.textContent = `MANA ${progressBar(state.mana, state.maxMana, 16)}`;

  row2.appendChild(dateEl);
  row2.appendChild(chillEl);
  row2.appendChild(manaEl);

  el.replaceChildren(row1, row2);
}
