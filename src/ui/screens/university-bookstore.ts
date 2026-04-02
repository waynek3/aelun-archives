// University Bookstore screen — buy spell scrolls at a premium.
// Sprint 16: University Heights only; prices are 1.5× the standard scroll store.
// Redesign: INVENTORY and TRAVEL moved to modal popups.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { formatCash } from '../../util/format';
import {
  makeButton, makeHeader, makeDivider, makeInventoryPanel, makeModal, makeTravelPanel,
  makeGodSelectPanel,
} from '../components';
import { canFitItems } from '../../systems/inventory';
import { isSpellKnown } from '../../systems/spellbook';
import { SPELL_CATALOG } from '../../data/spells';
import { getLocationData } from '../../data/locations';
import { bal } from '../../data/balance-types';
import { getModal, openModal, closeModal } from '../modal';

type Dispatch = (action: GameAction) => void;

const SCREEN = 'university_bookstore';
const scrollsBal = bal.scrolls;

export function renderUniversityBookstore(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.replaceChildren();

  const screen = document.createElement('div');
  screen.className = 'screen university-bookstore-screen';

  const locData = getLocationData(state.currentLocation);
  screen.appendChild(makeHeader(locData.displayName));
  screen.appendChild(makeDivider());

  // ── Cash display ──
  const cashRow = document.createElement('p');
  cashRow.className = 'cash-bar';
  cashRow.textContent = `Cash: ${formatCash(state.cash)}`;
  screen.appendChild(cashRow);

  // ── Flavor note ──
  const flavorEl = document.createElement('p');
  flavorEl.className = 'bookstore-flavor';
  flavorEl.textContent = 'One-use scrolls. Fine parchment. Premium prices.';
  screen.appendChild(flavorEl);

  screen.appendChild(makeDivider());

  // ── Scroll catalog ──
  screen.appendChild(makeHeader('SPELL SCROLLS FOR SALE'));

  const unknownSpells = SPELL_CATALOG.filter(spell => !isSpellKnown(state.knownSpells, spell.id));

  if (unknownSpells.length === 0) {
    const noneEl = document.createElement('p');
    noneEl.className = 'scroll-none';
    noneEl.textContent = 'You know all these spells. Nothing here for you.';
    screen.appendChild(noneEl);
  } else {
    const hasInventorySpace = canFitItems(state.inventory, 1);

    for (const spell of unknownSpells) {
      const basePrice = scrollsBal.priceByLevel[String(spell.level)] ?? 50;
      const price = Math.floor(basePrice * scrollsBal.bookstoreMarkup);
      const canAfford = state.cash >= price;

      const row = document.createElement('div');
      row.className = 'scroll-store-row';

      const nameEl = document.createElement('p');
      nameEl.className = 'scroll-store-name';
      nameEl.textContent = `${spell.name} (Lvl ${spell.level})  ${formatCash(price)}`;
      row.appendChild(nameEl);

      const descEl = document.createElement('p');
      descEl.className = 'scroll-store-desc';
      descEl.textContent = spell.description;
      row.appendChild(descEl);

      const buyBtn = makeButton('[BUY]', () => {
        dispatch({ type: 'BUY_SCROLL', spellId: spell.id });
      }, 'scroll-btn');
      if (!canAfford || !hasInventorySpace) buyBtn.disabled = true;
      row.appendChild(buyBtn);

      screen.appendChild(row);
    }
  }

  // ── Section buttons ──
  screen.appendChild(makeDivider());

  const invCount = state.inventory.filter(i => i !== null).length;
  screen.appendChild(makeButton(
    `INVENTORY (${invCount}/${state.inventory.length})`,
    () => openModal(SCREEN, 'inventory', () => renderUniversityBookstore(state, container, dispatch)),
    'section-btn',
  ));

  screen.appendChild(makeButton(
    'TRAVEL',
    () => openModal(SCREEN, 'travel', () => renderUniversityBookstore(state, container, dispatch)),
    'section-btn',
  ));

  container.appendChild(screen);

  // ── Active modal ──
  const activeModal = getModal(SCREEN);
  if (activeModal !== null) {
    const rerender = () => renderUniversityBookstore(state, container, dispatch);
    const onClose = () => closeModal(SCREEN, rerender);

    if (activeModal === 'inventory') {
      container.appendChild(makeModal({
        title: 'INVENTORY',
        body: makeInventoryPanel(
          state.inventory,
          (slotIndex) => dispatch({ type: 'CONSUME_SNACK', slotIndex }),
          (slotIndex, godId) => dispatch({ type: 'USE_SCROLL', slotIndex, godId }),
          (slotIndex) => openModal(SCREEN, `god_select:${slotIndex}`, rerender),
        ),
        onClose,
      }));
    } else if (activeModal.startsWith('god_select:')) {
      const slotIndex = parseInt(activeModal.slice(11), 10);
      container.appendChild(makeModal({
        title: 'SELECT GOD',
        body: makeGodSelectPanel((godId) => dispatch({ type: 'USE_SCROLL', slotIndex, godId })),
        onClose,
        onBack: () => openModal(SCREEN, 'inventory', rerender),
      }));
    } else if (activeModal === 'travel' || activeModal.startsWith('travel:')) {
      const isLevel2 = activeModal.startsWith('travel:');
      const nbName = isLevel2 ? activeModal.slice(7).replace(/_/g, ' ').toUpperCase() : 'TRAVEL';
      container.appendChild(makeModal({
        title: nbName,
        body: makeTravelPanel(state, dispatch, SCREEN, activeModal, rerender),
        onClose,
        onBack: isLevel2 ? () => openModal(SCREEN, 'travel', rerender) : undefined,
      }));
    }
  }
}
