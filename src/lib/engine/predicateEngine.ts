/**
 * Predicate Engine
 * Core action resolution system that processes (action + roll) → outcome
 */

import type { ActionCard, PredicateCard, OutcomeRule } from '@/types/cards';
import type { Character } from '@/types/character';
import type { DiceResult } from './diceSystem';
import { getDifficultyClass } from './dicePoolBuilder';

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
  targetId?: string;
}): Promise<Outcome> {
  const { actionCard, predicateCard, character, diceResult, targetId } = params;

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
  return executeOutcome(matchingRule, actionCard, predicateCard, character, diceResult, targetId);
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
  diceResult: DiceResult,
  targetId?: string
): Outcome {
  // Calculate success based on DC and roll result
  const dc = getDifficultyClass(actionCard, predicateCard.sceneTags || [], targetId);
  const success = diceResult.total >= dc;
  const criticalSuccess = diceResult.criticalSuccess || diceResult.total >= dc + 10;
  const criticalFailure = diceResult.criticalFailure || diceResult.total <= dc - 10;
  
  const outcome: Outcome = {
    text: '',
    effects: [],
    stateChanges: {},
    success,
    criticalSuccess,
    criticalFailure
  };

  // Generate narrative text
  outcome.text = generateNarrativeText(actionCard, predicateCard, diceResult, rule, targetId);

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
  _rule: OutcomeRule,
  targetId?: string
): string {
  const actionName = actionCard.name.toLowerCase();
  const locationName = predicateCard.name;
  const dc = getDifficultyClass(actionCard, predicateCard.sceneTags || [], targetId);
  
  // Add target information to narrative
  let targetText = '';
  if (targetId) {
    const targetName = targetId.replace(/_/g, ' ').toLowerCase();
    if (actionCard.id === 'pray') {
      targetText = ` to ${targetName}`;
    } else if (actionCard.id === 'travel') {
      targetText = ` to ${targetName}`;
    } else if (actionCard.id === 'bargain' || actionCard.id === 'intimidate' || actionCard.id === 'persuade' || 
               actionCard.id === 'steal' || actionCard.id === 'perform' || actionCard.id === 'lead') {
      targetText = ` with ${targetName}`;
    }
  }
  
  // Generate more sophisticated narrative based on roll vs DC
  const roll = diceResult.total;
  const margin = roll - dc;
  
  if (diceResult.criticalSuccess || margin >= 10) {
    return generateCriticalSuccessText(actionName, targetText, locationName, actionCard, targetId);
  } else if (diceResult.criticalFailure || margin <= -10) {
    return generateCriticalFailureText(actionName, targetText, locationName, actionCard, targetId);
  } else if (margin >= 5) {
    return generateGreatSuccessText(actionName, targetText, locationName, actionCard, targetId);
  } else if (margin >= 0) {
    return generateSuccessText(actionName, targetText, locationName, actionCard, targetId);
  } else if (margin >= -5) {
    return generatePartialFailureText(actionName, targetText, locationName, actionCard, targetId);
  } else {
    return generateFailureText(actionName, targetText, locationName, actionCard, targetId);
  }
}

function generateCriticalSuccessText(actionName: string, targetText: string, locationName: string, actionCard: ActionCard, _targetId?: string): string {
  const narratives: Record<string, string> = {
    pray: `Your prayer${targetText} resonates with divine power! The very air shimmers with sacred energy.`,
    travel: `Your journey${targetText} is swift and effortless, as if the path itself guides your steps.`,
    quick_attack: `Your strike${targetText} is a masterpiece of combat - precise, powerful, and devastating.`,
    take_it_in: `Your awareness${targetText} expands beyond the physical, revealing hidden truths and secrets.`,
    work: `Your labor${targetText} is a symphony of efficiency and skill, producing exceptional results.`,
    bargain: `Your negotiation${targetText} is legendary - you secure terms that would make merchants weep with joy.`,
    intimidate: `Your presence${targetText} is overwhelming, reducing your target to a quivering mess.`,
    persuade: `Your words${targetText} are pure poetry, moving hearts and changing minds with ease.`,
    steal: `Your theft${targetText} is a masterpiece of stealth - you take what you need without a trace.`,
    perform: `Your performance${targetText} is transcendent, moving your audience to tears and cheers.`,
    lead: `Your leadership${targetText} is inspiring - your followers would follow you into hell itself.`
  };
  
  return narratives[actionCard.id] || `Your ${actionName}${targetText} in ${locationName} achieves legendary success!`;
}

function generateCriticalFailureText(actionName: string, targetText: string, locationName: string, actionCard: ActionCard, _targetId?: string): string {
  const narratives: Record<string, string> = {
    pray: `Your prayer${targetText} backfires catastrophically, drawing the attention of malevolent forces.`,
    travel: `Your journey${targetText} goes horribly wrong - you become hopelessly lost and disoriented.`,
    quick_attack: `Your attack${targetText} is a complete disaster, leaving you vulnerable and off-balance.`,
    take_it_in: `Your observation${targetText} reveals something so terrible it shakes your very soul.`,
    work: `Your labor${targetText} is a complete failure, wasting time and resources.`,
    bargain: `Your negotiation${targetText} is a disaster - you've made a terrible deal that will haunt you.`,
    intimidate: `Your attempt${targetText} to intimidate backfires spectacularly, making you look foolish.`,
    persuade: `Your words${targetText} have the opposite effect, alienating everyone around you.`,
    steal: `Your theft${targetText} is a complete disaster - you're caught red-handed and humiliated.`,
    perform: `Your performance${targetText} is a catastrophe - the audience boos and throws things at you.`,
    lead: `Your leadership${targetText} is a disaster - your followers abandon you in disgust.`
  };
  
  return narratives[actionCard.id] || `Your ${actionName}${targetText} in ${locationName} fails catastrophically!`;
}

function generateGreatSuccessText(actionName: string, targetText: string, locationName: string, _actionCard: ActionCard, _targetId?: string): string {
  return `Your ${actionName}${targetText} in ${locationName} succeeds brilliantly, exceeding all expectations.`;
}

function generateSuccessText(actionName: string, targetText: string, locationName: string, _actionCard: ActionCard, _targetId?: string): string {
  return `Your ${actionName}${targetText} in ${locationName} succeeds.`;
}

function generatePartialFailureText(actionName: string, targetText: string, locationName: string, _actionCard: ActionCard, _targetId?: string): string {
  return `Your ${actionName}${targetText} in ${locationName} partially succeeds, but not without complications.`;
}

function generateFailureText(actionName: string, targetText: string, locationName: string, _actionCard: ActionCard, _targetId?: string): string {
  return `Your ${actionName}${targetText} in ${locationName} fails.`;
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