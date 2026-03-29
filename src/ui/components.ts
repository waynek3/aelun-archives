// Reusable DOM component builders.
// All return HTMLElement instances; no innerHTML string injection.

import type { GameState, InventoryItem, GodId, LocationId } from '../state/types';
import type { GameAction } from '../engine/actions';
import { progressBar } from '../util/format';
import { bal } from '../data/balance-types';
import { getSpellDef } from '../data/spells';
import { ALL_GOD_IDS, getGod } from '../data/gods';
import { formatClock, previewClock } from '../engine/time';
import { getTravelCostRaw } from '../systems/travel';
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
          // Affinity scrolls need a target god — show a row of god buttons.
          const godRow = document.createElement('div');
          godRow.className = 'spell-god-row';
          const capturedIndex = i;
          for (const godId of ALL_GOD_IDS) {
            const godBtn = makeButton(getGod(godId).name.toUpperCase(), () => {
              onUseScroll(capturedIndex, godId);
            }, 'spell-god-btn');
            godRow.appendChild(godBtn);
          }
          panel.appendChild(godRow);
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
// DOS-style overlay with inverted title bar. Tap outside or CLOSE to dismiss.

export function makeModal(title: string, body: HTMLElement, onClose: () => void): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const box = document.createElement('div');
  box.className = 'modal-box';

  const titleEl = document.createElement('div');
  titleEl.className = 'modal-title';
  titleEl.textContent = title;

  const bodyEl = document.createElement('div');
  bodyEl.className = 'modal-body';
  bodyEl.appendChild(body);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn modal-close-btn';
  closeBtn.textContent = '[ CLOSE ]';
  closeBtn.addEventListener('click', onClose);

  // Tap outside the box to close.
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) onClose();
  });

  box.appendChild(titleEl);
  box.appendChild(bodyEl);
  box.appendChild(closeBtn);
  overlay.appendChild(box);

  return overlay;
}

// ── Travel panel ──────────────────────────────────────────────────────────────
// Shared travel destination list used by all location screens via TRAVEL modal.
// Filters out state.currentLocation. If at tower, no TOWER HOME button.
// Uses neighborhood-label + individual-button layout throughout for consistency.

export function makeTravelPanel(state: GameState, dispatch: Dispatch): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'travel-panel';

  const currentLoc = state.currentLocation;
  const isAtTower = currentLoc === 'tower';

  // TOWER (HOME) — shown from all non-tower locations.
  if (!isAtTower) {
    const towerLoc = 'tower' as LocationId;
    const cost = getTravelCostRaw(currentLoc, towerLoc);
    const clock = previewClock(state.clock, cost);
    panel.appendChild(makeButton(
      `TOWER (HOME)  \u2192  ${formatClock(clock)}`,
      () => dispatch({ type: 'TRAVEL', destination: towerLoc }),
      'nav-btn',
    ));
  }

  // Per-neighborhood sections.
  for (const neighborhood of NEIGHBORHOODS) {
    const bodegaId = getNeighborhoodBodega(neighborhood.id);
    const temples = getNeighborhoodTemples(neighborhood.id);
    const fsId = getNeighborhoodFurnitureStore(neighborhood.id);
    const uniId = getNeighborhoodUniversity(neighborhood.id);
    const ssId = getNeighborhoodScrollStore(neighborhood.id);
    const bsId = getNeighborhoodBookstore(neighborhood.id);
    const dhId = getNeighborhoodDadsHouse(neighborhood.id);
    const barId = getNeighborhoodBar(neighborhood.id);

    const destinations: LocationId[] = [
      bodegaId,
      ...temples.map(t => t.id),
      fsId,
      ...(uniId ? [uniId] : []),
      ssId,
      ...(bsId ? [bsId] : []),
      ...(dhId ? [dhId] : []),
      ...(barId ? [barId] : []),
    ].filter(id => id !== currentLoc);

    if (destinations.length === 0) continue;

    const nbLabel = document.createElement('p');
    nbLabel.className = 'neighborhood-label';
    nbLabel.textContent = neighborhood.name.toUpperCase();
    panel.appendChild(nbLabel);

    for (const destId of destinations) {
      const destData = getLocationData(destId);
      const cost = getTravelCostRaw(currentLoc, destId);
      const clock = previewClock(state.clock, cost);
      // Dad's house uses "DAD'S GRAVE" label when dad has passed.
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
