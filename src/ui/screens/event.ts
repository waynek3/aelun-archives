// Random Event screen (Sprint 23).
// Shows flavor text, choices (pre-resolution), and outcome text (post-resolution).

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { makeButton, makeHeader, makeDivider, makeResultLine } from '../components';

type Dispatch = (action: GameAction) => void;

export function renderEvent(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  if (!state.activeEvent) return;

  const screen = document.createElement('div');
  screen.className = 'screen';

  const event = state.activeEvent;

  screen.appendChild(makeHeader('SOMETHING HAPPENS'));
  screen.appendChild(makeDivider());

  // Flavor text.
  screen.appendChild(makeResultLine(event.flavor));
  screen.appendChild(makeDivider());

  if (!event.resolved) {
    // Show choices.
    for (let i = 0; i < event.choices.length; i++) {
      const idx = i;
      screen.appendChild(makeButton(
        event.choices[i].label,
        () => dispatch({ type: 'RESOLVE_EVENT', choiceIndex: idx }),
        'action-btn',
      ));
    }
  } else {
    // Show outcome.
    if (event.outcomeText) {
      screen.appendChild(makeResultLine(event.outcomeText));
      screen.appendChild(makeDivider());
    }

    screen.appendChild(makeButton(
      'CONTINUE',
      () => dispatch({ type: 'DISMISS_EVENT' }),
      'action-btn',
    ));
  }

  container.replaceChildren();
  container.appendChild(screen);
}
