// Snack/food item definitions for Sprint 7.
// Each snack has a quality descriptor that implies its chill restore amount.
// Actual chill restore values live in balance.json, keyed by descriptor.

import type { FoodDescriptor } from '../state/types';

export interface SnackDefinition {
  id: string;
  name: string;
  descriptor: FoodDescriptor;
  cost: number;  // purchase price in dollars
}

export const SNACKS: SnackDefinition[] = [
  // Greasy — high chill
  { id: 'gas_station_burrito', name: 'Greasy Burrito',    descriptor: 'greasy', cost: 2 },
  { id: 'greasy_slice',       name: 'Greasy Slice',       descriptor: 'greasy', cost: 3 },
  // Salty — high chill
  { id: 'bag_o_chips',        name: 'Salty Chips',         descriptor: 'salty',  cost: 1 },
  { id: 'pretzel_rod',        name: 'Salty Pretzel',       descriptor: 'salty',  cost: 2 },
  // Sugary — high chill
  { id: 'mystery_candy',      name: 'Sugary Candy',        descriptor: 'sugary', cost: 1 },
  { id: 'frosted_doughnut',   name: 'Sugary Doughnut',     descriptor: 'sugary', cost: 2 },
  // Bland — low chill
  { id: 'plain_crackers',     name: 'Bland Crackers',      descriptor: 'bland',  cost: 1 },
  { id: 'rice_cake',          name: 'Bland Rice Cake',     descriptor: 'bland',  cost: 1 },
  // Healthy — low chill
  { id: 'banana',             name: 'Healthy Banana',      descriptor: 'healthy', cost: 2 },
  { id: 'trail_mix',          name: 'Healthy Trail Mix',   descriptor: 'healthy', cost: 3 },
  // Gourmet — high chill, expensive
  { id: 'artisan_sandwich',   name: 'Gourmet Sandwich',    descriptor: 'gourmet', cost: 8 },
  { id: 'fancy_cheese',       name: 'Gourmet Cheese',      descriptor: 'gourmet', cost: 10 },
];

export function getSnack(id: string): SnackDefinition {
  const s = SNACKS.find(s => s.id === id);
  if (!s) throw new Error(`Unknown snack: ${id}`);
  return s;
}
