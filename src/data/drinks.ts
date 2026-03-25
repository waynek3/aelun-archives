// Drink definitions for the University Bar (Sprint 25).
// Values sourced from balance.json — never hardcode gameplay numbers here.

import { bal } from './balance-types';

export interface DrinkDefinition {
  id: string;
  name: string;
  cost: number;
  timeMinutes: number;   // clock advance; already a :15 increment
  chillRestore: number;
  manaReduction: number;
}

const barBal = bal.bar;

export const DRINKS: DrinkDefinition[] = [
  {
    id: 'draft_beer',
    name: 'DRAFT BEER',
    ...barBal.drinks.draft_beer,
  },
  {
    id: 'house_wine',
    name: 'HOUSE WINE',
    ...barBal.drinks.house_wine,
  },
  {
    id: 'wizards_brew',
    name: "WIZARD'S BREW",
    ...barBal.drinks.wizards_brew,
  },
  {
    id: 'the_special',
    name: 'THE SPECIAL',
    ...barBal.drinks.the_special,
  },
];

export function getDrink(id: string): DrinkDefinition {
  const drink = DRINKS.find(d => d.id === id);
  if (!drink) throw new Error(`Unknown drink: ${id}`);
  return drink;
}
