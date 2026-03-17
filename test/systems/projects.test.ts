import { describe, it, expect } from 'vitest';
import {
  getProjectProgress,
  isProjectComplete,
  startProject,
  cancelProject,
  workOnProject,
  collectProject,
} from '../../src/systems/projects';
import { createInitialState } from '../../src/state/initial';
import type { GameState, FurnitureItem } from '../../src/state/types';

const LAB_TABLE: FurnitureItem = { type: 'lab_table', id: 'lab_table', name: 'Lab Table', quality: 1 };

function stateWithLabTable(): GameState {
  const s = createInitialState();
  return {
    ...s,
    phase: 'playing',
    currentLocation: 'tower',
    furniture: [...s.furniture, LAB_TABLE],
    chill: 50,
  };
}

describe('getProjectProgress', () => {
  it('returns 0 for a fresh project', () => {
    expect(getProjectProgress({ projectId: 'luck_potion', progress: 0 })).toBe(0);
  });

  it('returns ratio of progress to required', () => {
    // luck_potion requires 6 progress
    expect(getProjectProgress({ projectId: 'luck_potion', progress: 3 })).toBeCloseTo(0.5);
  });

  it('caps at 1', () => {
    expect(getProjectProgress({ projectId: 'luck_potion', progress: 100 })).toBe(1);
  });
});

describe('isProjectComplete', () => {
  it('returns false when progress is below required', () => {
    expect(isProjectComplete({ projectId: 'luck_potion', progress: 5 })).toBe(false);
  });

  it('returns true when progress meets required', () => {
    expect(isProjectComplete({ projectId: 'luck_potion', progress: 6 })).toBe(true);
  });

  it('returns true when progress exceeds required', () => {
    expect(isProjectComplete({ projectId: 'luck_potion', progress: 10 })).toBe(true);
  });
});

describe('startProject', () => {
  it('starts a project when no active project', () => {
    const state = stateWithLabTable();
    const result = startProject(state, 'luck_potion');
    expect(result).not.toBeNull();
    expect(result!.activeProject).toEqual({ projectId: 'luck_potion', progress: 0 });
  });

  it('returns null when a project is already active', () => {
    const state = { ...stateWithLabTable(), activeProject: { projectId: 'luck_potion', progress: 2 } };
    expect(startProject(state, 'monument_small')).toBeNull();
  });

  it('returns null for invalid project id', () => {
    const state = stateWithLabTable();
    expect(startProject(state, 'nonexistent')).toBeNull();
  });
});

describe('cancelProject', () => {
  it('clears the active project', () => {
    const state = {
      ...stateWithLabTable(),
      activeProject: { projectId: 'luck_potion', progress: 3 },
    };
    const result = cancelProject(state);
    expect(result.activeProject).toBeNull();
  });
});

describe('workOnProject', () => {
  it('adds progress per quarter of work', () => {
    const state = {
      ...stateWithLabTable(),
      activeProject: { projectId: 'monument_large', progress: 0 },
      chill: 50, // above lowChillThreshold (30)
    };
    // Work for 60 minutes = 4 quarters → 4 * 1 base progress = 4
    const result = workOnProject(state, 60);
    expect(result.activeProject!.progress).toBe(4);
  });

  it('reduces chill during work', () => {
    const state = {
      ...stateWithLabTable(),
      activeProject: { projectId: 'monument_large', progress: 0 },
      chill: 50,
    };
    // 4 quarters at 5 chill cost each = 20 chill lost → 50 - 20 = 30
    const result = workOnProject(state, 60);
    expect(result.chill).toBe(30);
  });

  it('reduces progress when chill is low', () => {
    const state = {
      ...stateWithLabTable(),
      activeProject: { projectId: 'monument_large', progress: 0 },
      chill: 20, // below lowChillThreshold (30)
    };
    // 4 quarters but progress multiplied by 0.5 → 4 * 0.5 = 2
    const result = workOnProject(state, 60);
    expect(result.activeProject!.progress).toBe(2);
  });

  it('completes a project and adds item to inventory', () => {
    const state = {
      ...stateWithLabTable(),
      activeProject: { projectId: 'luck_potion', progress: 5 }, // needs 6 total
      chill: 50,
    };
    const result = workOnProject(state, 15); // 1 quarter → +1 progress = 6 = complete
    expect(result.activeProject).toBeNull();
    // Item should be in inventory
    const potionSlot = result.inventory.find(item => item?.type === 'potion');
    expect(potionSlot).not.toBeNull();
    expect(potionSlot!.id).toBe('luck_potion');
  });

  it('keeps project when inventory is full on completion', () => {
    const snack = { type: 'snack' as const, id: 's', name: 'S', descriptor: 'greasy' as const };
    const state = {
      ...stateWithLabTable(),
      activeProject: { projectId: 'luck_potion', progress: 5 },
      chill: 50,
      inventory: [snack, snack, snack, snack, snack],
    };
    const result = workOnProject(state, 15);
    // Project stays active (completed but not collected)
    expect(result.activeProject).not.toBeNull();
    expect(result.activeProject!.progress).toBe(6);
  });

  it('returns state unchanged when no active project', () => {
    const state = stateWithLabTable();
    const result = workOnProject(state, 30);
    expect(result).toEqual(state);
  });

  it('creates monument item with correct size', () => {
    const state = {
      ...stateWithLabTable(),
      activeProject: { projectId: 'monument_small', progress: 9 }, // needs 10
      chill: 50,
    };
    const result = workOnProject(state, 15);
    expect(result.activeProject).toBeNull();
    const monumentSlot = result.inventory.find(item => item?.type === 'monument');
    expect(monumentSlot).not.toBeNull();
    expect((monumentSlot as any).size).toBe('small');
  });
});

describe('collectProject', () => {
  it('collects a completed project item', () => {
    const state = {
      ...stateWithLabTable(),
      activeProject: { projectId: 'luck_potion', progress: 6 },
    };
    const result = collectProject(state);
    expect(result).not.toBeNull();
    expect(result!.activeProject).toBeNull();
    const potionSlot = result!.inventory.find(item => item?.type === 'potion');
    expect(potionSlot).not.toBeNull();
  });

  it('returns null when inventory is full', () => {
    const snack = { type: 'snack' as const, id: 's', name: 'S', descriptor: 'greasy' as const };
    const state = {
      ...stateWithLabTable(),
      activeProject: { projectId: 'luck_potion', progress: 6 },
      inventory: [snack, snack, snack, snack, snack],
    };
    expect(collectProject(state)).toBeNull();
  });

  it('returns null when project is not complete', () => {
    const state = {
      ...stateWithLabTable(),
      activeProject: { projectId: 'luck_potion', progress: 3 },
    };
    expect(collectProject(state)).toBeNull();
  });

  it('returns null when no active project', () => {
    const state = stateWithLabTable();
    expect(collectProject(state)).toBeNull();
  });
});
