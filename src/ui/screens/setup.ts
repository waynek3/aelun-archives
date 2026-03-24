// Setup screen — shown at the start of every new run.
// Player picks their birthday month (1–12).
// Displays which god is strong during each month so the player can plan ahead.
// Dispatches SET_BIRTHDAY when a month is chosen, transitioning to phase='playing'.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { makeButton, makeHeader, makeDivider } from '../components';
import { GODS, ALL_GOD_IDS } from '../../data/gods';
import type { GodId } from '../../state/types';

type Dispatch = (action: GameAction) => void;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

// Build a month → god name(s) map from GODS data.
function buildStrongMonthMap(): Record<number, string[]> {
  const map: Record<number, string[]> = {};
  for (const godId of ALL_GOD_IDS) {
    for (const m of GODS[godId as GodId].strongMonths) {
      if (!map[m]) map[m] = [];
      map[m].push(GODS[godId as GodId].name);
    }
  }
  return map;
}

export function renderSetup(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  // state is needed for the dispatch closure; not used for display here.
  void state;

  container.replaceChildren();

  const screen = document.createElement('div');
  screen.className = 'screen setup-screen';

  screen.appendChild(makeHeader('WIZARD SETUP'));
  screen.appendChild(makeDivider());

  const intro = document.createElement('p');
  intro.className = 'setup-intro';
  intro.textContent = 'Choose your birthday month. The gods who are strong that month will favor you on your birthdays.';
  screen.appendChild(intro);

  screen.appendChild(makeDivider());
  screen.appendChild(makeHeader('PICK A MONTH'));

  const strongMonthMap = buildStrongMonthMap();

  for (let m = 1; m <= 12; m++) {
    const godNames = strongMonthMap[m] ?? [];
    const godLabel = godNames.length > 0 ? `  [${godNames.join(', ')}]` : '';
    const btn = makeButton(
      `${MONTH_NAMES[m - 1]}${godLabel}`,
      () => dispatch({ type: 'SET_BIRTHDAY', month: m }),
      'setup-month-btn',
    );
    screen.appendChild(btn);
  }

  container.appendChild(screen);
}
