// Dad's House screen (Sprint 22).
// When dadAlive: loan interface. When !dadAlive: Dad's Grave (visit for mana/chill).

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { makeButton, makeHeader, makeDivider, makeInventoryPanel, makeResultLine } from '../components';
import { formatCash } from '../../util/format';
import { formatClock, previewClock } from '../../engine/time';
import { getTravelCostRaw } from '../../systems/travel';
import {
  getLocationData,
  getNeighborhoodTemples,
  NEIGHBORHOODS,
  getNeighborhoodBodega,
  getNeighborhoodFurnitureStore,
  getNeighborhoodUniversity,
  getNeighborhoodScrollStore,
  getNeighborhoodBookstore,
  getNeighborhoodDadsHouse,
} from '../../data/locations';
import { getAvailableLoanAmounts, calculateInterestRate } from '../../systems/loan';
import balance from '../../data/balance.json';

type Dispatch = (action: GameAction) => void;

const dadBal = balance.dadsHouse as {
  collateralThreshold: number;
  graveManaRestore: number;
  graveChillLoss: number;
};

export function renderDadsHouse(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  const screen = document.createElement('div');
  screen.className = 'screen';

  if (state.dadAlive) {
    renderDadAlive(state, screen, dispatch);
  } else {
    renderDadGrave(state, screen, dispatch);
  }

  // ── Inventory ──
  screen.appendChild(makeDivider());
  screen.appendChild(
    makeInventoryPanel(
      state.inventory,
      (slotIndex) => dispatch({ type: 'CONSUME_SNACK', slotIndex }),
      (slotIndex, godId) => dispatch({ type: 'USE_SCROLL', slotIndex, godId }),
    ),
  );

  // ── Travel ──
  renderTravelSection(state, screen, dispatch);

  container.innerHTML = '';
  container.appendChild(screen);
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
      a => a <= state.cash && a <= Math.ceil(state.loan!.principal),
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
      const label = amount >= Math.ceil(state.loan!.principal)
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

function renderTravelSection(state: GameState, screen: HTMLElement, dispatch: Dispatch): void {
  screen.appendChild(makeDivider());
  screen.appendChild(makeHeader('TRAVEL'));

  // Tower (home)
  const towerCost = getTravelCostRaw(state.currentLocation, 'tower');
  const towerClock = previewClock(state.clock, towerCost);
  screen.appendChild(makeButton(
    `TOWER (HOME)  \u2192  ${formatClock(towerClock)}`,
    () => dispatch({ type: 'TRAVEL', destination: 'tower' }),
    'nav-btn',
  ));

  for (const neighborhood of NEIGHBORHOODS) {
    const nbLabel = document.createElement('p');
    nbLabel.className = 'neighborhood-label';
    nbLabel.textContent = neighborhood.name.toUpperCase();
    screen.appendChild(nbLabel);

    // Bodega
    const bodegaId = getNeighborhoodBodega(neighborhood.id);
    const bodegaData = getLocationData(bodegaId);
    const bodegaCost = getTravelCostRaw(state.currentLocation, bodegaId);
    const bodegaClock = previewClock(state.clock, bodegaCost);
    screen.appendChild(makeButton(
      `${bodegaData.displayName}  \u2192  ${formatClock(bodegaClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: bodegaId }),
      'nav-btn',
    ));

    // Temples
    const temples = getNeighborhoodTemples(neighborhood.id);
    for (const temple of temples) {
      if (temple.id === state.currentLocation) continue;
      const tCost = getTravelCostRaw(state.currentLocation, temple.id);
      const tClock = previewClock(state.clock, tCost);
      screen.appendChild(makeButton(
        `${temple.displayName}  \u2192  ${formatClock(tClock)}`,
        () => dispatch({ type: 'TRAVEL', destination: temple.id }),
        'nav-btn',
      ));
    }

    // Furniture store
    const fsId = getNeighborhoodFurnitureStore(neighborhood.id);
    const fsData = getLocationData(fsId);
    const fsCost = getTravelCostRaw(state.currentLocation, fsId);
    const fsClock = previewClock(state.clock, fsCost);
    screen.appendChild(makeButton(
      `${fsData.displayName}  \u2192  ${formatClock(fsClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: fsId }),
      'nav-btn',
    ));

    // University
    const uniId = getNeighborhoodUniversity(neighborhood.id);
    if (uniId) {
      const uniData = getLocationData(uniId);
      const uniCost = getTravelCostRaw(state.currentLocation, uniId);
      const uniClock = previewClock(state.clock, uniCost);
      screen.appendChild(makeButton(
        `${uniData.displayName}  \u2192  ${formatClock(uniClock)}`,
        () => dispatch({ type: 'TRAVEL', destination: uniId }),
        'nav-btn',
      ));
    }

    // Scroll store
    const ssId = getNeighborhoodScrollStore(neighborhood.id);
    const ssData = getLocationData(ssId);
    const ssCost = getTravelCostRaw(state.currentLocation, ssId);
    const ssClock = previewClock(state.clock, ssCost);
    screen.appendChild(makeButton(
      `${ssData.displayName}  \u2192  ${formatClock(ssClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: ssId }),
      'nav-btn',
    ));

    // University bookstore
    const bsId = getNeighborhoodBookstore(neighborhood.id);
    if (bsId) {
      const bsData = getLocationData(bsId);
      const bsCost = getTravelCostRaw(state.currentLocation, bsId);
      const bsClock = previewClock(state.clock, bsCost);
      screen.appendChild(makeButton(
        `${bsData.displayName}  \u2192  ${formatClock(bsClock)}`,
        () => dispatch({ type: 'TRAVEL', destination: bsId }),
        'nav-btn',
      ));
    }

    // Dad's House (Richville only)
    const dhId = getNeighborhoodDadsHouse(neighborhood.id);
    if (dhId && dhId !== state.currentLocation) {
      const dhData = getLocationData(dhId);
      const dhCost = getTravelCostRaw(state.currentLocation, dhId);
      const dhClock = previewClock(state.clock, dhCost);
      const dhLabel = state.dadAlive ? dhData.displayName : "DAD'S GRAVE";
      screen.appendChild(makeButton(
        `${dhLabel}  \u2192  ${formatClock(dhClock)}`,
        () => dispatch({ type: 'TRAVEL', destination: dhId }),
        'nav-btn',
      ));
    }
  }
}
