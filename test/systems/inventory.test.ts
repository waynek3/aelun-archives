import { describe, it, expect } from 'vitest';
import {
  inventoryCount,
  freeSlots,
  canFitItems,
  addItem,
  removeItem,
  addMultipleItems,
} from '../../src/systems/inventory';
import type { InventoryItem } from '../../src/state/types';

const EMPTY: (InventoryItem | null)[] = [null, null, null, null, null];

function makeSnack(id: string): InventoryItem {
  return { type: 'snack', id, name: `Test ${id}`, descriptor: 'greasy' };
}

describe('inventoryCount', () => {
  it('returns 0 for empty inventory', () => {
    expect(inventoryCount(EMPTY)).toBe(0);
  });

  it('counts occupied slots', () => {
    const inv = [makeSnack('a'), null, makeSnack('b'), null, null];
    expect(inventoryCount(inv)).toBe(2);
  });

  it('returns 5 for full inventory', () => {
    const inv = [makeSnack('a'), makeSnack('b'), makeSnack('c'), makeSnack('d'), makeSnack('e')];
    expect(inventoryCount(inv)).toBe(5);
  });
});

describe('freeSlots', () => {
  it('returns 5 for empty inventory', () => {
    expect(freeSlots(EMPTY)).toBe(5);
  });

  it('returns correct free count', () => {
    const inv = [makeSnack('a'), null, null, makeSnack('b'), null];
    expect(freeSlots(inv)).toBe(3);
  });

  it('returns 0 for full inventory', () => {
    const inv = [makeSnack('a'), makeSnack('b'), makeSnack('c'), makeSnack('d'), makeSnack('e')];
    expect(freeSlots(inv)).toBe(0);
  });
});

describe('canFitItems', () => {
  it('returns true when enough slots', () => {
    expect(canFitItems(EMPTY, 3)).toBe(true);
  });

  it('returns true when exactly enough slots', () => {
    expect(canFitItems(EMPTY, 5)).toBe(true);
  });

  it('returns false when not enough slots', () => {
    expect(canFitItems(EMPTY, 6)).toBe(false);
  });

  it('accounts for occupied slots', () => {
    const inv = [makeSnack('a'), makeSnack('b'), null, null, null];
    expect(canFitItems(inv, 3)).toBe(true);
    expect(canFitItems(inv, 4)).toBe(false);
  });
});

describe('addItem', () => {
  it('adds to first empty slot', () => {
    const item = makeSnack('x');
    const result = addItem(EMPTY, item);
    expect(result).not.toBeNull();
    expect(result![0]).toEqual(item);
    expect(result![1]).toBeNull();
  });

  it('fills gaps', () => {
    const inv = [makeSnack('a'), null, makeSnack('b'), null, null];
    const item = makeSnack('x');
    const result = addItem(inv, item);
    expect(result![1]).toEqual(item);
  });

  it('returns null when full', () => {
    const full = [makeSnack('a'), makeSnack('b'), makeSnack('c'), makeSnack('d'), makeSnack('e')];
    expect(addItem(full, makeSnack('x'))).toBeNull();
  });

  it('does not mutate original', () => {
    const inv = [...EMPTY];
    addItem(inv, makeSnack('x'));
    expect(inv).toEqual(EMPTY);
  });
});

describe('removeItem', () => {
  it('clears the slot', () => {
    const inv = [makeSnack('a'), makeSnack('b'), null, null, null];
    const result = removeItem(inv, 0);
    expect(result[0]).toBeNull();
    expect(result[1]).toEqual(inv[1]);
  });

  it('returns unchanged for invalid index', () => {
    const inv = [makeSnack('a'), null, null, null, null];
    expect(removeItem(inv, -1)).toEqual(inv);
    expect(removeItem(inv, 5)).toEqual(inv);
  });

  it('does not mutate original', () => {
    const item = makeSnack('a');
    const inv = [item, null, null, null, null];
    removeItem(inv, 0);
    expect(inv[0]).toEqual(item);
  });
});

describe('addMultipleItems', () => {
  it('adds all items when space available', () => {
    const items = [makeSnack('a'), makeSnack('b'), makeSnack('c')];
    const result = addMultipleItems(EMPTY, items);
    expect(result).not.toBeNull();
    expect(inventoryCount(result!)).toBe(3);
  });

  it('returns null when not enough space', () => {
    const inv = [makeSnack('a'), makeSnack('b'), makeSnack('c'), null, null];
    const items = [makeSnack('d'), makeSnack('e'), makeSnack('f')];
    expect(addMultipleItems(inv, items)).toBeNull();
  });

  it('fills exactly all slots', () => {
    const items = [makeSnack('a'), makeSnack('b'), makeSnack('c'), makeSnack('d'), makeSnack('e')];
    const result = addMultipleItems(EMPTY, items);
    expect(result).not.toBeNull();
    expect(freeSlots(result!)).toBe(0);
  });
});
