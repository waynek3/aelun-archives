// Legacy Screen (Sprint 26) — shown when the player can't pay rent (evicted).
// Displays a programmatically generated life summary: final score, age at death,
// highest Wizard Fame, best single win, most/least favored gods, total tickets
// scratched, and notable Random Events experienced.

import type { GameState, GodId } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { makeButton, makeHeader, makeDivider, makeResultLine } from '../components';
import { formatCash } from '../../util/format';
import { calcDaysSurvived } from '../../systems/rent';
import { getEventDef } from '../../data/events';

type Dispatch = (action: GameAction) => void;

// Score formula: rewards longevity, big wins, fame, and activity.
function calcFinalScore(state: GameState): number {
  const days = calcDaysSurvived(state.day, state.month, state.year);
  return (
    days * 10 +
    Math.floor(state.bestSingleWin) +
    state.peakWizardFame * 20 +
    state.totalTicketsScratched * 2
  );
}

// Return [mostFavoredName, leastFavoredName] from affinity record.
// Returns 'none' if all values are 0.
function getFavoredGods(affinity: Record<GodId, number>): [string, string] {
  const entries = Object.entries(affinity) as [GodId, number][];
  if (entries.every(([, v]) => v === 0)) return ['none', 'none'];
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const mostFavored = capitalize(sorted[0][0]);
  const leastFavored = capitalize(sorted[sorted.length - 1][0]);
  return [mostFavored, leastFavored];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function renderGameOver(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.innerHTML = '';

  const screen = document.createElement('div');
  screen.className = 'screen game-over-screen';

  screen.appendChild(makeHeader("WIZARD'S LEGACY"));
  screen.appendChild(makeDivider());

  const msg = document.createElement('p');
  msg.className = 'game-over-msg';
  msg.textContent = "Evicted. You couldn't make rent.";
  screen.appendChild(msg);

  screen.appendChild(makeDivider());

  // Final score
  const score = calcFinalScore(state);
  screen.appendChild(makeResultLine(`SCORE:           ${score}`));

  screen.appendChild(makeDivider());

  // Run stats
  const days = calcDaysSurvived(state.day, state.month, state.year);
  screen.appendChild(makeResultLine(`Age:             Year ${state.year}`));
  screen.appendChild(makeResultLine(`Days survived:   ${days}`));
  screen.appendChild(makeResultLine(`Tickets:         ${state.totalTicketsScratched}`));
  if (state.bestSingleWin > 0) {
    screen.appendChild(makeResultLine(`Best win:        ${formatCash(state.bestSingleWin)}`));
  }
  screen.appendChild(makeResultLine(`Peak fame:       ${state.peakWizardFame}`));

  screen.appendChild(makeDivider());

  // God affinity summary
  const [mostFavored, leastFavored] = getFavoredGods(state.affinity);
  screen.appendChild(makeResultLine(`Most favored:    ${mostFavored}`));
  screen.appendChild(makeResultLine(`Least favored:   ${leastFavored}`));

  screen.appendChild(makeDivider());

  // Notable events
  const eventsHeader = document.createElement('p');
  eventsHeader.className = 'result-line';
  eventsHeader.textContent = 'EVENTS WITNESSED';
  screen.appendChild(eventsHeader);

  if (state.notableEvents.length === 0) {
    screen.appendChild(makeResultLine('  None'));
  } else {
    for (const eventId of state.notableEvents) {
      let name = eventId;
      try { name = getEventDef(eventId).name; } catch { /* unknown event id */ }
      screen.appendChild(makeResultLine(`  \u00b7 ${name}`));
    }
  }

  screen.appendChild(makeDivider());

  screen.appendChild(makeButton('NEW GAME', () => dispatch({ type: 'NEW_GAME' }), 'nav-btn'));

  container.appendChild(screen);
}
