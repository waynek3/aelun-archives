import type { ActionCard, PredicateCard } from './cards';
import type { Character } from './character';

export type TurnPhase =
  | 'scene_display'
  | 'action_selection'
  | 'target_selection'
  | 'dice_assembly'
  | 'dice_roll'
  | 'outcome_resolution';

export interface Die {
  faces: number; // 4, 6, 8, 10, 12, 20
  source: string; // e.g., "Strength", "Trait: Devout"
}

export interface DicePool {
  advantageDice: number; // number of d20s
  bonusDice: Die[];
}

export interface OutcomeEffect {
  type: string;
  [key: string]: unknown;
}

export interface Outcome {
  text: string;
  effects: OutcomeEffect[];
  stateChanges: Record<string, unknown>;
  success: boolean;
}

export interface TargetSelection {
  actionId: string;
  availableTargets: PredicateCard[];
  selectedTarget?: PredicateCard;
  /**
   * Maximum number of duplicate cards that can be committed for advantage dice.
   */
  maxDuplicates?: number;
}

export interface GameState {
  character: Character | null;
  currentPredicate: PredicateCard | null;
  activeTimescale: string;
  turnPhase: TurnPhase;
  availableActions: ActionCard[];
  dicePool: DicePool;
  recentOutcome: Outcome | null;
  targetSelection: TargetSelection | null;
}