/**
 * Predicate Engine Types
 * Shared types used across predicate engine modules
 */

export interface Outcome {
  text: string;
  effects: OutcomeEffect[];
  stateChanges: Record<string, unknown>;
  success: boolean;
  criticalSuccess?: boolean;
  criticalFailure?: boolean;
}

export interface OutcomeEffect {
  type: 'damage' | 'heal' | 'gain' | 'lose' | 'affinity' | 'unlock' | 'flag' | 'transition' | 'discover' | 'learn' | 'transform' | 'curse' | 'bless' | 'bond' | 'rivalry' | 'quest' | 'memory' | 'insight' | 'corruption' | 'purification';
  value?: number;
  resource?: string;
  entity?: string;
  category?: string;
  id?: string;
  location?: string;
  flag?: string;
  flagValue?: unknown;
  text?: string;
  duration?: number;
  permanent?: boolean;
}

// Parameter types for different outcome executors
export interface DamageParams {
  dice?: string;
  amount?: number;
  target?: string;
}

export interface ResourceParams {
  resource: string;
  amount: number;
}

export interface RestoreParams {
  resource: string;
  amount: number;
}

export interface AffinityParams {
  entity: string;
  change: number;
}

export interface LocationParams {
  location: string;
}

export interface TextParams {
  text: string;
}

export interface DiscoverParams {
  category: string;
  id: string;
}

export interface LearnParams {
  skill: string;
  level: number;
}

export interface TransformParams {
  type: string;
  target: string;
}

export interface CurseParams {
  name: string;
  duration: number;
  effect: string;
}

export interface BlessParams {
  name: string;
  duration: number;
  effect: string;
}

export interface BondParams {
  entity: string;
  strength: number;
}

export interface RivalryParams {
  entity: string;
  strength: number;
}

export interface QuestParams {
  questId: string;
  phase: string;
}

export interface MemoryParams {
  memory: string;
  emotional_weight: number;
}

export interface InsightParams {
  insight: string;
  category: string;
}

export interface CorruptionParams {
  amount: number;
  source: string;
}

export interface PurificationParams {
  amount: number;
  source: string;
}
