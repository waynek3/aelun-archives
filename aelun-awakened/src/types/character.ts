export interface Stats {
  strength: number;
  agility: number;
  insight: number;
  charisma: number;
  fortitude: number;
  will: number;
}

export type TraitType = "Passive" | "Triggered";

export interface Trait {
  id: string;
  name: string;
  type: TraitType;
  effect: string;
}

export interface LifepathChoice {
  id: string;
  name: string;
  description: string;
}

export interface WorldState {
  location: string; // predicate id
  flags: Record<string, unknown>;
  time: {
    timescale: string;
    turnCount: number;
  };
}

export interface Character {
  id: string;
  name: string;
  lifepath: LifepathChoice[];
  stats: Stats;
  traits: Trait[];
  actionDeck: string[]; // ActionCard ids
  currentHP: number;
  maxHP: number;
  affinities: Record<string, number>;
  worldState: WorldState;
  createdAt: number;
  turnCount: number;
}