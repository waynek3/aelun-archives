// Passout screen — shown when the player misses curfew.
// Displays the cash penalty and lets the player wake up the next morning.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { makeButton, makeHeader, makeDivider, makeResultLine } from '../components';
import { formatCash, formatNet, progressBar } from '../../util/format';
import { formatClock } from '../../engine/time';

type Dispatch = (action: GameAction) => void;

export function renderPassout(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.innerHTML = '';

  const screen = document.createElement('div');
  screen.className = 'screen passout-screen';

  screen.appendChild(makeHeader('PASSED OUT'));
  screen.appendChild(makeDivider());

  const msg1 = document.createElement('p');
  msg1.className = 'passout-msg';
  msg1.textContent = 'You missed curfew and passed out in The Skids.';
  screen.appendChild(msg1);

  const msg2 = document.createElement('p');
  msg2.className = 'passout-msg';
  msg2.textContent = 'You wake up the next morning.';
  screen.appendChild(msg2);

  screen.appendChild(makeDivider());

  const penalty = state.lastPassoutPenalty ?? 0;
  screen.appendChild(makeResultLine(`Fine:   ${formatNet(-penalty)}`, 'payout-loss'));
  screen.appendChild(makeResultLine(`Cash:   ${formatCash(state.cash)}`));
  screen.appendChild(makeResultLine(`Chill:  ${progressBar(state.chill, 100, 16)}`));
  screen.appendChild(makeResultLine(`Mana:   ${progressBar(state.mana, state.maxMana, 16)}`));

  screen.appendChild(makeDivider());

  const wakeBtn = makeButton(
    `WAKE UP  (${formatClock(state.clock)})`,
    () => dispatch({ type: 'WAKE_UP' }),
    'nav-btn',
  );
  screen.appendChild(wakeBtn);

  container.appendChild(screen);
}
