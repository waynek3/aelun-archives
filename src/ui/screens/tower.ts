// Wizard Tower screen — home base. Player wakes here each morning.
// Actions: travel to any neighborhood's store, sleep (end the day).

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { makeButton, makeHeader, makeDivider, makeInventoryPanel } from '../components';
import { formatClock, previewClock } from '../../engine/time';
import { getTravelCostRaw } from '../../systems/travel';
import { NEIGHBORHOODS, getNeighborhoodBodega, getLocationData } from '../../data/locations';

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

  // ── Inventory (Sprint 7) ──
  screen.appendChild(
    makeInventoryPanel(state.inventory, (slotIndex) => {
      dispatch({ type: 'CONSUME_SNACK', slotIndex });
    }),
  );

  screen.appendChild(makeDivider());

  // ── Travel destinations ──
  // One section per neighborhood; each shows the neighborhood name and its bodega.
  screen.appendChild(makeHeader('TRAVEL'));

  for (const neighborhood of NEIGHBORHOODS) {
    // Neighborhood label
    const nbLabel = document.createElement('p');
    nbLabel.className = 'neighborhood-label';
    nbLabel.textContent = neighborhood.name.toUpperCase();
    screen.appendChild(nbLabel);

    const destId = getNeighborhoodBodega(neighborhood.id);
    const destData = getLocationData(destId);
    const travelCost = getTravelCostRaw('tower', destId);
    const arrivalClock = previewClock(state.clock, travelCost);

    const travelBtn = makeButton(
      `${destData.displayName}  \u2192  ${formatClock(arrivalClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: destId }),
      'nav-btn',
    );
    screen.appendChild(travelBtn);
  }

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
