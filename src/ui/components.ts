// Reusable DOM component builders.
// All return HTMLElement instances; no innerHTML string injection.

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
