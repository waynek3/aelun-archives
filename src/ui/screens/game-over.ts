// Game Over screen — shown when the player can't pay rent (evicted).
// Displays final cash, days survived, best single win.
// A NEW GAME button resets the run.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { makeButton, makeHeader, makeDivider, makeResultLine } from '../components';
import { formatCash } from '../../util/format';
import { calcDaysSurvived } from '../../systems/rent';

type Dispatch = (action: GameAction) => void;

export function renderGameOver(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.innerHTML = '';

  const screen = document.createElement('div');
  screen.className = 'screen game-over-screen';

  screen.appendChild(makeHeader('GAME OVER'));
  screen.appendChild(makeDivider());

  const msg = document.createElement('p');
  msg.className = 'game-over-msg';
  msg.textContent = "Evicted. You couldn't make rent.";
  screen.appendChild(msg);

  screen.appendChild(makeDivider());

  const days = calcDaysSurvived(state.day, state.month, state.year);
  screen.appendChild(makeResultLine(`Days:    ${days}`));
  screen.appendChild(makeResultLine(`Cash:    ${formatCash(state.cash)}`));
  if (state.bestSingleWin > 0) {
    screen.appendChild(makeResultLine(`Best:    ${formatCash(state.bestSingleWin)}`));
  }

  screen.appendChild(makeDivider());

  screen.appendChild(makeButton('NEW GAME', () => dispatch({ type: 'NEW_GAME' }), 'nav-btn'));

  container.appendChild(screen);
}
