// Reusable DOM component builders.
// All return HTMLElement instances; no innerHTML string injection.

import type { GameState, InventoryItem, GodId } from '../state/types';
import { progressBar } from '../util/format';
import balance from '../data/balance.json';
import { getSpellDef } from '../data/spells';
import { ALL_GOD_IDS, getGod } from '../data/gods';

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

// ── Inventory panel ──────────────────────────────────────────────────────
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
    } else {
      const el = document.createElement('p');
      el.className = 'inv-empty';
      el.textContent = '[ empty ]';
      panel.appendChild(el);
    }
  }

  return panel;
}

// ── Stats panel ──────────────────────────────────────────────────────────
// Reusable panel showing player stats as progress bars (no numeric values).

export function makeStatsPanel(state: GameState): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'stats-panel';

  panel.appendChild(makeHeader('STATS'));

  const dm = balance.stats.displayMax;
  const stats: Array<{ label: string; value: number; max: number }> = [
    { label: 'INT ', value: state.intelligence,      max: dm.intelligence },
    { label: 'BIND', value: state.bookbinding,       max: dm.bookbinding },
    { label: 'FAME', value: state.wizardFame,        max: dm.wizardFame },
    { label: 'RELX', value: state.relaxationRate,    max: dm.relaxationRate },
    { label: 'REST', value: state.restingRelaxation, max: dm.restingRelaxation },
  ];

  for (const s of stats) {
    const row = document.createElement('p');
    row.className = 'stat-row';
    row.textContent = `${s.label} ${progressBar(s.value, s.max, 20)}`;
    panel.appendChild(row);
  }

  return panel;
}
