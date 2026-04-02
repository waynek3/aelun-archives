// Spell Scroll Store screen — buy one-use spell scrolls.
// Sprint 16: one scroll store per neighborhood; standard pricing.
// Redesign: INVENTORY and TRAVEL moved to modal popups.
// Refactor: category-first navigation — pick category, then see scrolls of that type.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import type { SpellCategory } from '../../data/spells';
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

const SCREEN = 'spell_scroll_store';
const scrollsBal = bal.scrolls;

const CATEGORY_LABELS: Record<SpellCategory, string> = {
  affinity: 'AFFINITY',
  luck:     'LUCK',
  chill:    'CHILL',
  mana:     'MANA',
  reveal:   'REVEAL',
  travel:   'TRAVEL',
  aging:    'AGING',
};

const CATEGORY_ORDER: SpellCategory[] = ['luck', 'chill', 'mana', 'reveal', 'travel', 'aging', 'affinity'];

export function renderSpellScrollStore(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.replaceChildren();

  const screen = document.createElement('div');
  screen.className = 'screen spell-scroll-store-screen';

  const locData = getLocationData(state.currentLocation);
  screen.appendChild(makeHeader(locData.displayName));
  screen.appendChild(makeDivider());

  // ── Cash display ──
  const cashRow = document.createElement('p');
  cashRow.className = 'cash-bar';
  cashRow.textContent = `Cash: ${formatCash(state.cash)}`;
  screen.appendChild(cashRow);

  screen.appendChild(makeDivider());
  screen.appendChild(makeHeader('SPELL SCROLLS'));

  // ── Category buttons ──
  const unknownSpells = SPELL_CATALOG.filter(spell => !isSpellKnown(state.knownSpells, spell.id));

  if (unknownSpells.length === 0) {
    const noneEl = document.createElement('p');
    noneEl.className = 'scroll-none';
    noneEl.textContent = 'You know all these spells. Nothing here for you.';
    screen.appendChild(noneEl);
  } else {
    for (const cat of CATEGORY_ORDER) {
      const count = unknownSpells.filter(s => s.category === cat).length;
      const btn = makeButton(
        `${CATEGORY_LABELS[cat]}  (${count})`,
        () => openModal(SCREEN, `category:${cat}`, () => renderSpellScrollStore(state, container, dispatch)),
        'section-btn',
      );
      if (count === 0) btn.disabled = true;
      screen.appendChild(btn);
    }
  }

  // ── Section buttons ──
  screen.appendChild(makeDivider());

  const invCount = state.inventory.filter(i => i !== null).length;
  screen.appendChild(makeButton(
    `INVENTORY (${invCount}/${state.inventory.length})`,
    () => openModal(SCREEN, 'inventory', () => renderSpellScrollStore(state, container, dispatch)),
    'section-btn',
  ));

  screen.appendChild(makeButton(
    'TRAVEL',
    () => openModal(SCREEN, 'travel', () => renderSpellScrollStore(state, container, dispatch)),
    'section-btn',
  ));

  container.appendChild(screen);

  // ── Active modal ──
  const activeModal = getModal(SCREEN);
  if (activeModal !== null) {
    const rerender = () => renderSpellScrollStore(state, container, dispatch);
    const onClose = () => closeModal(SCREEN, rerender);

    if (activeModal.startsWith('category:')) {
      const cat = activeModal.slice(9) as SpellCategory;
      const spells = unknownSpells.filter(s => s.category === cat);
      const hasInventorySpace = canFitItems(state.inventory, 1);

      const body = document.createElement('div');
      for (const spell of spells) {
        const price = scrollsBal.priceByLevel[String(spell.level)] ?? 50;
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

        body.appendChild(row);
      }

      container.appendChild(makeModal({
        title: CATEGORY_LABELS[cat],
        body,
        onClose,
        onBack: () => closeModal(SCREEN, rerender),
      }));
    } else if (activeModal === 'inventory') {
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
