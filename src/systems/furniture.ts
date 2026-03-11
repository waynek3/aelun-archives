// Furniture system — pure functions for furniture slot management.
// Sprint 13: Bed, Lab Table, Bong.

import type { FurnitureItem } from '../state/types';

// Returns true if there's at least one free furniture slot.
export function hasFurnitureSlot(furniture: FurnitureItem[], maxSlots: number): boolean {
  return furniture.length < maxSlots;
}

// Add a furniture item. Returns new array, or null if full.
export function addFurniture(
  furniture: FurnitureItem[],
  item: FurnitureItem,
  maxSlots: number,
): FurnitureItem[] | null {
  if (furniture.length >= maxSlots) return null;
  return [...furniture, item];
}

// Remove furniture at the given index. Returns new array.
export function removeFurniture(furniture: FurnitureItem[], index: number): FurnitureItem[] {
  if (index < 0 || index >= furniture.length) return furniture;
  return furniture.filter((_, i) => i !== index);
}

// Returns the best bed (highest quality), or null if none installed.
export function getBed(furniture: FurnitureItem[]): FurnitureItem | null {
  let best: FurnitureItem | null = null;
  for (const item of furniture) {
    if (item.type === 'bed') {
      if (!best || item.quality > best.quality) best = item;
    }
  }
  return best;
}

// Returns the index of the first bong, or -1 if none.
export function findBong(furniture: FurnitureItem[]): number {
  return furniture.findIndex(f => f.type === 'bong');
}

// Returns true if a lab table is installed.
export function hasLabTable(furniture: FurnitureItem[]): boolean {
  return furniture.some(f => f.type === 'lab_table');
}

// Replace existing bed(s) with a new bed. Used when buying a bed upgrade.
export function replaceBed(furniture: FurnitureItem[], newBed: FurnitureItem): FurnitureItem[] {
  return [...furniture.filter(f => f.type !== 'bed'), newBed];
}
