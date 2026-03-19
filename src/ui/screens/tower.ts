// Wizard Tower screen — home base. Player wakes here each morning.
// Actions: travel to any neighborhood's store, sleep (end the day).
// Sprint 13: furniture panel with bong USE / recycle buttons.
// Sprint 14: spellbook panel with CAST / ADD / REMOVE.

import type { GameState } from '../../state/types';
import type { GameAction } from '../../engine/actions';
import { makeButton, makeHeader, makeDivider, makeInventoryPanel, makeStatsPanel } from '../components';
import { formatClock, previewClock } from '../../engine/time';
import { getTravelCostRaw } from '../../systems/travel';
import {
  NEIGHBORHOODS,
  getNeighborhoodBodega,
  getNeighborhoodTemples,
  getNeighborhoodFurnitureStore,
  getNeighborhoodUniversity,
  getNeighborhoodScrollStore,
  getNeighborhoodBookstore,
  getNeighborhoodDadsHouse,
  getLocationData,
} from '../../data/locations';
import { getBed } from '../../systems/furniture';
import { getSpellDef } from '../../data/spells';
import { canAddToBook } from '../../systems/spellbook';
import { ALL_GOD_IDS, getGod } from '../../data/gods';
import { PROJECTS, getProjectDef } from '../../data/projects';
import { getProjectProgress, isProjectComplete } from '../../systems/projects';
import { freeSlots } from '../../systems/inventory';
import { progressBar } from '../../util/format';
import balance from '../../data/balance.json';

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

export function renderTower(state: GameState, container: HTMLElement, dispatch: Dispatch): void {
  container.innerHTML = '';

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

  // ── Stats (Sprint 8) ──
  screen.appendChild(makeStatsPanel(state));

  // ── Inventory (Sprint 7) ──
  screen.appendChild(
    makeInventoryPanel(
      state.inventory,
      (slotIndex) => dispatch({ type: 'CONSUME_SNACK', slotIndex }),
      (slotIndex, godId) => dispatch({ type: 'USE_SCROLL', slotIndex, godId }),
    ),
  );

  // ── Spellbook (Sprint 14) ──
  screen.appendChild(makeSpellbookPanel(state, dispatch));

  // ── Furniture (Sprint 13) ──
  const furnitureMax = (balance.furniture as { maxSlots: number }).maxSlots;
  screen.appendChild(makeFurniturePanel(state, furnitureMax, dispatch));

  screen.appendChild(makeDivider());

  // ── Travel destinations ──
  // One section per neighborhood; each shows the neighborhood name and its bodega.
  screen.appendChild(makeHeader('TRAVEL'));

  for (const neighborhood of NEIGHBORHOODS) {
    // Neighborhood label
    const nbLabel = document.createElement('p');
    nbLabel.className = 'neighborhood-label';
    nbLabel.textContent = neighborhood.name.toUpperCase();
    screen.appendChild(nbLabel);

    const destId = getNeighborhoodBodega(neighborhood.id);
    const destData = getLocationData(destId);
    const travelCost = getTravelCostRaw('tower', destId);
    const arrivalClock = previewClock(state.clock, travelCost);

    const travelBtn = makeButton(
      `${destData.displayName}  \u2192  ${formatClock(arrivalClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: destId }),
      'nav-btn',
    );
    screen.appendChild(travelBtn);

    // Sprint 9: temples in this neighborhood
    const temples = getNeighborhoodTemples(neighborhood.id);
    for (const temple of temples) {
      const templeCost = getTravelCostRaw('tower', temple.id);
      const templeClock = previewClock(state.clock, templeCost);
      screen.appendChild(makeButton(
        `${temple.displayName}  \u2192  ${formatClock(templeClock)}`,
        () => dispatch({ type: 'TRAVEL', destination: temple.id }),
        'nav-btn',
      ));
    }

    // Sprint 13: furniture store in this neighborhood
    const furnitureStoreId = getNeighborhoodFurnitureStore(neighborhood.id);
    const furnitureStoreData = getLocationData(furnitureStoreId);
    const fsCost = getTravelCostRaw('tower', furnitureStoreId);
    const fsClock = previewClock(state.clock, fsCost);
    screen.appendChild(makeButton(
      `${furnitureStoreData.displayName}  \u2192  ${formatClock(fsClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: furnitureStoreId }),
      'nav-btn',
    ));

    // Sprint 14: university in this neighborhood (only university_heights has one)
    const uniId = getNeighborhoodUniversity(neighborhood.id);
    if (uniId) {
      const uniData = getLocationData(uniId);
      const uniCost = getTravelCostRaw('tower', uniId);
      const uniClock = previewClock(state.clock, uniCost);
      screen.appendChild(makeButton(
        `${uniData.displayName}  \u2192  ${formatClock(uniClock)}`,
        () => dispatch({ type: 'TRAVEL', destination: uniId }),
        'nav-btn',
      ));
    }

    // Sprint 16: scroll store in this neighborhood
    const ssId = getNeighborhoodScrollStore(neighborhood.id);
    const ssData = getLocationData(ssId);
    const ssCost = getTravelCostRaw('tower', ssId);
    const ssClock = previewClock(state.clock, ssCost);
    screen.appendChild(makeButton(
      `${ssData.displayName}  \u2192  ${formatClock(ssClock)}`,
      () => dispatch({ type: 'TRAVEL', destination: ssId }),
      'nav-btn',
    ));

    // Sprint 16: university bookstore (only university_heights has one)
    const bsId = getNeighborhoodBookstore(neighborhood.id);
    if (bsId) {
      const bsData = getLocationData(bsId);
      const bsCost = getTravelCostRaw('tower', bsId);
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
      const dhCost = getTravelCostRaw('tower', dhId);
      const dhClock = previewClock(state.clock, dhCost);
      const dhLabel = state.dadAlive ? dhData.displayName : "DAD'S GRAVE";
      screen.appendChild(makeButton(
        `${dhLabel}  \u2192  ${formatClock(dhClock)}`,
        () => dispatch({ type: 'TRAVEL', destination: dhId }),
        'nav-btn',
      ));
    }
  }

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

  // ── Theme toggle ──
  screen.appendChild(makeDivider());
  const themeRow = document.createElement('div');
  themeRow.className = 'theme-row';
  const themes: Array<{ scheme: GameState['colorScheme']; label: string }> = [
    { scheme: 'blue', label: 'BLU' },
    { scheme: 'green', label: 'GRN' },
    { scheme: 'orange', label: 'AMB' },
  ];
  for (const { scheme, label } of themes) {
    const btn = makeButton(label, () => dispatch({ type: 'SET_THEME', scheme }), 'theme-btn');
    if (state.colorScheme === scheme) btn.classList.add('active');
    themeRow.appendChild(btn);
  }
  screen.appendChild(themeRow);

  container.appendChild(screen);
}

// ── Spellbook Panel (Sprint 14) ──────────────────────────────────────────────

function makeSpellbookPanel(state: GameState, dispatch: Dispatch): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'spellbook-panel';

  panel.appendChild(makeHeader(`SPELLBOOK (${state.equippedSpells.length}/${state.bookbinding})`));

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

  const crystalBal = (balance as Record<string, unknown>).crystalBall as { revealManaCost: number };
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

const projectsBal = (balance as any).projects as {
  durationOptions: number[];
  lowChillThreshold: number;
};

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
