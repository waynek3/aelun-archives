/**
 * Predicate Engine
 * Core action resolution system that processes (action + roll) → outcome
 */

import type { ActionCard, PredicateCard, OutcomeRule } from '@/types/cards';
import type { Character } from '@/types/character';
import type { DiceResult } from './diceSystem';

export interface Outcome {
  text: string;
  effects: OutcomeEffect[];
  stateChanges: Record<string, any>;
  success: boolean;
  criticalSuccess?: boolean;
  criticalFailure?: boolean;
}

export interface OutcomeEffect {
  type: 'damage' | 'heal' | 'gain' | 'lose' | 'affinity' | 'unlock' | 'flag' | 'transition';
  value?: number;
  resource?: string;
  entity?: string;
  category?: string;
  id?: string;
  location?: string;
  flag?: string;
  flagValue?: any;
}

/**
 * Resolve an action against a predicate with a dice roll
 */
export async function resolveAction(params: {
  actionCard: ActionCard;
  predicateCard: PredicateCard;
  character: Character;
  diceResult: DiceResult;
}): Promise<Outcome> {
  const { actionCard, predicateCard, character, diceResult } = params;

  // Get outcome rules for this action
  const outcomeRules = predicateCard.outcomeLogic[actionCard.id];
  
  if (!outcomeRules || outcomeRules.length === 0) {
    return createDefaultOutcome(actionCard, predicateCard, diceResult);
  }

  // Find matching rule based on roll result
  const matchingRule = findMatchingRule(outcomeRules, diceResult.total, character);
  
  if (!matchingRule) {
    return createFailureOutcome(actionCard, predicateCard, diceResult);
  }

  // Execute the outcome
  return executeOutcome(matchingRule, actionCard, predicateCard, character, diceResult);
}

/**
 * Find the first rule that matches the roll result
 */
function findMatchingRule(
  rules: OutcomeRule[],
  rollTotal: number,
  character: Character
): OutcomeRule | null {
  for (const rule of rules) {
    if (evaluateCondition(rule.condition, rollTotal, character)) {
      return rule;
    }
  }
  return null;
}

/**
 * Evaluate a condition string against the roll and character
 */
function evaluateCondition(
  condition: string,
  roll: number,
  _character: Character
): boolean {
  // Simple condition parser for MVP
  // Supports: "roll >= 10", "roll > 15", "roll < 5", "roll == 20"
  
  const operators = {
    '>=': (a: number, b: number) => a >= b,
    '>': (a: number, b: number) => a > b,
    '<=': (a: number, b: number) => a <= b,
    '<': (a: number, b: number) => a < b,
    '==': (a: number, b: number) => a === b,
    '!=': (a: number, b: number) => a !== b,
  };

  // Parse condition: "roll >= 10"
  const match = condition.match(/roll\s*(>=|>|<=|<|==|!=)\s*(\d+)/);
  if (match) {
    const [, operator, value] = match;
    const numValue = parseInt(value);
    return operators[operator as keyof typeof operators](roll, numValue);
  }

  // Default to false for unknown conditions
  return false;
}

/**
 * Execute an outcome rule and return the result
 */
function executeOutcome(
  rule: OutcomeRule,
  actionCard: ActionCard,
  predicateCard: PredicateCard,
  _character: Character,
  diceResult: DiceResult
): Outcome {
  const outcome: Outcome = {
    text: '',
    effects: [],
    stateChanges: {},
    success: diceResult.total >= 10, // Basic success threshold
    criticalSuccess: diceResult.criticalSuccess,
    criticalFailure: diceResult.criticalFailure
  };

  // Generate narrative text
  outcome.text = generateNarrativeText(actionCard, predicateCard, diceResult, rule);

  // Execute the specific outcome type
  switch (rule.outcome) {
    case 'deal_damage':
      executeDealDamage(outcome, rule.parameters);
      break;
    case 'receive_damage':
      executeReceiveDamage(outcome, rule.parameters);
      break;
    case 'gain_resource':
      executeGainResource(outcome, rule.parameters);
      break;
    case 'restore':
      executeRestore(outcome, rule.parameters);
      break;
    case 'change_affinity':
      executeChangeAffinity(outcome, rule.parameters);
      break;
    case 'discover_location':
      executeDiscoverLocation(outcome, rule.parameters);
      break;
    case 'anger_entity':
      executeAngerEntity(outcome, rule.parameters);
      break;
    case 'minor_setback':
      executeMinorSetback(outcome, rule.parameters);
      break;
    case 'no_effect':
      executeNoEffect(outcome, rule.parameters);
      break;
    default:
      console.warn(`Unknown outcome type: ${rule.outcome}`);
      executeNoEffect(outcome, rule.parameters);
  }

  return outcome;
}

/**
 * Generate narrative text for the outcome
 */
function generateNarrativeText(
  actionCard: ActionCard,
  predicateCard: PredicateCard,
  diceResult: DiceResult,
  _rule: OutcomeRule
): string {
  const actionName = actionCard.name.toLowerCase();
  const locationName = predicateCard.name;
  
  if (diceResult.criticalSuccess) {
    return `Your ${actionName} in ${locationName} exceeds all expectations!`;
  } else if (diceResult.criticalFailure) {
    return `Your ${actionName} in ${locationName} goes terribly wrong.`;
  } else if (diceResult.total >= 15) {
    return `Your ${actionName} in ${locationName} succeeds admirably.`;
  } else if (diceResult.total >= 10) {
    return `Your ${actionName} in ${locationName} succeeds.`;
  } else {
    return `Your ${actionName} in ${locationName} fails.`;
  }
}

// Outcome execution functions
function executeDealDamage(outcome: Outcome, params: any): void {
  const damage = rollDamage(params.dice || '1d4');
  outcome.effects.push({
    type: 'damage',
    value: damage
  });
  outcome.text += ` You deal ${damage} damage!`;
}

function executeReceiveDamage(outcome: Outcome, params: any): void {
  const damage = rollDamage(params.dice || '1d4');
  outcome.effects.push({
    type: 'damage',
    value: -damage // Negative damage = healing
  });
  outcome.text += ` You take ${damage} damage.`;
}

function executeGainResource(outcome: Outcome, params: any): void {
  const resource = params.resource || 'goods';
  const amount = params.amount || 1;
  outcome.effects.push({
    type: 'gain',
    resource,
    value: amount
  });
  outcome.text += ` You gain ${amount} ${resource}.`;
}

function executeRestore(outcome: Outcome, params: any): void {
  const hp = params.hp || 1;
  outcome.effects.push({
    type: 'heal',
    value: hp
  });
  outcome.text += ` You restore ${hp} health.`;
}

function executeChangeAffinity(outcome: Outcome, params: any): void {
  const entity = params.entity || 'unknown';
  const change = params.change || 1;
  outcome.effects.push({
    type: 'affinity',
    entity,
    value: change
  });
  outcome.text += ` Your relationship with ${entity} changes.`;
}

function executeDiscoverLocation(outcome: Outcome, params: any): void {
  const location = params.location || 'unknown';
  outcome.effects.push({
    type: 'unlock',
    category: 'location',
    id: location
  });
  outcome.text += ` You discover: ${location}!`;
}

function executeAngerEntity(outcome: Outcome, params: any): void {
  const entity = params.entity || 'unknown';
  const change = params.change || -1;
  outcome.effects.push({
    type: 'affinity',
    entity,
    value: change
  });
  outcome.text += ` You anger ${entity}.`;
}

function executeMinorSetback(outcome: Outcome, params: any): void {
  outcome.text += ` ${params.text || 'A minor setback occurs.'}`;
}

function executeNoEffect(outcome: Outcome, _params: any): void {
  outcome.text += ` Nothing significant happens.`;
}

/**
 * Roll damage dice
 */
function rollDamage(diceString: string): number {
  const match = diceString.match(/(\d+)d(\d+)/);
  if (!match) return 1;
  
  const count = parseInt(match[1]);
  const faces = parseInt(match[2]);
  let total = 0;
  
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * faces) + 1;
  }
  
  return total;
}

/**
 * Create default outcome when no rules match
 */
function createDefaultOutcome(
  actionCard: ActionCard,
  predicateCard: PredicateCard,
  diceResult: DiceResult
): Outcome {
  return {
    text: `You attempt to ${actionCard.name.toLowerCase()} in ${predicateCard.name}, but nothing significant happens.`,
    effects: [],
    stateChanges: {},
    success: diceResult.total >= 10,
    criticalSuccess: diceResult.criticalSuccess,
    criticalFailure: diceResult.criticalFailure
  };
}

/**
 * Create failure outcome when no rules match
 */
function createFailureOutcome(
  actionCard: ActionCard,
  predicateCard: PredicateCard,
  diceResult: DiceResult
): Outcome {
  return {
    text: `Your ${actionCard.name.toLowerCase()} in ${predicateCard.name} fails.`,
    effects: [],
    stateChanges: {},
    success: false,
    criticalSuccess: false,
    criticalFailure: diceResult.criticalFailure
  };
}