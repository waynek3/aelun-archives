// University Bar screen: order drinks (immediate chill/mana effect) and buy snacks for inventory.
// Sprint 25: University Heights only.
// Redesign: INVENTORY and TRAVEL moved to modal popups.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { DRINKS } from '../../data/drinks';
import { SNACKS } from '../../data/food';
import { formatCash } from '../../util/format';
import {
  makeButton, makeHeader, makeCashBar, makeQuantityRow, makeDivider,
  makeInventoryPanel, makeModal, makeTravelPanel,
} from '../components';
import { formatClock, previewClock } from '../../engine/time';
import { freeSlots } from '../../systems/inventory';
import { getLocationData } from '../../data/locations';
import { getModal, openModal, closeModal } from '../modal';

type Dispatch = (action: GameAction) => void;

const SCREEN = 'university_bar';

// Local snack quantity state (UI-only, reset on each render).
const snackQtys: Record<string, number> = {};

// ─── Render ───────────────────────────────────────────────────────────────────

export function renderBar(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.replaceChildren();

  // Reset snack quantities on fresh render.
  for (const s of SNACKS) snackQtys[s.id] = 0;

  const screen = document.createElement('div');
  screen.className = 'screen bar-screen';

  // ── Header ──
  const locData = getLocationData(state.currentLocation);
  screen.appendChild(makeHeader(locData.displayName));
  screen.appendChild(makeDivider());

  // ── Cash display ──
  const cashBar = makeCashBar('Cash:', formatCash(state.cash));
  cashBar.id = 'bar-cash';
  screen.appendChild(cashBar);
  screen.appendChild(makeDivider());

  // ── Drinks section ──
  screen.appendChild(makeHeader('DRINKS'));

  for (const drink of DRINKS) {
    const row = document.createElement('div');
    row.className = 'drink-row';

    const infoEl = document.createElement('p');
    infoEl.className = 'drink-info';
    const arrivalClock = previewClock(state.clock, drink.timeMinutes);
    infoEl.textContent = `${drink.name}  ${formatCash(drink.cost)}  \u2192  ${formatClock(arrivalClock)}`;
    row.appendChild(infoEl);

    const descEl = document.createElement('p');
    descEl.className = 'drink-desc';
    descEl.textContent = `chill up  |  mana down`;
    row.appendChild(descEl);

    const orderBtn = makeButton('[ORDER]', () => {
      const snackIdList: string[] = [];
      for (const s of SNACKS) {
        for (let i = 0; i < (snackQtys[s.id] ?? 0); i++) {
          snackIdList.push(s.id);
        }
      }
      dispatch({
        type: 'ORDER_DRINK',
        drinkId: drink.id,
        snacks: snackIdList.length > 0 ? snackIdList : undefined,
      });
    }, 'drink-btn');

    const totalWithDrink = drink.cost + projectedSnackCost();
    if (state.cash < totalWithDrink) orderBtn.disabled = true;

    row.appendChild(orderBtn);
    screen.appendChild(row);
  }

  screen.appendChild(makeDivider());

  // ── Food section ──
  screen.appendChild(makeHeader('FOOD'));

  for (const snack of SNACKS) {
    const { row, updateQty } = makeQuantityRow(
      snack.name,
      formatCash(snack.cost),
      0,
      {
        onDecrement: () => {
          if (snackQtys[snack.id] > 0) {
            snackQtys[snack.id]--;
            updateQty(snackQtys[snack.id]);
            refreshDrinkButtons();
          }
        },
        onIncrement: () => {
          const free = freeSlots(state.inventory);
          if (totalSnackCount() >= free) return;
          const snackCost = projectedSnackCost() + snack.cost;
          const cheapestDrink = Math.min(...DRINKS.map(d => d.cost));
          if (state.cash < cheapestDrink + snackCost) return;
          snackQtys[snack.id]++;
          updateQty(snackQtys[snack.id]);
          refreshDrinkButtons();
        },
      },
    );
    screen.appendChild(row);
  }

  // Inventory warning.
  const invWarning = document.createElement('p');
  invWarning.className = 'inv-warning';
  invWarning.id = 'bar-inv-warning';
  invWarning.style.display = 'none';
  screen.appendChild(invWarning);

  // ── Section buttons ──
  screen.appendChild(makeDivider());

  const invCount = state.inventory.filter(i => i !== null).length;
  screen.appendChild(makeButton(
    `INVENTORY (${invCount}/${state.inventory.length})`,
    () => openModal(SCREEN, 'inventory', () => renderBar(state, container, dispatch)),
    'section-btn',
  ));

  screen.appendChild(makeButton(
    'TRAVEL',
    () => openModal(SCREEN, 'travel', () => renderBar(state, container, dispatch)),
    'section-btn',
  ));

  container.appendChild(screen);

  // ── Active modal ──
  const activeModal = getModal(SCREEN);
  if (activeModal !== null) {
    const onClose = () => closeModal(SCREEN, () => renderBar(state, container, dispatch));
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

  // ── Helpers ──
  function projectedSnackCost(): number {
    return SNACKS.reduce((sum, s) => sum + s.cost * (snackQtys[s.id] ?? 0), 0);
  }

  function totalSnackCount(): number {
    return SNACKS.reduce((sum, s) => sum + (snackQtys[s.id] ?? 0), 0);
  }

  function refreshDrinkButtons(): void {
    // Update ORDER button disabled states based on current snack selection + cash.
    const snackCount = totalSnackCount();
    const snackCost = projectedSnackCost();

    // Inventory warning.
    const warn = document.getElementById('bar-inv-warning');
    const free = freeSlots(state.inventory);
    if (warn) {
      if (snackCount >= free && free > 0) {
        warn.textContent = `! BAG FULL (${free}/${state.inventory.length} free) !`;
        warn.style.display = '';
      } else if (free === 0) {
        warn.textContent = `! BAG FULL (0/${state.inventory.length} free) !`;
        warn.style.display = '';
      } else {
        warn.style.display = 'none';
      }
    }

    // Re-evaluate each ORDER button.
    const drinkBtns = screen.querySelectorAll<HTMLButtonElement>('button.btn.drink-btn');
    DRINKS.forEach((drink, i) => {
      const btn = drinkBtns[i];
      if (btn) {
        btn.disabled = state.cash < drink.cost + snackCost;
      }
    });
  }
}
