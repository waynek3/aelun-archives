// God definitions and opposition circle.
// Central source of truth for all god IDs, names, elements, forms, and strong months.

import type { GodId, ElementId } from '../state/types';

export interface GodData {
  id: GodId;
  name: string;
  form: string;
  element: ElementId;
  strongMonths: number[];  // 1–12
}

export const GODS: Record<GodId, GodData> = {
  mesin:   { id: 'mesin',   name: 'Mesin',   element: 'life',  form: 'Animating Energy',       strongMonths: [3, 6] },
  gul:     { id: 'gul',     name: 'Gul',     element: 'death', form: 'Hooded Figure of Death', strongMonths: [9, 12] },
  klossa:  { id: 'klossa',  name: 'Klossa',  element: 'earth', form: 'Female Gnome',           strongMonths: [2] },
  skarhol: { id: 'skarhol', name: 'Skarhol', element: 'earth', form: 'Male Dwarf',             strongMonths: [8] },
  marena:  { id: 'marena',  name: 'Marena',  element: 'water', form: 'Female Mermaid',         strongMonths: [1] },
  azorius: { id: 'azorius', name: 'Azorius', element: 'water', form: 'Male Human',             strongMonths: [7] },
  ara:     { id: 'ara',     name: 'Ara',     element: 'air',   form: 'Female Elf',             strongMonths: [4] },
  finhorn: { id: 'finhorn', name: 'Finhorn', element: 'air',   form: 'Male Halfling',          strongMonths: [10] },
  beroan:  { id: 'beroan',  name: 'Beroan',  element: 'fire',  form: 'Male Dragon',            strongMonths: [5] },
  sofiel:  { id: 'sofiel',  name: 'Sofiel',  element: 'fire',  form: 'Female Human',           strongMonths: [11] },
};

// Opposition circle: each god opposes exactly one other god.
export const OPPOSITION: Record<GodId, GodId> = {
  mesin: 'gul',      gul: 'mesin',
  klossa: 'sofiel',  sofiel: 'klossa',
  marena: 'finhorn', finhorn: 'marena',
  ara: 'azorius',    azorius: 'ara',
  beroan: 'skarhol', skarhol: 'beroan',
};

export const ALL_GOD_IDS: GodId[] = [
  'mesin', 'gul', 'klossa', 'skarhol', 'marena',
  'azorius', 'ara', 'finhorn', 'beroan', 'sofiel',
];

export function getOpposedGod(godId: GodId): GodId {
  return OPPOSITION[godId];
}

export function getGod(godId: GodId): GodData {
  return GODS[godId];
}
