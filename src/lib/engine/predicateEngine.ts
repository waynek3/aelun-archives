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
  stateChanges: Record<string, boolean | number | string>;
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
  flagValue?: boolean | number | string;
  text?: string;
  duration?: number;
  permanent?: boolean;
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
  character: Character
): boolean {
  // Advanced condition parser supporting multiple types of checks
  // Supports: "roll >= 10", "stat.strength >= 3", "affinity.monastery > 0", "has_trait.warrior", "state.danger"
  
  const operators = {
    '>=': (a: number, b: number) => a >= b,
    '>': (a: number, b: number) => a > b,
    '<=': (a: number, b: number) => a <= b,
    '<': (a: number, b: number) => a < b,
    '==': (a: number, b: number) => a === b,
    '!=': (a: number, b: number) => a !== b,
  };

  // Parse roll conditions: "roll >= 10"
  const rollMatch = condition.match(/roll\s*(>=|>|<=|<|==|!=)\s*(\d+)/);
  if (rollMatch) {
    const [, operator, value] = rollMatch;
    const numValue = parseInt(value);
    return operators[operator as keyof typeof operators](roll, numValue);
  }

  // Parse stat conditions: "stat.strength >= 3"
  const statMatch = condition.match(/stat\.(\w+)\s*(>=|>|<=|<|==|!=)\s*(\d+)/);
  if (statMatch) {
    const [, statName, operator, value] = statMatch;
    const statValue = character.stats[statName as keyof typeof character.stats] || 0;
    const numValue = parseInt(value);
    return operators[operator as keyof typeof operators](statValue, numValue);
  }

  // Parse affinity conditions: "affinity.monastery > 0"
  const affinityMatch = condition.match(/affinity\.(\w+)\s*(>=|>|<=|<|==|!=)\s*(\d+)/);
  if (affinityMatch) {
    const [, entityName, operator, value] = affinityMatch;
    const affinityValue = character.affinities[entityName] || 0;
    const numValue = parseInt(value);
    return operators[operator as keyof typeof operators](affinityValue, numValue);
  }

  // Parse trait conditions: "has_trait.warrior"
  const traitMatch = condition.match(/has_trait\.(\w+)/);
  if (traitMatch) {
    const [, traitName] = traitMatch;
    return character.traits.some(trait => trait.id === traitName);
  }

  // Parse state flag conditions: "state.danger"
  const stateMatch = condition.match(/state\.(\w+)/);
  if (stateMatch) {
    const [, flagName] = stateMatch;
    return character.worldState.flags[flagName] === true;
  }

  // Parse complex conditions with AND/OR: "roll >= 10 AND stat.strength >= 3"
  if (condition.includes(' AND ')) {
    const parts = condition.split(' AND ');
    return parts.every(part => evaluateCondition(part.trim(), roll, character));
  }

  if (condition.includes(' OR ')) {
    const parts = condition.split(' OR ');
    return parts.some(part => evaluateCondition(part.trim(), roll, character));
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
    case 'discover':
      executeDiscover(outcome, rule.parameters);
      break;
    case 'learn':
      executeLearn(outcome, rule.parameters);
      break;
    case 'transform':
      executeTransform(outcome, rule.parameters);
      break;
    case 'curse':
      executeCurse(outcome, rule.parameters);
      break;
    case 'bless':
      executeBless(outcome, rule.parameters);
      break;
    case 'bond':
      executeBond(outcome, rule.parameters);
      break;
    case 'rivalry':
      executeRivalry(outcome, rule.parameters);
      break;
    case 'quest':
      executeQuest(outcome, rule.parameters);
      break;
    case 'memory':
      executeMemory(outcome, rule.parameters);
      break;
    case 'insight':
      executeInsight(outcome, rule.parameters);
      break;
    case 'corruption':
      executeCorruption(outcome, rule.parameters);
      break;
    case 'purification':
      executePurification(outcome, rule.parameters);
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
  rule: OutcomeRule
): string {
  const actionName = actionCard.name.toLowerCase();
  const locationName = predicateCard.name;
  
  // Get contextual narrative based on action and location
  const narrative = getContextualNarrative(actionCard, predicateCard, diceResult, rule);
  if (narrative) {
    return narrative;
  }
  
  // Fallback to basic narrative
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

/**
 * Get contextual narrative based on action, location, and outcome
 */
function getContextualNarrative(
  actionCard: ActionCard,
  predicateCard: PredicateCard,
  diceResult: DiceResult,
  rule: OutcomeRule
): string | null {
  const actionId = actionCard.id;
  const locationId = predicateCard.id;
  const locationName = predicateCard.name;
  const sceneTags = predicateCard.sceneTags;
  const outcome = rule.outcome;
  
  // Define narrative templates for different combinations
  const narrativeTemplates = {
    // Combat actions
    'quick_attack': {
      'gnarled_woods': {
        'deal_damage': {
          critical: "Your blade finds its mark through the twisted branches!",
          success: "You strike true against the lurking threat.",
          failure: "Your attack misses in the confusing shadows."
        }
      },
      'bandit_camp': {
        'deal_damage': {
          critical: "Your strike catches the bandit completely off-guard!",
          success: "You land a solid blow on your opponent.",
          failure: "The bandit easily dodges your clumsy attack."
        }
      }
    },
    
    // Spiritual actions
    'pray': {
      'monastery': {
        'change_affinity': {
          critical: "The divine presence fills you with overwhelming peace.",
          success: "Your prayer resonates with the sacred stones.",
          failure: "Your words echo hollowly in the empty chapel."
        }
      },
      'cursed_forest': {
        'change_affinity': {
          critical: "Your faith burns bright against the darkness!",
          success: "The twisted spirits acknowledge your devotion.",
          failure: "The malevolent forces mock your feeble prayers."
        }
      }
    },
    
    // Exploration actions
    'take_it_in': {
      'ancient_ruins': {
        'discover': {
          critical: "Ancient wisdom flows through you like a river!",
          success: "You notice details others would miss.",
          failure: "The ruins reveal nothing to your untrained eye."
        }
      },
      'healing_spring': {
        'restore': {
          critical: "The magical waters restore you completely!",
          success: "The spring's power flows through you.",
          failure: "The water seems ordinary and powerless."
        }
      }
    },
    
    // Social actions
    'bargain': {
      'trading_post': {
        'gain_resource': {
          critical: "Your negotiation skills are legendary!",
          success: "You strike a fair deal.",
          failure: "The merchant sees through your tactics."
        }
      },
      'tavern': {
        'gain_resource': {
          critical: "Your charm wins over everyone in the room!",
          success: "You find a sympathetic ear.",
          failure: "The locals are not impressed by your approach."
        }
      }
    }
  };
  
  // Try to find a specific narrative
  const actionNarratives = narrativeTemplates[actionId as keyof typeof narrativeTemplates];
  if (actionNarratives) {
    const locationNarratives = actionNarratives[locationId as keyof typeof actionNarratives];
    if (locationNarratives) {
      const outcomeNarratives = locationNarratives[outcome as keyof typeof locationNarratives] as {
        critical?: string; success?: string; failure?: string
      } | undefined;
      if (outcomeNarratives) {
        if (diceResult.criticalSuccess && outcomeNarratives.critical) {
          return outcomeNarratives.critical;
        } else if (diceResult.total >= 10 && outcomeNarratives.success) {
          return outcomeNarratives.success;
        } else if (outcomeNarratives.failure) {
          return outcomeNarratives.failure;
        }
      }
    }
  }
  
  // Try scene tag-based narratives
  if (sceneTags.includes('Dangerous')) {
    if (diceResult.criticalSuccess) {
      return `Against all odds, your ${actionCard.name.toLowerCase()} triumphs in this perilous place!`;
    } else if (diceResult.criticalFailure) {
      return `The danger of ${locationName} overwhelms your ${actionCard.name.toLowerCase()}.`;
    }
  }
  
  if (sceneTags.includes('Sacred')) {
    if (diceResult.criticalSuccess) {
      return `The divine power of ${locationName} amplifies your ${actionCard.name.toLowerCase()}!`;
    } else if (diceResult.criticalFailure) {
      return `You have offended the sacred nature of ${locationName}.`;
    }
  }
  
  if (sceneTags.includes('Mysterious')) {
    if (diceResult.criticalSuccess) {
      return `The mysteries of ${locationName} unfold before your ${actionCard.name.toLowerCase()}!`;
    } else if (diceResult.criticalFailure) {
      return `The enigma of ${locationName} remains impenetrable.`;
    }
  }
  
  return null; // Use fallback narrative
}

// Outcome execution functions
function executeDealDamage(outcome: Outcome, params: Record<string, unknown>): void {
  const damage = rollDamage(params.dice || '1d4');
  outcome.effects.push({
    type: 'damage',
    value: damage
  });
  outcome.text += ` You deal ${damage} damage!`;
}

function executeReceiveDamage(outcome: Outcome, params: Record<string, unknown>): void {
  const damage = rollDamage(params.dice || '1d4');
  outcome.effects.push({
    type: 'damage',
    value: -damage // Negative damage = healing
  });
  outcome.text += ` You take ${damage} damage.`;
}

function executeGainResource(outcome: Outcome, params: Record<string, unknown>): void {
  const resource = params.resource || 'goods';
  const amount = params.amount || 1;
  outcome.effects.push({
    type: 'gain',
    resource,
    value: amount
  });
  outcome.text += ` You gain ${amount} ${resource}.`;
}

function executeRestore(outcome: Outcome, params: Record<string, unknown>): void {
  const hp = params.hp || 1;
  outcome.effects.push({
    type: 'heal',
    value: hp
  });
  outcome.text += ` You restore ${hp} health.`;
}

function executeChangeAffinity(outcome: Outcome, params: Record<string, unknown>): void {
  const entity = params.entity || 'unknown';
  const change = params.change || 1;
  outcome.effects.push({
    type: 'affinity',
    entity,
    value: change
  });
  outcome.text += ` Your relationship with ${entity} changes.`;
}

function executeDiscoverLocation(outcome: Outcome, params: Record<string, unknown>): void {
  const location = params.location || 'unknown';
  outcome.effects.push({
    type: 'unlock',
    category: 'location',
    id: location
  });
  outcome.text += ` You discover: ${location}!`;
}

function executeAngerEntity(outcome: Outcome, params: Record<string, unknown>): void {
  const entity = params.entity || 'unknown';
  const change = params.change || -1;
  outcome.effects.push({
    type: 'affinity',
    entity,
    value: change
  });
  outcome.text += ` You anger ${entity}.`;
}

function executeMinorSetback(outcome: Outcome, params: Record<string, unknown>): void {
  outcome.text += ` ${params.text || 'A minor setback occurs.'}`;
}

function executeNoEffect(outcome: Outcome): void {
  outcome.text += ` Nothing significant happens.`;
}

// New advanced outcome execution functions
function executeDiscover(outcome: Outcome, params: Record<string, unknown>): void {
  const what = params.what || 'something interesting';
  const category = params.category || 'lore';
  const id = params.id || 'discovery';
  
  outcome.effects.push({
    type: 'discover',
    category,
    id,
    text: params.text || `You discover ${what}!`
  });
  outcome.text += ` You discover ${what}!`;
}

function executeLearn(outcome: Outcome, params: Record<string, unknown>): void {
  const skill = params.skill || 'insight';
  const amount = params.amount || 1;
  
  outcome.effects.push({
    type: 'learn',
    resource: skill,
    value: amount,
    text: params.text || `You gain knowledge about ${skill}.`
  });
  outcome.text += ` You learn something new about ${skill}.`;
}

function executeTransform(outcome: Outcome, params: Record<string, unknown>): void {
  const stat = params.stat || 'will';
  const change = params.change || 1;
  
  outcome.effects.push({
    type: 'transform',
    resource: stat,
    value: change,
    permanent: true,
    text: params.text || `Your ${stat} is permanently changed.`
  });
  outcome.text += ` You feel fundamentally changed.`;
}

function executeCurse(outcome: Outcome, params: Record<string, unknown>): void {
  const curse = params.curse || 'misfortune';
  const duration = params.duration || -1; // -1 = permanent
  
  outcome.effects.push({
    type: 'curse',
    flag: curse,
    duration,
    text: params.text || `You are cursed with ${curse}!`
  });
  outcome.text += ` A dark curse settles upon you.`;
}

function executeBless(outcome: Outcome, params: Record<string, unknown>): void {
  const blessing = params.blessing || 'fortune';
  const duration = params.duration || -1; // -1 = permanent
  
  outcome.effects.push({
    type: 'bless',
    flag: blessing,
    duration,
    text: params.text || `You are blessed with ${blessing}!`
  });
  outcome.text += ` Divine favor shines upon you.`;
}

function executeBond(outcome: Outcome, params: Record<string, unknown>): void {
  const entity = params.entity || 'unknown';
  const strength = params.strength || 2;
  
  outcome.effects.push({
    type: 'bond',
    entity,
    value: strength,
    text: params.text || `You form a deep bond with ${entity}.`
  });
  outcome.text += ` You feel a deep connection to ${entity}.`;
}

function executeRivalry(outcome: Outcome, params: Record<string, unknown>): void {
  const entity = params.entity || 'unknown';
  const intensity = params.intensity || 2;
  
  outcome.effects.push({
    type: 'rivalry',
    entity,
    value: -intensity,
    text: params.text || `You develop a rivalry with ${entity}.`
  });
  outcome.text += ` You feel hostility toward ${entity}.`;
}

function executeQuest(outcome: Outcome, params: Record<string, unknown>): void {
  const quest = params.quest || 'mystery';
  const description = params.description || 'A new quest begins.';
  
  outcome.effects.push({
    type: 'quest',
    id: quest,
    text: description
  });
  outcome.text += ` A new quest presents itself.`;
}

function executeMemory(outcome: Outcome, params: Record<string, unknown>): void {
  const memory = params.memory || 'forgotten_past';
  const clarity = params.clarity || 1;
  
  outcome.effects.push({
    type: 'memory',
    id: memory,
    value: clarity,
    text: params.text || `A memory surfaces from your past.`
  });
  outcome.text += ` A forgotten memory returns to you.`;
}

function executeInsight(outcome: Outcome, params: Record<string, unknown>): void {
  const insight = params.insight || 'wisdom';
  const depth = params.depth || 1;
  
  outcome.effects.push({
    type: 'insight',
    resource: insight,
    value: depth,
    text: params.text || `You gain deep insight into ${insight}.`
  });
  outcome.text += ` A profound insight dawns upon you.`;
}

function executeCorruption(outcome: Outcome, params: Record<string, unknown>): void {
  const source = params.source || 'dark_power';
  const amount = params.amount || 1;
  
  outcome.effects.push({
    type: 'corruption',
    resource: source,
    value: amount,
    text: params.text || `Dark corruption seeps into your soul.`
  });
  outcome.text += ` You feel darkness creeping into your being.`;
}

function executePurification(outcome: Outcome, params: Record<string, unknown>): void {
  const source = params.source || 'divine_light';
  const amount = params.amount || 1;
  
  outcome.effects.push({
    type: 'purification',
    resource: source,
    value: amount,
    text: params.text || `Divine light purifies your soul.`
  });
  outcome.text += ` You feel cleansed and renewed.`;
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