// Wizard Projects system — pure functions for project management.
// Sprint 20: Lab Table functionality. One active project at a time.
// Working costs chill; low chill reduces progress.

import type { GameState, InventoryItem, ProjectState } from '../state/types';
import { getProjectDef } from '../data/projects';
import { addItem, freeSlots } from './inventory';
import { applyChillLoss } from './chill';
import { bal } from '../data/balance-types';

const proj = bal.projects;

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Get progress as a 0–1 ratio. */
export function getProjectProgress(project: ProjectState): number {
  const def = getProjectDef(project.projectId);
  if (!def) return 0;
  return Math.min(1, project.progress / def.requiredProgress);
}

/** Check if a project has reached its required progress. */
export function isProjectComplete(project: ProjectState): boolean {
  const def = getProjectDef(project.projectId);
  if (!def) return false;
  return project.progress >= def.requiredProgress;
}

// ─── State Mutations ─────────────────────────────────────────────────────────

/** Start a new project. Returns updated state, or null if invalid. */
export function startProject(state: GameState, projectId: string): GameState | null {
  if (state.activeProject) return null;
  const def = getProjectDef(projectId);
  if (!def) return null;
  return {
    ...state,
    activeProject: { projectId, progress: 0 },
  };
}

/** Cancel the active project (all progress lost). */
export function cancelProject(state: GameState): GameState {
  return { ...state, activeProject: null };
}

/**
 * Process a work session of the given duration (in minutes, must be multiple of 15).
 * Each 15-min increment:
 *   1. Check current chill — if below threshold, progress multiplier is reduced
 *   2. Add progress (base * multiplier)
 *   3. Reduce chill by chillCostPerQuarter
 *   4. If project completes mid-session, stop early
 *
 * Returns updated state. If project completes and inventory has room,
 * the item is created and activeProject is cleared.
 * If inventory is full on completion, progress is capped at (required - epsilon)
 * so the player doesn't lose their work.
 */
export function workOnProject(state: GameState, durationMinutes: number): GameState {
  if (!state.activeProject) return state;
  const def = getProjectDef(state.activeProject.projectId);
  if (!def) return state;

  const quarters = Math.floor(durationMinutes / 15);
  let { progress } = state.activeProject;
  let chill = state.chill;

  for (let i = 0; i < quarters; i++) {
    // Determine progress gain for this increment
    const multiplier = chill < proj.lowChillThreshold
      ? proj.lowChillProgressMultiplier
      : 1;
    progress += proj.baseProgressPerQuarter * multiplier;

    // Reduce chill
    chill = applyChillLoss(chill, proj.chillCostPerQuarter);

    // Check completion
    if (progress >= def.requiredProgress) {
      progress = def.requiredProgress;
      break;
    }
  }

  let next: GameState = {
    ...state,
    chill,
    activeProject: { ...state.activeProject, progress },
  };

  // If project is complete, try to add item to inventory
  if (progress >= def.requiredProgress) {
    const item = createProjectItem(def);
    if (freeSlots(next.inventory) > 0) {
      const newInv = addItem(next.inventory, item);
      if (newInv) {
        next = { ...next, inventory: newInv, activeProject: null };
      }
    }
    // If inventory full, project stays complete but activeProject remains
    // so player knows they need to free a slot. UI will handle messaging.
  }

  return next;
}

/** Create the inventory item produced by a completed project. */
function createProjectItem(def: ReturnType<typeof getProjectDef>): InventoryItem {
  if (!def) throw new Error('Invalid project definition');
  const p = def.producesItem;
  if (p.type === 'potion') {
    return { type: 'potion', id: p.id, name: p.name };
  }
  return { type: 'monument', id: p.id, name: p.name, size: p.size! };
}

/** Collect the completed project item (used when player frees inventory space). */
export function collectProject(state: GameState): GameState | null {
  if (!state.activeProject) return null;
  const def = getProjectDef(state.activeProject.projectId);
  if (!def) return null;
  if (state.activeProject.progress < def.requiredProgress) return null;

  const item = createProjectItem(def);
  const newInv = addItem(state.inventory, item);
  if (!newInv) return null;

  return { ...state, inventory: newInv, activeProject: null };
}
