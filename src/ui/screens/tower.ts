// Wizard Tower screen — home base. Player wakes here each morning.
// Actions: travel to any neighborhood's store, sleep (end the day).
// Sprint 13: furniture panel with bong USE / recycle buttons.
// Sprint 14: spellbook panel with CAST / ADD / REMOVE.
// Redesign: INVENTORY / SPELLBOOK / FURNITURE / TRAVEL open DOS-style modals.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import {
  makeButton, makeHeader, makeDivider, makeInventoryPanel, makeStatsPanel,
  makeModal, makeTravelPanel,
} from '../components';
import { formatClock, previewClock } from '../../engine/time';
import { getBed } from '../../systems/furniture';
import { getSpellDef } from '../../data/spells';
import { canAddToBook } from '../../systems/spellbook';
import { ALL_GOD_IDS, getGod } from '../../data/gods';
import { PROJECTS, getProjectDef } from '../../data/projects';
import { getProjectProgress, isProjectComplete } from '../../systems/projects';
import { freeSlots } from '../../systems/inventory';
import { progressBar } from '../../util/format';
import { bal } from '../../data/balance-types';
import { getModal, openModal, closeModal } from '../modal';

// Sprint 15: reuse the same timestamp comparison for luck buff display.
function isLuckBuffActiveNow(state: GameState): boolean {
  const b = state.luckBuff;
  if (!b) return false;
  const toMin = (y: number, mo: number, d: number, c: number) =>
    y * 360 * 1440 + mo * 30 * 1440 + d * 1440 + c;
  return toMin(state.year, state.month, state.day, state.clock)
    < toMin(b.expiresInYear, b.expiresInMonth, b.expiresOnDay, b.expiresAtClock);
}

type Dispatch = (action: GameAction) => void;

const SCREEN = 'tower';

export function renderTower(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.replaceChildren();

  const screen = document.createElement('div');
  screen.className = 'screen tower-screen';

  // ── Location name ──
  screen.appendChild(makeHeader('WIZARD\'S TOWER'));
  screen.appendChild(makeDivider());

  // ── Location flavor ──
  const flavor = document.createElement('p');
  flavor.className = 'tower-flavor';
  flavor.textContent = 'Your dingy tower. Home sweet home.';
  screen.appendChild(flavor);

  // ── Stats (compact 2-row, no header) ──
  screen.appendChild(makeStatsPanel(state));

  // ── Section buttons ──
  const invCount = state.inventory.filter(i => i !== null).length;
  const invBtn = makeButton(
    `INVENTORY (${invCount}/${state.inventory.length})`,
    () => openModal(SCREEN, 'inventory', () => renderTower(state, container, dispatch)),
    'section-btn',
  );
  screen.appendChild(invBtn);

  const spellBtn = makeButton(
    `SPELLBOOK (${state.equippedSpells.length}/${state.bookbinding})`,
    () => openModal(SCREEN, 'spellbook', () => renderTower(state, container, dispatch)),
    'section-btn',
  );
  screen.appendChild(spellBtn);

  const furnitureMax = bal.furniture.maxSlots;
  const furnitureBtn = makeButton(
    `FURNITURE (${state.furniture.length}/${furnitureMax})`,
    () => openModal(SCREEN, 'furniture', () => renderTower(state, container, dispatch)),
    'section-btn',
  );
  screen.appendChild(furnitureBtn);

  const travelBtn = makeButton(
    'TRAVEL',
    () => openModal(SCREEN, 'travel', () => renderTower(state, container, dispatch)),
    'section-btn',
  );
  screen.appendChild(travelBtn);

  screen.appendChild(makeDivider());

  // ── Sleep ──
  const bed = getBed(state.furniture);
  if (!bed) {
    const warning = document.createElement('p');
    warning.className = 'inv-warning';
    warning.textContent = '! You need a bed to sleep !';
    screen.appendChild(warning);
  }
  const sleepBtn = makeButton(
    `SLEEP  (tomorrow: ${formatClock(600)})`,
    () => dispatch({ type: 'SLEEP' }),
    'nav-btn',
  );
  if (!bed) sleepBtn.disabled = true;
  screen.appendChild(sleepBtn);

  container.appendChild(screen);

  // ── Active modal ──
  const activeModal = getModal(SCREEN);
  if (activeModal !== null) {
    const onClose = () => closeModal(SCREEN, () => renderTower(state, container, dispatch));
    let body: HTMLElement;
    let title: string;

    if (activeModal === 'inventory') {
      title = 'INVENTORY';
      body = makeInventoryPanel(
        state.inventory,
        (slotIndex) => dispatch({ type: 'CONSUME_SNACK', slotIndex }),
        (slotIndex, godId) => dispatch({ type: 'USE_SCROLL', slotIndex, godId }),
      );
    } else if (activeModal === 'spellbook') {
      title = 'SPELLBOOK';
      body = makeSpellbookPanel(state, dispatch);
    } else if (activeModal === 'furniture') {
      title = 'FURNITURE';
      body = makeFurniturePanel(state, furnitureMax, dispatch);
    } else {
      title = 'TRAVEL';
      body = makeTravelPanel(state, dispatch);
    }

    container.appendChild(makeModal(title, body, onClose));
  }
}

// ── Spellbook Panel (Sprint 14) ──────────────────────────────────────────────

function makeSpellbookPanel(state: GameState, dispatch: Dispatch): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'spellbook-panel';

  if (state.knownSpells.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'inv-empty';
    empty.textContent = '[ no spells known ]';
    panel.appendChild(empty);
    return panel;
  }

  // Equipped spells: CAST + REMOVE buttons.
  for (const spellId of state.equippedSpells) {
    const spell = getSpellDef(spellId);
    const canCast = state.mana >= spell.manaCost;

    const row = document.createElement('div');
    row.className = 'spell-row';

    const nameEl = document.createElement('span');
    nameEl.className = 'spell-name';
    nameEl.textContent = spell.name;
    row.appendChild(nameEl);

    if (spell.category === 'affinity') {
      // Sprint 15: affinity spells need a target god. Show 10 small god buttons.
      panel.appendChild(row);  // append name row first

      const godRow = document.createElement('div');
      godRow.className = 'spell-god-row';
      for (const godId of ALL_GOD_IDS) {
        const godBtn = makeButton(getGod(godId).name.toUpperCase(), () => {
          dispatch({ type: 'CAST_SPELL', spellId, godId });
        }, 'spell-god-btn');
        if (!canCast) godBtn.disabled = true;
        godRow.appendChild(godBtn);
      }
      panel.appendChild(godRow);
    } else {
      // Sprint 15: luck spells show an ACTIVE indicator when the buff is running.
      if (spell.category === 'luck' && isLuckBuffActiveNow(state)) {
        const activeEl = document.createElement('span');
        activeEl.className = 'spell-buff-active';
        activeEl.textContent = ' \u221e ACTIVE';
        nameEl.appendChild(activeEl);
      }

      const castBtn = makeButton('[CAST]', () => {
        dispatch({ type: 'CAST_SPELL', spellId });
      }, 'spell-btn');
      if (!canCast) castBtn.disabled = true;
      row.appendChild(castBtn);

      const removeBtn = makeButton('[REMOVE]', () => {
        dispatch({ type: 'REMOVE_SPELL_FROM_BOOK', spellId });
      }, 'spell-btn');
      row.appendChild(removeBtn);

      panel.appendChild(row);
      continue;
    }

    // Affinity spells: add REMOVE on a separate row.
    const removeRow = document.createElement('div');
    removeRow.className = 'spell-row';
    const removeBtn = makeButton('[REMOVE]', () => {
      dispatch({ type: 'REMOVE_SPELL_FROM_BOOK', spellId });
    }, 'spell-btn');
    removeRow.appendChild(removeBtn);
    panel.appendChild(removeRow);
  }

  // Empty slots indicator.
  const emptySlots = state.bookbinding - state.equippedSpells.length;
  for (let i = 0; i < emptySlots; i++) {
    const el = document.createElement('p');
    el.className = 'inv-empty';
    el.textContent = '[ empty slot ]';
    panel.appendChild(el);
  }

  // Known but not equipped spells: ADD button.
  const unequipped = state.knownSpells.filter(id => !state.equippedSpells.includes(id));
  if (unequipped.length > 0) {
    panel.appendChild(makeHeader('KNOWN SPELLS'));
    for (const spellId of unequipped) {
      const spell = getSpellDef(spellId);
      const row = document.createElement('div');
      row.className = 'spell-row';

      const nameEl = document.createElement('span');
      nameEl.className = 'spell-name';
      nameEl.textContent = spell.name;
      row.appendChild(nameEl);

      const addBtn = makeButton('[ADD]', () => {
        dispatch({ type: 'ADD_SPELL_TO_BOOK', spellId });
      }, 'spell-btn');
      if (!canAddToBook(state.equippedSpells, state.bookbinding)) addBtn.disabled = true;
      row.appendChild(addBtn);

      panel.appendChild(row);
    }
  }

  return panel;
}

// ── Furniture Panel ──────────────────────────────────────────────────────────

function makeFurniturePanel(
  state: GameState,
  maxSlots: number,
  dispatch: Dispatch,
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'furniture-panel';

  panel.appendChild(makeHeader(`FURNITURE (${state.furniture.length}/${maxSlots})`));

  if (state.furniture.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'inv-empty';
    empty.textContent = '[ empty tower ]';
    panel.appendChild(empty);
    return panel;
  }

  for (let i = 0; i < state.furniture.length; i++) {
    const item = state.furniture[i];
    const row = document.createElement('div');
    row.className = 'furniture-row';

    const nameEl = document.createElement('span');
    nameEl.className = 'furniture-name';

    nameEl.textContent = item.name;
    row.appendChild(nameEl);

    // Lab Table: project panel (Sprint 20)
    if (item.type === 'lab_table') {
      panel.appendChild(row);
      panel.appendChild(makeProjectPanel(state, dispatch));
      // RECYCLE button on its own row for lab table
      const recycleRow = document.createElement('div');
      recycleRow.className = 'furniture-row';
      const recycleBtn = makeButton('[RECYCLE]', () => {
        dispatch({ type: 'RECYCLE_FURNITURE', furnitureIndex: i });
      }, 'furniture-btn');
      recycleRow.appendChild(recycleBtn);
      panel.appendChild(recycleRow);
      continue;
    }

    // Bong: USE button
    if (item.type === 'bong') {
      const useBtn = makeButton('[USE]', () => {
        dispatch({ type: 'USE_BONG', furnitureIndex: i });
      }, 'furniture-btn');
      row.appendChild(useBtn);
    }

    // Crystal Ball: reveal buttons (Sprint 19)
    if (item.type === 'crystal_ball') {
      panel.appendChild(row);
      panel.appendChild(makeCrystalBallPanel(state, dispatch));
      // RECYCLE button on its own row for crystal ball
      const recycleRow = document.createElement('div');
      recycleRow.className = 'furniture-row';
      const recycleBtn = makeButton('[RECYCLE]', () => {
        dispatch({ type: 'RECYCLE_FURNITURE', furnitureIndex: i });
      }, 'furniture-btn');
      recycleRow.appendChild(recycleBtn);
      panel.appendChild(recycleRow);
      continue;
    }

    // All items: RECYCLE button
    const recycleBtn = makeButton('[RECYCLE]', () => {
      dispatch({ type: 'RECYCLE_FURNITURE', furnitureIndex: i });
    }, 'furniture-btn');
    row.appendChild(recycleBtn);

    panel.appendChild(row);
  }

  return panel;
}

// ── Crystal Ball Panel (Sprint 19) ──────────────────────────────────────────

const CRYSTAL_BALL_REVEALS: Array<{
  revealType: 'addiction' | 'chill' | 'ageHealth';
  label: string;
  requiredSpell: string;
  spellName: string;
}> = [
  { revealType: 'chill',     label: 'True Chill',        requiredSpell: 'true_sight', spellName: 'True Sight' },
  { revealType: 'addiction',  label: 'Addiction Level',   requiredSpell: 'inner_eye',  spellName: 'Inner Eye' },
  { revealType: 'ageHealth',  label: 'Age Health Score',  requiredSpell: 'vital_scan', spellName: 'Vital Scan' },
];

function makeCrystalBallPanel(state: GameState, dispatch: Dispatch): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'crystal-ball-panel';

  const crystalBal = bal.crystalBall;
  const manaCost = crystalBal.revealManaCost;
  const hasAnySpell = CRYSTAL_BALL_REVEALS.some(r => state.knownSpells.includes(r.requiredSpell));

  if (!hasAnySpell) {
    const dark = document.createElement('p');
    dark.className = 'inv-empty';
    dark.textContent = 'The ball is dark. You lack the sight.';
    panel.appendChild(dark);
    return panel;
  }

  // Show reveal result if present.
  if (state.crystalBallReveal) {
    const resultEl = document.createElement('p');
    resultEl.className = 'crystal-reveal';
    resultEl.textContent = `\u2727 ${state.crystalBallReveal.label}: ${state.crystalBallReveal.value} \u2727`;
    panel.appendChild(resultEl);
  }

  // Show one button per known reveal spell.
  for (const reveal of CRYSTAL_BALL_REVEALS) {
    const known = state.knownSpells.includes(reveal.requiredSpell);
    if (!known) {
      const unknown = document.createElement('p');
      unknown.className = 'inv-empty';
      unknown.textContent = `??? (requires ${reveal.spellName})`;
      panel.appendChild(unknown);
      continue;
    }

    const canAfford = state.mana >= manaCost;
    const btn = makeButton(
      `[${reveal.label.toUpperCase()}]  ${manaCost} mana`,
      () => dispatch({ type: 'USE_CRYSTAL_BALL', revealType: reveal.revealType }),
      'furniture-btn',
    );
    if (!canAfford) btn.disabled = true;
    panel.appendChild(btn);
  }

  return panel;
}

// ── Project Panel (Sprint 20) ───────────────────────────────────────────────

const projectsBal = bal.projects;

function makeProjectPanel(state: GameState, dispatch: Dispatch): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'project-panel';

  const project = state.activeProject;

  // No active project: show project selection
  if (!project) {
    const prompt = document.createElement('p');
    prompt.className = 'inv-empty';
    prompt.textContent = 'Choose a project:';
    panel.appendChild(prompt);

    for (const def of PROJECTS) {
      const btn = makeButton(
        `${def.name}  (${def.description})`,
        () => dispatch({ type: 'START_PROJECT', projectId: def.id }),
        'furniture-btn',
      );
      panel.appendChild(btn);
    }

    return panel;
  }

  // Active project
  const def = getProjectDef(project.projectId);
  if (!def) return panel;

  const progress = getProjectProgress(project);
  const complete = isProjectComplete(project);

  // Project name + progress bar
  const nameEl = document.createElement('p');
  nameEl.className = 'project-name';
  nameEl.textContent = def.name;
  panel.appendChild(nameEl);

  const barEl = document.createElement('p');
  barEl.className = 'project-bar';
  barEl.textContent = `[${progressBar(progress, 1, 20)}]`;
  panel.appendChild(barEl);

  if (complete) {
    // Project is done — collect or waiting for inventory space
    const hasFreeSlot = freeSlots(state.inventory) > 0;
    if (hasFreeSlot) {
      const collectBtn = makeButton(
        `[COLLECT ${def.producesItem.name.toUpperCase()}]`,
        () => dispatch({ type: 'COLLECT_PROJECT' }),
        'furniture-btn',
      );
      panel.appendChild(collectBtn);
    } else {
      const warning = document.createElement('p');
      warning.className = 'inv-warning';
      warning.textContent = '! Inventory full — free a slot to collect !';
      panel.appendChild(warning);
    }
  } else {
    // Low chill warning
    if (state.chill < projectsBal.lowChillThreshold) {
      const warning = document.createElement('p');
      warning.className = 'inv-warning';
      warning.textContent = '! Low chill — progress will be reduced !';
      panel.appendChild(warning);
    }

    // Work buttons with duration options
    for (const dur of projectsBal.durationOptions) {
      const arrivalClock = previewClock(state.clock, dur);
      const btn = makeButton(
        `[WORK ${dur}m]  \u2192  ${formatClock(arrivalClock)}`,
        () => dispatch({ type: 'WORK_ON_PROJECT', duration: dur }),
        'furniture-btn',
      );
      panel.appendChild(btn);
    }
  }

  // Cancel button (always available while project active)
  const cancelBtn = makeButton(
    '[CANCEL PROJECT]',
    () => dispatch({ type: 'CANCEL_PROJECT' }),
    'furniture-btn',
  );
  panel.appendChild(cancelBtn);

  return panel;
}
