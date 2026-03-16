// Sprint 20: Wizard Project definitions
// Projects are crafted at the Lab Table in the Wizard Tower.
// One active project at a time; canceling loses all progress.
// Completed projects produce inventory items.

import balance from './balance.json';

export type ProjectId =
  | 'longevity_potion'
  | 'luck_potion'
  | 'monument_small'
  | 'monument_medium'
  | 'monument_large';

export interface ProjectDef {
  id: ProjectId;
  name: string;
  description: string;
  requiredProgress: number;
  producesItem: {
    type: 'potion' | 'monument';
    id: string;
    name: string;
    size?: 'small' | 'medium' | 'large';
  };
}

const defs = (balance as any).projects.definitions;

export const PROJECTS: ProjectDef[] = [
  {
    id: 'longevity_potion',
    name: 'Longevity Potion',
    description: 'Suspends the ravages of time',
    requiredProgress: defs.longevity_potion.requiredProgress,
    producesItem: { type: 'potion', id: 'longevity_potion', name: 'Longevity Potion' },
  },
  {
    id: 'luck_potion',
    name: 'Luck Potion',
    description: 'Improves scratcher odds temporarily',
    requiredProgress: defs.luck_potion.requiredProgress,
    producesItem: { type: 'potion', id: 'luck_potion', name: 'Luck Potion' },
  },
  {
    id: 'monument_small',
    name: 'Small Monument',
    description: 'A modest offering for the gods',
    requiredProgress: defs.monument_small.requiredProgress,
    producesItem: { type: 'monument', id: 'monument_small', name: 'Small Monument', size: 'small' },
  },
  {
    id: 'monument_medium',
    name: 'Medium Monument',
    description: 'A respectable tribute',
    requiredProgress: defs.monument_medium.requiredProgress,
    producesItem: { type: 'monument', id: 'monument_medium', name: 'Medium Monument', size: 'medium' },
  },
  {
    id: 'monument_large',
    name: 'Large Monument',
    description: 'A grand devotion in stone',
    requiredProgress: defs.monument_large.requiredProgress,
    producesItem: { type: 'monument', id: 'monument_large', name: 'Large Monument', size: 'large' },
  },
];

export function getProjectDef(id: string): ProjectDef | undefined {
  return PROJECTS.find(p => p.id === id);
}
