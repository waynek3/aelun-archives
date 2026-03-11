// Furniture catalog — static definitions for all purchasable furniture items.
// Sprint 13: Bed (3 tiers), Lab Table (placeholder), Bong.

import type { FurnitureType } from '../state/types';
import balance from './balance.json';

export interface FurnitureDef {
  id: string;
  type: FurnitureType;
  name: string;
  cost: number;
  quality: number;
}

const furnitureBalance = balance.furniture as {
  beds: Record<string, { cost: number; sleepMana: number; sleepChill: number }>;
  lab_table: { cost: number };
  bong: { cost: number; breakChance: number };
};

export const FURNITURE_CATALOG: FurnitureDef[] = [
  { id: 'bed_basic',    type: 'bed',       name: 'Dusty Mattress', cost: furnitureBalance.beds.bed_basic.cost,    quality: 1 },
  { id: 'bed_standard', type: 'bed',       name: 'Decent Bed',     cost: furnitureBalance.beds.bed_standard.cost, quality: 2 },
  { id: 'bed_deluxe',   type: 'bed',       name: 'Luxury Bed',     cost: furnitureBalance.beds.bed_deluxe.cost,   quality: 3 },
  { id: 'lab_table',    type: 'lab_table', name: 'Lab Table',      cost: furnitureBalance.lab_table.cost,         quality: 1 },
  { id: 'bong',         type: 'bong',      name: 'Glass Bong',     cost: furnitureBalance.bong.cost,              quality: 1 },
];

export function getFurnitureDef(id: string): FurnitureDef {
  const def = FURNITURE_CATALOG.find(f => f.id === id);
  if (!def) throw new Error(`Unknown furniture: ${id}`);
  return def;
}

// Returns mana and chill restore amounts for a bed by its ID.
export function getBedSleepRestore(bedId: string): { sleepMana: number; sleepChill: number } {
  const entry = furnitureBalance.beds[bedId];
  if (!entry) throw new Error(`Unknown bed: ${bedId}`);
  return { sleepMana: entry.sleepMana, sleepChill: entry.sleepChill };
}
