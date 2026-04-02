// Reusable DOM component builders.
// All return HTMLElement instances; no innerHTML string injection.

import type { GameState, InventoryItem, GodId, LocationId, NeighborhoodId, ActiveEvent } from '../state/types';
import type { GameAction } from '../engine/actions';
import { progressBar } from '../util/format';
import { bal } from '../data/balance-types';
import { getSpellDef } from '../data/spells';
import { ALL_GOD_IDS, getGod } from '../data/gods';
import { formatClock, previewClock } from '../engine/time';
import { getTravelCostRaw } from '../systems/travel';
import { openModal } from './modal';
import {
  NEIGHBORHOODS,
  getNeighborhoodBodega,
  getNeighborhoodTemples,
  getNeighborhoodFurnitureStore,
  getNeighborhoodUniversity,
  getNeighborhoodScrollStore,
  getNeighborhoodBookstore,
  getNeighborhoodDadsHouse,
  getNeighborhoodBar,
  getLocationData,
} from '../data/locations';

type Dispatch = (action: GameAction) => void;

// ── Button ────────────────────────────────────────────────────────────────────

export function makeButton(
  label: string,
  onClick: () => void,
  className?: string,
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = `btn${className ? ` ${className}` : ''}`;
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

// ── Section header / divider ──────────────────────────────────────────────────

export function makeHeader(text: string): HTMLElement {
  const h = document.createElement('div');
  h.className = 'section-header';
  h.textContent = text;
  return h;
}

// ── Cash display ──────────────────────────────────────────────────────────────

export function makeCashBar(label: string, value: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'cash-bar';
  const l = document.createElement('span');
  l.className = 'cash-label';
  l.textContent = label;
  const v = document.createElement('span');
  v.className = 'cash-value';
  v.textContent = value;
  row.appendChild(l);
  row.appendChild(v);
  return row;
}

// ── Quantity row ──────────────────────────────────────────────────────────────
// Used in the bodega screen: name, cost, [-] [n] [+]

export interface QuantityRowHandlers {
  onDecrement: () => void;
  onIncrement: () => void;
}

export function makeQuantityRow(
  name: string,
  cost: string,
  quantity: number,
  handlers: QuantityRowHandlers,
): { row: HTMLElement; updateQty: (n: number) => void } {
  const row = document.createElement('div');
  row.className = 'qty-row';

  const nameEl = document.createElement('span');
  nameEl.className = 'ticket-name';
  nameEl.textContent = name;

  const costEl = document.createElement('span');
  costEl.className = 'ticket-cost';
  costEl.textContent = cost;

  const dec = document.createElement('button');
  dec.className = 'btn qty-btn';
  dec.textContent = '−';
  dec.addEventListener('click', handlers.onDecrement);

  const countEl = document.createElement('span');
  countEl.className = 'qty-count';
  countEl.textContent = String(quantity);

  const inc = document.createElement('button');
  inc.className = 'btn qty-btn';
  inc.textContent = '+';
  inc.addEventListener('click', handlers.onIncrement);

  row.appendChild(nameEl);
  row.appendChild(costEl);
  row.appendChild(dec);
  row.appendChild(countEl);
  row.appendChild(inc);

  return {
    row,
    updateQty: (n: number) => { countEl.textContent = String(n); },
  };
}

// ── Panel / Card ──────────────────────────────────────────────────────────────

export function makePanel(label?: string): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'panel';
  if (label) {
    const lbl = document.createElement('span');
    lbl.className = 'panel-label';
    lbl.textContent = label;
    panel.appendChild(lbl);
  }
  return panel;
}

// ── Divider line ──────────────────────────────────────────────────────────────

export function makeDivider(): HTMLElement {
  const hr = document.createElement('div');
  hr.className = 'divider';
  hr.textContent = '─'.repeat(28);
  return hr;
}

// ── Result line ───────────────────────────────────────────────────────────────

export function makeResultLine(text: string, className?: string): HTMLElement {
  const p = document.createElement('p');
  p.className = `result-line${className ? ` ${className}` : ''}`;
  p.textContent = text;
  return p;
}

// ── Inventory panel ──────────────────────────────────────────────────────────
// Reusable panel showing current inventory with EAT buttons for snacks
// and USE buttons for spell scrolls.

export function makeInventoryPanel(
  inventory: (InventoryItem | null)[],
  onConsume: (slotIndex: number) => void,
  onUseScroll?: (slotIndex: number, godId?: GodId) => void,
  onAffinitySelect?: (slotIndex: number) => void,
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'inventory-panel';

  const count = inventory.filter(i => i !== null).length;
  panel.appendChild(makeHeader(`INVENTORY (${count}/${inventory.length})`));

  for (let i = 0; i < inventory.length; i++) {
    const item = inventory[i];
    if (item && item.type === 'snack') {
      const btn = makeButton(
        `${item.name}  [EAT]`,
        () => onConsume(i),
        'inv-btn',
      );
      panel.appendChild(btn);
    } else if (item && item.type === 'spell_scroll') {
      const spell = getSpellDef(item.spellId);
      const nameEl = document.createElement('p');
      nameEl.className = 'inv-scroll-name';
      nameEl.textContent = item.name;
      panel.appendChild(nameEl);

      if (onUseScroll) {
        if (spell.category === 'affinity') {
          const capturedIndex = i;
          if (onAffinitySelect) {
            // Nested modal: show SELECT GOD button; caller handles god selection modal.
            const selectBtn = makeButton('[ SELECT GOD \u2192 ]', () => onAffinitySelect(capturedIndex), 'inv-btn');
            panel.appendChild(selectBtn);
          } else {
            // Fallback: inline god buttons.
            const godRow = document.createElement('div');
            godRow.className = 'spell-god-row';
            for (const godId of ALL_GOD_IDS) {
              const godBtn = makeButton(getGod(godId).name.toUpperCase(), () => {
                onUseScroll(capturedIndex, godId);
              }, 'spell-god-btn');
              godRow.appendChild(godBtn);
            }
            panel.appendChild(godRow);
          }
        } else {
          const capturedIndex = i;
          const useBtn = makeButton('[USE]', () => onUseScroll(capturedIndex), 'inv-btn');
          panel.appendChild(useBtn);
        }
      }
    } else if (item && item.type === 'monument') {
      const el = document.createElement('p');
      el.className = 'inv-monument';
      el.textContent = item.name;
      panel.appendChild(el);
    } else {
      const el = document.createElement('p');
      el.className = 'inv-empty';
      el.textContent = '[ empty ]';
      panel.appendChild(el);
    }
  }

  return panel;
}

// ── God Select panel ─────────────────────────────────────────────────────────
// Reusable 10-button god selection grid used for affinity scrolls and spells.

export function makeGodSelectPanel(onSelect: (godId: GodId) => void): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'god-select-panel';
  for (const godId of ALL_GOD_IDS) {
    panel.appendChild(makeButton(getGod(godId).name.toUpperCase(), () => onSelect(godId), 'spell-god-btn'));
  }
  return panel;
}

// ── Stats panel ──────────────────────────────────────────────────────────────
// Compact 2-row layout: labels row + bars row. No header label.

export function makeStatsPanel(state: GameState): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'stats-panel';

  const dm = bal.stats.displayMax;
  const stats: Array<{ label: string; value: number; max: number }> = [
    { label: 'INT',  value: state.intelligence,      max: dm.intelligence },
    { label: 'BIND', value: state.bookbinding,       max: dm.bookbinding },
    { label: 'FAME', value: state.wizardFame,        max: dm.wizardFame },
    { label: 'RELX', value: state.relaxationRate,    max: dm.relaxationRate },
    { label: 'REST', value: state.restingRelaxation, max: dm.restingRelaxation },
  ];

  const compact = document.createElement('div');
  compact.className = 'stats-compact';

  const labelsRow = document.createElement('div');
  labelsRow.className = 'stats-labels';

  const barsRow = document.createElement('div');
  barsRow.className = 'stats-bars';

  for (const s of stats) {
    const lbl = document.createElement('span');
    lbl.textContent = s.label;
    labelsRow.appendChild(lbl);

    const bar = document.createElement('span');
    bar.textContent = progressBar(s.value, s.max, 8);
    barsRow.appendChild(bar);
  }

  compact.appendChild(labelsRow);
  compact.appendChild(barsRow);
  panel.appendChild(compact);

  return panel;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
// Universal DOS-style overlay. One component for all modal needs:
// travel, inventory, god-selection, confirmations, random events, etc.
//
// title    — inverted title bar text
// text     — optional plain-text lines rendered above the body (flavor, prompts)
// body     — HTMLElement with buttons/content
// onClose  — called by CLOSE button and click-outside-to-dismiss
// onBack   — if provided, a BACK button appears (for nested navigation)
// blockClose — if true, hides CLOSE and disables outside-click (for forced choices)

export interface ModalConfig {
  title: string;
  text?: string[];
  body: HTMLElement;
  onClose: () => void;
  onBack?: () => void;
  blockClose?: boolean;
}

export function makeModal(config: ModalConfig): HTMLElement {
  const { title, text, body, onClose, onBack, blockClose } = config;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const box = document.createElement('div');
  box.className = 'modal-box';

  const titleEl = document.createElement('div');
  titleEl.className = 'modal-title';
  titleEl.textContent = title;
  box.appendChild(titleEl);

  if (text && text.length > 0) {
    for (const line of text) {
      const p = document.createElement('p');
      p.className = 'modal-text';
      p.textContent = line;
      box.appendChild(p);
    }
  }

  const bodyEl = document.createElement('div');
  bodyEl.className = 'modal-body';
  bodyEl.appendChild(body);
  box.appendChild(bodyEl);

  if (onBack) {
    const backBtn = document.createElement('button');
    backBtn.className = 'btn modal-back-btn';
    backBtn.textContent = '[ BACK ]';
    backBtn.addEventListener('click', onBack);
    box.appendChild(backBtn);
  }

  if (!blockClose) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn modal-close-btn';
    closeBtn.textContent = '[ CLOSE ]';
    closeBtn.addEventListener('click', onClose);
    box.appendChild(closeBtn);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) onClose();
    });
  }

  overlay.appendChild(box);
  return overlay;
}

// ── Event Modal ───────────────────────────────────────────────────────────────
// Builds an event overlay from an ActiveEvent. blockClose=true forces a choice.
// Appended to the screen element in renderer.ts when state.activeEvent !== null.

export function makeEventModal(event: ActiveEvent, dispatch: Dispatch): HTMLElement {
  const body = document.createElement('div');

  if (!event.resolved) {
    for (let i = 0; i < event.choices.length; i++) {
      const idx = i;
      body.appendChild(makeButton(
        event.choices[i].label,
        () => dispatch({ type: 'RESOLVE_EVENT', choiceIndex: idx }),
        'action-btn',
      ));
    }
  } else {
    body.appendChild(makeButton(
      'CONTINUE',
      () => dispatch({ type: 'DISMISS_EVENT' }),
      'action-btn',
    ));
  }

  const text: string[] = [event.flavor];
  if (event.resolved && event.outcomeText) {
    text.push(event.outcomeText);
  }

  return makeModal({
    title: 'SOMETHING HAPPENS',
    text,
    body,
    blockClose: true,
    onClose: () => {},
  });
}

// ── Travel panel ──────────────────────────────────────────────────────────────
// Two-level nested travel panel used inside the universal modal.
//   Level 1 (currentModalId === 'travel'): 6 neighborhood buttons + TOWER HOME.
//   Level 2 (currentModalId === 'travel:nbId'): destinations in that neighborhood.
// The onBack for level 2 is wired by each caller screen via ModalConfig.onBack.

function getNeighborhoodDestinations(
  neighborhoodId: NeighborhoodId,
  currentLoc: LocationId,
  dadAlive: boolean,
): LocationId[] {
  const bodegaId = getNeighborhoodBodega(neighborhoodId);
  const temples = getNeighborhoodTemples(neighborhoodId);
  const fsId = getNeighborhoodFurnitureStore(neighborhoodId);
  const uniId = getNeighborhoodUniversity(neighborhoodId);
  const ssId = getNeighborhoodScrollStore(neighborhoodId);
  const bsId = getNeighborhoodBookstore(neighborhoodId);
  const dhId = getNeighborhoodDadsHouse(neighborhoodId);
  const barId = getNeighborhoodBar(neighborhoodId);

  // If dad has passed, dhId is still included but shown as "DAD'S GRAVE".
  void dadAlive;  // used by caller for display name; included to keep signature clear

  return [
    bodegaId,
    ...temples.map(t => t.id),
    fsId,
    ...(uniId ? [uniId] : []),
    ssId,
    ...(bsId ? [bsId] : []),
    ...(dhId ? [dhId] : []),
    ...(barId ? [barId] : []),
  ].filter(id => id !== currentLoc);
}

export function makeTravelPanel(
  state: GameState,
  dispatch: Dispatch,
  screenId: string,
  currentModalId: string,
  rerender: () => void,
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'travel-panel';

  const currentLoc = state.currentLocation;
  const isLevel2 = currentModalId.startsWith('travel:');

  if (!isLevel2) {
    // Level 1: TOWER HOME shortcut + one button per neighborhood.
    if (currentLoc !== 'tower') {
      const towerLoc = 'tower' as LocationId;
      const cost = getTravelCostRaw(currentLoc, towerLoc);
      const clock = previewClock(state.clock, cost);
      panel.appendChild(makeButton(
        `TOWER (HOME)  \u2192  ${formatClock(clock)}`,
        () => dispatch({ type: 'TRAVEL', destination: towerLoc }),
        'nav-btn',
      ));
    }

    for (const neighborhood of NEIGHBORHOODS) {
      const destinations = getNeighborhoodDestinations(neighborhood.id as NeighborhoodId, currentLoc, state.dadAlive);
      if (destinations.length === 0) continue;
      panel.appendChild(makeButton(
        `${neighborhood.name.toUpperCase()}  (${destinations.length})`,
        () => openModal(screenId, `travel:${neighborhood.id}`, rerender),
        'nav-btn',
      ));
    }
  } else {
    // Level 2: destinations within the selected neighborhood.
    const neighborhoodId = currentModalId.slice(7) as NeighborhoodId;  // strip 'travel:'
    const dhId = getNeighborhoodDadsHouse(neighborhoodId);
    const destinations = getNeighborhoodDestinations(neighborhoodId, currentLoc, state.dadAlive);

    for (const destId of destinations) {
      const destData = getLocationData(destId);
      const cost = getTravelCostRaw(currentLoc, destId);
      const clock = previewClock(state.clock, cost);
      const displayName = (destId === dhId && !state.dadAlive)
        ? "DAD'S GRAVE"
        : destData.displayName;
      panel.appendChild(makeButton(
        `${displayName}  \u2192  ${formatClock(clock)}`,
        () => dispatch({ type: 'TRAVEL', destination: destId }),
        'nav-btn',
      ));
    }
  }

  return panel;
}
