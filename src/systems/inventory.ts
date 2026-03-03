// Inventory system — pure functions for slot management.
// Sprint 7: 5-slot inventory for snacks. Future sprints add potions, scrolls.

import type { InventoryItem } from '../state/types';

const MAX_SLOTS = 5;

// Count occupied slots.
export function inventoryCount(inventory: (InventoryItem | null)[]): number {
  return inventory.filter(item => item !== null).length;
}

// Count empty slots.
export function freeSlots(inventory: (InventoryItem | null)[]): number {
  return MAX_SLOTS - inventoryCount(inventory);
}

// Check if N items can fit.
export function canFitItems(inventory: (InventoryItem | null)[], count: number): boolean {
  return freeSlots(inventory) >= count;
}

// Add one item to the first empty slot. Returns new array, or null if full.
export function addItem(
  inventory: (InventoryItem | null)[],
  item: InventoryItem,
): (InventoryItem | null)[] | null {
  const idx = inventory.indexOf(null);
  if (idx === -1) return null;
  const next = [...inventory];
  next[idx] = item;
  return next;
}

// Remove item at slot index. Returns new array with that slot set to null.
export function removeItem(
  inventory: (InventoryItem | null)[],
  slotIndex: number,
): (InventoryItem | null)[] {
  if (slotIndex < 0 || slotIndex >= inventory.length) return inventory;
  const next = [...inventory];
  next[slotIndex] = null;
  return next;
}

// Add multiple items. Returns new array, or null if not enough room.
export function addMultipleItems(
  inventory: (InventoryItem | null)[],
  items: InventoryItem[],
): (InventoryItem | null)[] | null {
  if (!canFitItems(inventory, items.length)) return null;
  const next = [...inventory];
  for (const item of items) {
    const idx = next.indexOf(null);
    if (idx === -1) return null;
    next[idx] = item;
  }
  return next;
}
