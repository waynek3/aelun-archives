// Reusable DOM component builders.
// All return HTMLElement instances; no innerHTML string injection.

import type { InventoryItem } from '../state/types';

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
// Reusable panel showing current inventory with EAT buttons for snacks.

export function makeInventoryPanel(
  inventory: (InventoryItem | null)[],
  onConsume: (slotIndex: number) => void,
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
    } else {
      const el = document.createElement('p');
      el.className = 'inv-empty';
      el.textContent = '[ empty ]';
      panel.appendChild(el);
    }
  }

  return panel;
}
