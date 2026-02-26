// Wizard Tower screen — home base. Player wakes here each morning.
// Actions: travel to bodega, sleep (end the day).

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { makeButton, makeHeader, makeDivider } from '../components';
import { formatClock, previewClock } from '../../engine/time';
import { getTravelCostRaw } from '../../systems/travel';

type Dispatch = (action: GameAction) => void;

export function renderTower(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.innerHTML = '';

  const screen = document.createElement('div');
  screen.className = 'screen tower-screen';

  // ── Location name ──
  screen.appendChild(makeHeader('WIZARD\'S TOWER'));
  screen.appendChild(makeDivider());

  // ── Location flavor ──
  const flavor = document.createElement('p');
  flavor.className = 'tower-flavor';
  flavor.textContent = 'Your dingy tower. Home sweet home.';
  screen.appendChild(flavor);

  screen.appendChild(makeDivider());

  // ── Travel to bodega ──
  const travelCost = getTravelCostRaw('tower', 'bodega');
  const arrivalClock = previewClock(state.clock, travelCost);
  const arrivalStr = formatClock(arrivalClock);

  const travelBtn = makeButton(
    `TRAVEL TO BODEGA  \u2192  ${arrivalStr}`,
    () => dispatch({ type: 'TRAVEL', destination: 'bodega' }),
    'nav-btn',
  );
  screen.appendChild(travelBtn);

  screen.appendChild(makeDivider());

  // ── Sleep ──
  const sleepBtn = makeButton(
    `SLEEP  (tomorrow: ${formatClock(600)})`,
    () => dispatch({ type: 'SLEEP' }),
    'nav-btn',
  );
  screen.appendChild(sleepBtn);

  // ── Theme toggle ──
  screen.appendChild(makeDivider());
  const themeRow = document.createElement('div');
  themeRow.className = 'theme-row';
  const themes: Array<{ scheme: GameState['colorScheme']; label: string }> = [
    { scheme: 'blue', label: 'BLU' },
    { scheme: 'green', label: 'GRN' },
    { scheme: 'orange', label: 'AMB' },
  ];
  for (const { scheme, label } of themes) {
    const btn = makeButton(label, () => dispatch({ type: 'SET_THEME', scheme }), 'theme-btn');
    if (state.colorScheme === scheme) btn.classList.add('active');
    themeRow.appendChild(btn);
  }
  screen.appendChild(themeRow);

  container.appendChild(screen);
}
