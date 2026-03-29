// Dad's House screen (Sprint 22).
// When dadAlive: loan interface. When !dadAlive: Dad's Grave (visit for mana/chill).
// Redesign: INVENTORY and TRAVEL moved to modal popups.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import {
  makeButton, makeHeader, makeDivider, makeInventoryPanel, makeResultLine,
  makeModal, makeTravelPanel,
} from '../components';
import { formatCash } from '../../util/format';
import { getAvailableLoanAmounts, calculateInterestRate } from '../../systems/loan';
import { bal } from '../../data/balance-types';
import { getModal, openModal, closeModal } from '../modal';

type Dispatch = (action: GameAction) => void;

const SCREEN = 'dads_house';
const dadBal = bal.dadsHouse;

export function renderDadsHouse(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  const screen = document.createElement('div');
  screen.className = 'screen';

  if (state.dadAlive) {
    renderDadAlive(state, screen, dispatch);
  } else {
    renderDadGrave(state, screen, dispatch);
  }

  // ── Section buttons ──
  screen.appendChild(makeDivider());

  const invCount = state.inventory.filter(i => i !== null).length;
  screen.appendChild(makeButton(
    `INVENTORY (${invCount}/${state.inventory.length})`,
    () => openModal(SCREEN, 'inventory', () => renderDadsHouse(state, container, dispatch)),
    'section-btn',
  ));

  screen.appendChild(makeButton(
    'TRAVEL',
    () => openModal(SCREEN, 'travel', () => renderDadsHouse(state, container, dispatch)),
    'section-btn',
  ));

  container.replaceChildren();
  container.appendChild(screen);

  // ── Active modal ──
  const activeModal = getModal(SCREEN);
  if (activeModal !== null) {
    const onClose = () => closeModal(SCREEN, () => renderDadsHouse(state, container, dispatch));
    let body: HTMLElement;
    let title: string;

    if (activeModal === 'inventory') {
      title = 'INVENTORY';
      body = makeInventoryPanel(
        state.inventory,
        (slotIndex) => dispatch({ type: 'CONSUME_SNACK', slotIndex }),
        (slotIndex, godId) => dispatch({ type: 'USE_SCROLL', slotIndex, godId }),
      );
    } else {
      title = 'TRAVEL';
      body = makeTravelPanel(state, dispatch);
    }

    container.appendChild(makeModal(title, body, onClose));
  }
}

function renderDadAlive(state: GameState, screen: HTMLElement, dispatch: Dispatch): void {
  screen.appendChild(makeHeader("DAD'S HOUSE"));
  screen.appendChild(makeResultLine('Your father lives here.'));
  screen.appendChild(makeResultLine('He is disappointed in you.'));
  screen.appendChild(makeDivider());

  // Cash display
  screen.appendChild(makeResultLine(`Cash: ${formatCash(state.cash)}`));
  screen.appendChild(makeDivider());

  if (!state.loan) {
    // ── Take out a loan ──
    screen.appendChild(makeHeader('TAKE OUT LOAN'));

    const rate = calculateInterestRate(state.wizardFame);
    const ratePercent = Math.round(rate * 100);
    screen.appendChild(makeResultLine(`Interest: ${ratePercent}% per month`));

    const amounts = getAvailableLoanAmounts(state.wizardFame);
    if (amounts.length === 0) {
      screen.appendChild(makeResultLine('No loans available at your fame level.'));
    }

    for (const amount of amounts) {
      const isCollateral = amount >= dadBal.collateralThreshold;
      const label = isCollateral
        ? `BORROW ${formatCash(amount)} [SPELLBOOK COLLATERAL]`
        : `BORROW ${formatCash(amount)}`;
      screen.appendChild(makeButton(
        label,
        () => dispatch({ type: 'TAKE_LOAN', amount }),
        'action-btn',
      ));
    }
  } else {
    // ── Outstanding loan ──
    screen.appendChild(makeHeader('OUTSTANDING LOAN'));
    screen.appendChild(makeResultLine(`Principal: ${formatCash(Math.ceil(state.loan.principal))}`));
    screen.appendChild(makeResultLine(`Rate: ${Math.round(state.loan.interestRate * 100)}%/month`));

    if (state.loan.collateral) {
      screen.appendChild(makeResultLine('Dad is holding your spellbook.'));
    }

    screen.appendChild(makeDivider());
    screen.appendChild(makeHeader('REPAY'));

    const repayAmounts = [25, 50, 100, 250].filter(
      a => a <= state.cash && state.loan !== null && a <= Math.ceil(state.loan.principal),
    );
    // Always offer "pay all" if affordable.
    const fullAmount = Math.ceil(state.loan.principal);
    if (state.cash >= fullAmount && !repayAmounts.includes(fullAmount)) {
      repayAmounts.push(fullAmount);
    }

    if (repayAmounts.length === 0 && state.cash > 0 && state.loan.principal > 0) {
      // Partial repay with whatever cash the player has.
      repayAmounts.push(Math.min(state.cash, Math.ceil(state.loan.principal)));
    }

    for (const amount of repayAmounts) {
      const label = state.loan !== null && amount >= Math.ceil(state.loan.principal)
        ? `REPAY ALL (${formatCash(amount)})`
        : `REPAY ${formatCash(amount)}`;
      screen.appendChild(makeButton(
        label,
        () => dispatch({ type: 'REPAY_LOAN', amount }),
        'action-btn',
      ));
    }
  }
}

function renderDadGrave(_state: GameState, screen: HTMLElement, dispatch: Dispatch): void {
  screen.appendChild(makeHeader("DAD'S GRAVE"));
  screen.appendChild(makeResultLine("He's gone. You feel something."));
  screen.appendChild(makeDivider());

  screen.appendChild(makeButton(
    'VISIT GRAVE',
    () => dispatch({ type: 'VISIT_GRAVE' }),
    'action-btn',
  ));
  screen.appendChild(makeResultLine(`(+${dadBal.graveManaRestore} mana, -${dadBal.graveChillLoss} chill)`));
}
