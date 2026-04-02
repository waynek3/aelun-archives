// Snack/food item definitions for Sprint 7.
// Each snack has a quality descriptor that implies its chill restore amount.
// Actual chill restore values live in balance.json, keyed by descriptor.
// To add or tune snacks, edit food.json — no code changes needed.

import type { FoodDescriptor } from '../state/types';
import rawFood from './food.json';

export interface SnackDefinition {
  id: string;
  name: string;
  descriptor: FoodDescriptor;
  cost: number;  // purchase price in dollars
}

export const SNACKS: SnackDefinition[] = rawFood as SnackDefinition[];

export function getSnack(id: string): SnackDefinition {
  const s = SNACKS.find(s => s.id === id);
  if (!s) throw new Error(`Unknown snack: ${id}`);
  return s;
}
