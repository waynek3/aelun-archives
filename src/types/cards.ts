export interface CardFailureTier {
  tier: number;
  requiresFailures: number;
  maxUnlocks: number;
  pool: string[];
}

export type ActionType = "Targeted" | "Untargeted";

export interface ActionCard {
  id: string;
  name: string;
  description: string;
  actionType: ActionType;
  tags: string[];
  timescales: string[];
  diceModifier?: string; // e.g. "+1d4"
  failureField: CardFailureTier[];
}

export interface OutcomeRule {
  condition: string; // e.g., "roll > 10"
  outcome: string; // e.g., "deal_damage"
  parameters: unknown;
}

export interface OutcomeTable {
  [actionId: string]: OutcomeRule[];
}

export interface PredicateCard {
  id: string;
  name: string;
  description: string;
  sceneTags: string[];
  timescale: string; // One of constants TIMESCALES
  outcomeLogic: OutcomeTable;
  stateFlags: Record<string, unknown>;
  exits: string[]; // IDs of connected predicate cards
}