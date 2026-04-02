// God definitions and opposition circle.
// Central source of truth for all god IDs, names, elements, forms, and strong months.
// To add or tune gods, edit gods.json — no code changes needed.

import type { GodId, ElementId } from '../state/types';
import rawGods from './gods.json';

export interface GodData {
  id: GodId;
  name: string;
  form: string;
  element: ElementId;
  strongMonths: number[];  // 1–12
}

const godsArray = rawGods.gods as GodData[];

export const GODS: Record<GodId, GodData> = Object.fromEntries(
  godsArray.map(g => [g.id, g]),
) as Record<GodId, GodData>;

// Opposition circle: each god opposes exactly one other god.
export const OPPOSITION: Record<GodId, GodId> = rawGods.opposition as Record<GodId, GodId>;

export const ALL_GOD_IDS: GodId[] = rawGods.allIds as GodId[];

export function getOpposedGod(godId: GodId): GodId {
  return OPPOSITION[godId];
}

export function getGod(godId: GodId): GodData {
  return GODS[godId];
}
