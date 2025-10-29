/**
 * Predicate Engine
 * Core action resolution system that processes (action + roll) → outcome
 */

import type { ActionCard, PredicateCard, OutcomeRule } from '@/types/cards';
import type { Character } from '@/types/character';
import type { DiceResult } from './diceSystem';
import { getAffinityLevel, getAffinityWeightModifier } from './affinityManager';

export interface Outcome {
  text: string;
  effects: OutcomeEffect[];
  stateChanges: Record<string, any>;
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
  flagValue?: any;
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

  // Parse affinity level conditions: "affinity_level.monastery == 'liked'"
  const affinityLevelMatch = condition.match(/affinity_level\.(\w+)\s*(==|!=)\s*['"]([^'"]+)['"]/);
  if (affinityLevelMatch) {
    const [, entityName, operator, level] = affinityLevelMatch;
    const affinityValue = character.affinities[entityName] || 0;
    const currentLevel = getAffinityLevel(affinityValue);
    if (operator === '==') {
      return currentLevel === level;
    } else {
      return currentLevel !== level;
    }
  }

  // Parse affinity range conditions: "affinity.monastery 5-8"
  const affinityRangeMatch = condition.match(/affinity\.(\w+)\s+(\d+)-(\d+)/);
  if (affinityRangeMatch) {
    const [, entityName, min, max] = affinityRangeMatch;
    const affinityValue = character.affinities[entityName] || 0;
    return affinityValue >= parseInt(min) && affinityValue <= parseInt(max);
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

  // Parse dice pool conditions: "dice_pool.total >= 15"
  const dicePoolMatch = condition.match(/dice_pool\.(\w+)\s*(>=|>|<=|<|==|!=)\s*(\d+)/);
  if (dicePoolMatch) {
    const [, poolProperty, operator, value] = dicePoolMatch;
    const numValue = parseInt(value);
    // This would need access to the dice pool, but for now we'll use roll
    if (poolProperty === 'total') {
      return operators[operator as keyof typeof operators](roll, numValue);
    }
  }

  // Parse critical conditions: "critical_success", "critical_failure"
  if (condition === 'critical_success') {
    return roll >= 20; // Assuming 20 is critical success
  }
  if (condition === 'critical_failure') {
    return roll <= 1; // Assuming 1 is critical failure
  }

  // Parse range conditions: "roll 10-15"
  const rangeMatch = condition.match(/roll\s+(\d+)-(\d+)/);
  if (rangeMatch) {
    const [, min, max] = rangeMatch;
    return roll >= parseInt(min) && roll <= parseInt(max);
  }

  // Parse negation: "!has_trait.warrior"
  if (condition.startsWith('!')) {
    return !evaluateCondition(condition.substring(1), roll, character);
  }

  // Parse parentheses for complex expressions: "(roll >= 10 AND stat.strength >= 3) OR has_trait.warrior"
  if (condition.includes('(') && condition.includes(')')) {
    return evaluateComplexExpression(condition, roll, character);
  }

  // Default to false for unknown conditions
  return false;
}

/**
 * Evaluate complex expressions with parentheses
 */
function evaluateComplexExpression(
  condition: string,
  roll: number,
  character: Character
): boolean {
  // Simple implementation - find innermost parentheses and evaluate recursively
  const openParen = condition.lastIndexOf('(');
  if (openParen === -1) {
    return evaluateCondition(condition, roll, character);
  }
  
  const closeParen = condition.indexOf(')', openParen);
  if (closeParen === -1) {
    return evaluateCondition(condition, roll, character);
  }
  
  const innerExpression = condition.substring(openParen + 1, closeParen);
  const result = evaluateCondition(innerExpression, roll, character);
  
  // Replace the parenthesized expression with the result
  const newCondition = condition.substring(0, openParen) + 
    (result ? 'true' : 'false') + 
    condition.substring(closeParen + 1);
  
  return evaluateCondition(newCondition, roll, character);
}

/**
 * Execute an outcome rule and return the result
 */
function executeOutcome(
  rule: OutcomeRule,
  actionCard: ActionCard,
  predicateCard: PredicateCard,
  character: Character,
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
  outcome.text = generateNarrativeText(actionCard, predicateCard, diceResult, rule, character);

  // Apply trait modifications to the outcome
  applyTraitModifications(outcome, character, actionCard, predicateCard, diceResult);

  // Apply affinity-based modifications to the outcome
  applyAffinityModifications(outcome, character, actionCard, predicateCard, diceResult);

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
 * Apply trait modifications to the outcome
 */
function applyTraitModifications(
  outcome: Outcome,
  character: Character,
  actionCard: ActionCard,
  _predicateCard: PredicateCard,
  diceResult: DiceResult
): void {
  // Check for relevant traits and modify the outcome
  for (const trait of character.traits) {
    const traitId = trait.id;
    
    // Combat-related traits
    if (traitId === 'bloodthirsty' && actionCard.tags?.includes('Combat')) {
      if (outcome.effects.some(e => e.type === 'damage' && e.value && e.value > 0)) {
        outcome.effects.push({
          type: 'gain',
          resource: 'dice_modifier',
          value: 1,
          text: 'Your bloodthirsty nature grants you an extra die for your next combat action.'
        });
        outcome.text += ' Your bloodthirsty nature drives you to greater violence!';
      }
    }
    
    if (traitId === 'pacifist' && actionCard.tags?.includes('Combat')) {
      if (outcome.effects.some(e => e.type === 'damage' && e.value && e.value > 0)) {
        outcome.effects.push({
          type: 'curse',
          flag: 'guilt',
          duration: 3,
          text: 'Your pacifist nature makes you feel guilty about the violence.'
        });
        outcome.text += ' Your pacifist nature makes you regret the violence.';
      }
    }
    
    if (traitId === 'berserker_rage' && character.currentHP <= character.maxHP * 0.25) {
      if (actionCard.tags?.includes('Combat')) {
        outcome.effects.push({
          type: 'gain',
          resource: 'dice_modifier',
          value: 3,
          text: 'Your berserker rage grants you three extra dice!'
        });
        outcome.text += ' Your berserker rage surges through you!';
      }
    }
    
    // Magic-related traits
    if (traitId === 'wild_magic' && actionCard.tags?.includes('Magic')) {
      if (Math.random() < 0.1) { // 10% chance
        outcome.effects.push({
          type: 'transform',
          resource: 'random_effect',
          value: 1,
          text: 'Wild magic causes unexpected effects!'
        });
        outcome.text += ' Wild magic surges through your spell!';
      }
    }
    
    if (traitId === 'divine_touched' && actionCard.tags?.includes('Divine')) {
      outcome.effects.push({
        type: 'gain',
        resource: 'dice_modifier',
        value: 2,
        text: 'Your divine connection enhances your abilities.'
      });
      outcome.text += ' Your divine connection amplifies your power.';
    }
    
    if (traitId === 'demon_touched' && actionCard.tags?.includes('Dark')) {
      outcome.effects.push({
        type: 'gain',
        resource: 'dice_modifier',
        value: 2,
        text: 'Your demonic connection enhances your dark abilities.'
      });
      outcome.text += ' Your demonic connection amplifies your dark power.';
    }
    
    // Luck-related traits
    if (traitId === 'lucky_break' && diceResult.criticalFailure) {
      outcome.effects.push({
        type: 'transform',
        resource: 'luck',
        value: 1,
        text: 'Your lucky break turns failure into success!'
      });
      outcome.text += ' Your lucky break saves you from disaster!';
      outcome.success = true;
      outcome.criticalFailure = false;
    }
    
    if (traitId === 'unlucky' && diceResult.criticalSuccess) {
      outcome.effects.push({
        type: 'curse',
        flag: 'misfortune',
        duration: 1,
        text: 'Your unlucky nature turns success into failure.'
      });
      outcome.text += ' Your unlucky nature ruins your success.';
      outcome.success = false;
      outcome.criticalSuccess = false;
    }
    
    if (traitId === 'fortunate' && diceResult.criticalFailure) {
      outcome.effects.push({
        type: 'transform',
        resource: 'fortune',
        value: 1,
        text: 'Your fortunate nature turns failure into success!'
      });
      outcome.text += ' Your fortunate nature saves you from disaster!';
      outcome.success = true;
      outcome.criticalFailure = false;
    }
    
    if (traitId === 'cursed_luck') {
      // Roll twice and take the worse result
      outcome.effects.push({
        type: 'curse',
        flag: 'cursed_luck',
        duration: -1,
        text: 'Your cursed luck makes everything harder.'
      });
      outcome.text += ' Your cursed luck makes everything more difficult.';
    }
    
    if (traitId === 'blessed_fortune') {
      // Roll twice and take the better result
      outcome.effects.push({
        type: 'bless',
        flag: 'blessed_fortune',
        duration: -1,
        text: 'Your blessed fortune makes everything easier.'
      });
      outcome.text += ' Your blessed fortune guides your actions.';
    }
    
    // Death-related traits
    if (traitId === 'death_defying' && character.currentHP <= 0) {
      outcome.effects.push({
        type: 'heal',
        value: 1,
        text: 'Your death-defying nature keeps you alive!'
      });
      outcome.text += ' Your death-defying nature keeps you alive!';
    }
    
    if (traitId === 'mortal_wound') {
      // Healing effects are halved
      for (const effect of outcome.effects) {
        if (effect.type === 'heal' && effect.value) {
          effect.value = Math.floor(effect.value / 2);
        }
      }
      outcome.text += ' Your mortal wound reduces the healing effect.';
    }
    
    if (traitId === 'regenerative') {
      outcome.effects.push({
        type: 'heal',
        value: 1,
        text: 'Your regenerative nature heals you.'
      });
      outcome.text += ' Your regenerative nature heals you.';
    }
    
    if (traitId === 'vampiric' && outcome.effects.some(e => e.type === 'damage' && e.value && e.value > 0)) {
      outcome.effects.push({
        type: 'heal',
        value: 1,
        text: 'Your vampiric nature heals you when you deal damage.'
      });
      outcome.text += ' Your vampiric nature heals you.';
    }
    
    // Elemental traits
    if (traitId === 'elemental_attuned') {
      const element = trait.effect?.includes('fire') ? 'fire' : 
                     trait.effect?.includes('water') ? 'water' :
                     trait.effect?.includes('earth') ? 'earth' : 'air';
      
      if (actionCard.tags?.includes(element.charAt(0).toUpperCase() + element.slice(1))) {
        outcome.effects.push({
          type: 'gain',
          resource: 'dice_modifier',
          value: 1,
          text: `Your ${element} attunement enhances your abilities.`
        });
        outcome.text += ` Your ${element} attunement amplifies your power.`;
      }
    }
    
    // Stealth traits
    if (traitId === 'shadow_walker' && actionCard.tags?.includes('Stealth')) {
      outcome.effects.push({
        type: 'gain',
        resource: 'dice_modifier',
        value: 2,
        text: 'Your shadow walking abilities enhance your stealth.'
      });
      outcome.text += ' You move like a shadow through the darkness.';
    }
    
    // Social traits
    if (traitId === 'beast_speaker' && actionCard.tags?.includes('Social')) {
      outcome.effects.push({
        type: 'gain',
        resource: 'dice_modifier',
        value: 2,
        text: 'Your beast speaking abilities enhance your social interactions.'
      });
      outcome.text += ' Your beast speaking abilities help you communicate.';
    }
    
    if (traitId === 'plant_whisperer' && actionCard.tags?.includes('Social')) {
      outcome.effects.push({
        type: 'gain',
        resource: 'dice_modifier',
        value: 2,
        text: 'Your plant whispering abilities enhance your social interactions.'
      });
      outcome.text += ' Your plant whispering abilities help you communicate.';
    }
    
    if (traitId === 'spirit_medium' && actionCard.tags?.includes('Spiritual')) {
      outcome.effects.push({
        type: 'gain',
        resource: 'dice_modifier',
        value: 2,
        text: 'Your spirit medium abilities enhance your spiritual interactions.'
      });
      outcome.text += ' Your spirit medium abilities help you communicate with the otherworldly.';
    }
    
    // Time and space traits
    if (traitId === 'time_weaver' && actionCard.tags?.includes('Temporal')) {
      outcome.effects.push({
        type: 'gain',
        resource: 'dice_modifier',
        value: 3,
        text: 'Your time weaving abilities enhance your temporal actions.'
      });
      outcome.text += ' You weave time itself to your advantage.';
    }
    
    if (traitId === 'space_bender' && actionCard.tags?.includes('Spatial')) {
      outcome.effects.push({
        type: 'gain',
        resource: 'dice_modifier',
        value: 3,
        text: 'Your space bending abilities enhance your spatial actions.'
      });
      outcome.text += ' You bend space itself to your will.';
    }
    
    // Reality traits
    if (traitId === 'reality_anchor' && actionCard.tags?.includes('Reality')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'reality_anchor',
        duration: -1,
        text: 'Your reality anchoring abilities protect you from reality-warping effects.'
      });
      outcome.text += ' Your reality anchoring abilities protect you from chaos.';
    }
    
    // Dream traits
    if (traitId === 'dream_walker' && actionCard.tags?.includes('Dream')) {
      outcome.effects.push({
        type: 'gain',
        resource: 'dice_modifier',
        value: 2,
        text: 'Your dream walking abilities enhance your dream actions.'
      });
      outcome.text += ' You walk through dreams with ease.';
    }
    
    if (traitId === 'nightmare_warden' && actionCard.tags?.includes('Nightmare')) {
      outcome.effects.push({
        type: 'gain',
        resource: 'dice_modifier',
        value: 2,
        text: 'Your nightmare warding abilities protect you from nightmares.'
      });
      outcome.text += ' Your nightmare warding abilities protect you from dark dreams.';
    }
    
    // Emotional traits
    if (traitId === 'hope_bringer' && actionCard.tags?.includes('Social')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'hope',
        duration: 3,
        text: 'Your hope bringing abilities inspire those around you.'
      });
      outcome.text += ' Your hope bringing abilities inspire those around you.';
    }
    
    if (traitId === 'despair_spreader' && actionCard.tags?.includes('Social')) {
      outcome.effects.push({
        type: 'curse',
        flag: 'despair',
        duration: 3,
        text: 'Your despair spreading abilities demoralize those around you.'
      });
      outcome.text += ' Your despair spreading abilities demoralize those around you.';
    }
    
    // Order and chaos traits
    if (traitId === 'order_enforcer' && actionCard.tags?.includes('Law')) {
      outcome.effects.push({
        type: 'gain',
        resource: 'dice_modifier',
        value: 2,
        text: 'Your order enforcing abilities enhance your law enforcement actions.'
      });
      outcome.text += ' Your order enforcing abilities enhance your actions.';
    }
    
    if (traitId === 'chaos_embracer' && actionCard.tags?.includes('Chaos')) {
      outcome.effects.push({
        type: 'gain',
        resource: 'dice_modifier',
        value: 2,
        text: 'Your chaos embracing abilities enhance your chaotic actions.'
      });
      outcome.text += ' Your chaos embracing abilities enhance your actions.';
    }
    
    // Balance traits
    if (traitId === 'balance_keeper') {
      outcome.effects.push({
        type: 'insight',
        resource: 'balance',
        value: 1,
        text: 'Your balance keeping abilities help you sense when balance is disrupted.'
      });
      outcome.text += ' Your balance keeping abilities help you sense the cosmic balance.';
    }
    
    if (traitId === 'imbalance_catalyst') {
      outcome.effects.push({
        type: 'insight',
        resource: 'imbalance',
        value: 1,
        text: 'Your imbalance catalyzing abilities help you sense when balance is restored.'
      });
      outcome.text += ' Your imbalance catalyzing abilities help you sense the cosmic balance.';
    }
    
    // Music traits
    if (traitId === 'harmony_singer' && actionCard.tags?.includes('Music')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'harmony',
        duration: 3,
        text: 'Your harmony singing abilities create peace around you.'
      });
      outcome.text += ' Your harmony singing abilities create peace around you.';
    }
    
    if (traitId === 'discord_weaver' && actionCard.tags?.includes('Music')) {
      outcome.effects.push({
        type: 'curse',
        flag: 'discord',
        duration: 3,
        text: 'Your discord weaving abilities create chaos around you.'
      });
      outcome.text += ' Your discord weaving abilities create chaos around you.';
    }
    
    // Unity and division traits
    if (traitId === 'unity_builder' && actionCard.tags?.includes('Social')) {
      outcome.effects.push({
        type: 'bond',
        entity: 'group',
        value: 2,
        text: 'Your unity building abilities help you unite divided groups.'
      });
      outcome.text += ' Your unity building abilities help you unite people.';
    }
    
    if (traitId === 'division_sower' && actionCard.tags?.includes('Social')) {
      outcome.effects.push({
        type: 'rivalry',
        entity: 'group',
        value: 2,
        text: 'Your division sowing abilities help you divide united groups.'
      });
      outcome.text += ' Your division sowing abilities help you divide people.';
    }
    
    // Creation and destruction traits
    if (traitId === 'creation_master' && actionCard.tags?.includes('Craft')) {
      outcome.effects.push({
        type: 'gain',
        resource: 'dice_modifier',
        value: 2,
        text: 'Your creation mastery enhances your crafting abilities.'
      });
      outcome.text += ' Your creation mastery enhances your crafting abilities.';
    }
    
    if (traitId === 'destruction_artist' && actionCard.tags?.includes('Destruction')) {
      outcome.effects.push({
        type: 'gain',
        resource: 'dice_modifier',
        value: 2,
        text: 'Your destruction artistry enhances your destructive abilities.'
      });
      outcome.text += ' Your destruction artistry enhances your destructive abilities.';
    }
    
    // Life and death traits
    if (traitId === 'birth_giver' && actionCard.tags?.includes('Life')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'life',
        duration: 3,
        text: 'Your birth giving abilities help with new beginnings.'
      });
      outcome.text += ' Your birth giving abilities help with new beginnings.';
    }
    
    if (traitId === 'death_reaper' && actionCard.tags?.includes('Death')) {
      outcome.effects.push({
        type: 'insight',
        resource: 'death',
        value: 1,
        text: 'Your death reaping abilities help you sense when death is near.'
      });
      outcome.text += ' Your death reaping abilities help you sense when death is near.';
    }
    
    // Growth and decay traits
    if (traitId === 'growth_catalyst' && actionCard.tags?.includes('Growth')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'growth',
        duration: 3,
        text: 'Your growth catalyzing abilities accelerate growth in plants and people.'
      });
      outcome.text += ' Your growth catalyzing abilities accelerate growth.';
    }
    
    if (traitId === 'decay_accelerator' && actionCard.tags?.includes('Decay')) {
      outcome.effects.push({
        type: 'curse',
        flag: 'decay',
        duration: 3,
        text: 'Your decay accelerating abilities accelerate decay in objects and people.'
      });
      outcome.text += ' Your decay accelerating abilities accelerate decay.';
    }
    
    // Renewal and stagnation traits
    if (traitId === 'renewal_bringer' && actionCard.tags?.includes('Renewal')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'renewal',
        duration: 3,
        text: 'Your renewal bringing abilities help renew tired or damaged things.'
      });
      outcome.text += ' Your renewal bringing abilities help renew things.';
    }
    
    if (traitId === 'stagnation_creator' && actionCard.tags?.includes('Stagnation')) {
      outcome.effects.push({
        type: 'curse',
        flag: 'stagnation',
        duration: 3,
        text: 'Your stagnation creating abilities create stagnation in flowing things.'
      });
      outcome.text += ' Your stagnation creating abilities create stagnation.';
    }
    
    // Flow and stasis traits
    if (traitId === 'flow_master' && actionCard.tags?.includes('Flow')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'flow',
        duration: 3,
        text: 'Your flow mastery helps you control the flow of water, air, and energy.'
      });
      outcome.text += ' Your flow mastery helps you control the flow of things.';
    }
    
    if (traitId === 'stasis_warden' && actionCard.tags?.includes('Stasis')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'stasis',
        duration: 3,
        text: 'Your stasis warding abilities help you create stasis in moving things.'
      });
      outcome.text += ' Your stasis warding abilities help you create stasis.';
    }
    
    // Motion and stillness traits
    if (traitId === 'motion_controller' && actionCard.tags?.includes('Motion')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'motion',
        duration: 3,
        text: 'Your motion controlling abilities help you control the motion of objects and people.'
      });
      outcome.text += ' Your motion controlling abilities help you control motion.';
    }
    
    if (traitId === 'stillness_creator' && actionCard.tags?.includes('Stillness')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'stillness',
        duration: 3,
        text: 'Your stillness creating abilities help you create stillness in chaotic situations.'
      });
      outcome.text += ' Your stillness creating abilities help you create stillness.';
    }
    
    // Sound and silence traits
    if (traitId === 'sound_weaver' && actionCard.tags?.includes('Sound')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'sound',
        duration: 3,
        text: 'Your sound weaving abilities help you create and control sound.'
      });
      outcome.text += ' Your sound weaving abilities help you create and control sound.';
    }
    
    if (traitId === 'silence_keeper' && actionCard.tags?.includes('Silence')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'silence',
        duration: 3,
        text: 'Your silence keeping abilities help you create and maintain silence.'
      });
      outcome.text += ' Your silence keeping abilities help you create and maintain silence.';
    }
    
    // Color and gray traits
    if (traitId === 'color_master' && actionCard.tags?.includes('Color')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'color',
        duration: 3,
        text: 'Your color mastery helps you create and control colors.'
      });
      outcome.text += ' Your color mastery helps you create and control colors.';
    }
    
    if (traitId === 'gray_warden' && actionCard.tags?.includes('Gray')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'gray',
        duration: 3,
        text: 'Your gray warding abilities help you create and control gray tones.'
      });
      outcome.text += ' Your gray warding abilities help you create and control gray tones.';
    }
    
    // Brightness and dimness traits
    if (traitId === 'bright_creator' && actionCard.tags?.includes('Bright')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'brightness',
        duration: 3,
        text: 'Your brightness creating abilities help you create and control brightness.'
      });
      outcome.text += ' Your brightness creating abilities help you create and control brightness.';
    }
    
    if (traitId === 'dim_controller' && actionCard.tags?.includes('Dim')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'dimness',
        duration: 3,
        text: 'Your dimness controlling abilities help you create and control dimness.'
      });
      outcome.text += ' Your dimness controlling abilities help you create and control dimness.';
    }
    
    // Sharpness and bluntness traits
    if (traitId === 'sharp_weaver' && actionCard.tags?.includes('Sharp')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'sharpness',
        duration: 3,
        text: 'Your sharpness weaving abilities help you create and control sharpness.'
      });
      outcome.text += ' Your sharpness weaving abilities help you create and control sharpness.';
    }
    
    if (traitId === 'blunt_creator' && actionCard.tags?.includes('Blunt')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'bluntness',
        duration: 3,
        text: 'Your bluntness creating abilities help you create and control bluntness.'
      });
      outcome.text += ' Your bluntness creating abilities help you create and control bluntness.';
    }
    
    // Smoothness and roughness traits
    if (traitId === 'smooth_master' && actionCard.tags?.includes('Smooth')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'smoothness',
        duration: 3,
        text: 'Your smoothness mastery helps you create and control smoothness.'
      });
      outcome.text += ' Your smoothness mastery helps you create and control smoothness.';
    }
    
    if (traitId === 'rough_controller' && actionCard.tags?.includes('Rough')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'roughness',
        duration: 3,
        text: 'Your roughness controlling abilities help you create and control roughness.'
      });
      outcome.text += ' Your roughness controlling abilities help you create and control roughness.';
    }
    
    // Temperature traits
    if (traitId === 'hot_weaver' && actionCard.tags?.includes('Hot')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'heat',
        duration: 3,
        text: 'Your heat weaving abilities help you create and control heat.'
      });
      outcome.text += ' Your heat weaving abilities help you create and control heat.';
    }
    
    if (traitId === 'cold_creator' && actionCard.tags?.includes('Cold')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'cold',
        duration: 3,
        text: 'Your cold creating abilities help you create and control cold.'
      });
      outcome.text += ' Your cold creating abilities help you create and control cold.';
    }
    
    if (traitId === 'warm_master' && actionCard.tags?.includes('Warm')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'warmth',
        duration: 3,
        text: 'Your warmth mastery helps you create and control warmth.'
      });
      outcome.text += ' Your warmth mastery helps you create and control warmth.';
    }
    
    if (traitId === 'cool_controller' && actionCard.tags?.includes('Cool')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'coolness',
        duration: 3,
        text: 'Your coolness controlling abilities help you create and control coolness.'
      });
      outcome.text += ' Your coolness controlling abilities help you create and control coolness.';
    }
    
    // Moisture traits
    if (traitId === 'dry_weaver' && actionCard.tags?.includes('Dry')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'dryness',
        duration: 3,
        text: 'Your dryness weaving abilities help you create and control dryness.'
      });
      outcome.text += ' Your dryness weaving abilities help you create and control dryness.';
    }
    
    if (traitId === 'wet_creator' && actionCard.tags?.includes('Wet')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'wetness',
        duration: 3,
        text: 'Your wetness creating abilities help you create and control wetness.'
      });
      outcome.text += ' Your wetness creating abilities help you create and control wetness.';
    }
    
    // State of matter traits
    if (traitId === 'solid_master' && actionCard.tags?.includes('Solid')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'solidity',
        duration: 3,
        text: 'Your solidity mastery helps you create and control solidity.'
      });
      outcome.text += ' Your solidity mastery helps you create and control solidity.';
    }
    
    if (traitId === 'liquid_controller' && actionCard.tags?.includes('Liquid')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'liquidity',
        duration: 3,
        text: 'Your liquidity controlling abilities help you create and control liquidity.'
      });
      outcome.text += ' Your liquidity controlling abilities help you create and control liquidity.';
    }
    
    if (traitId === 'gas_weaver' && actionCard.tags?.includes('Gas')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'gaseous',
        duration: 3,
        text: 'Your gaseous weaving abilities help you create and control gasses.'
      });
      outcome.text += ' Your gaseous weaving abilities help you create and control gasses.';
    }
    
    if (traitId === 'plasma_creator' && actionCard.tags?.includes('Plasma')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'plasma',
        duration: 3,
        text: 'Your plasma creating abilities help you create and control plasma.'
      });
      outcome.text += ' Your plasma creating abilities help you create and control plasma.';
    }
    
    // Material traits
    if (traitId === 'crystal_master' && actionCard.tags?.includes('Crystal')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'crystal',
        duration: 3,
        text: 'Your crystal mastery helps you create and control crystals.'
      });
      outcome.text += ' Your crystal mastery helps you create and control crystals.';
    }
    
    if (traitId === 'metal_controller' && actionCard.tags?.includes('Metal')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'metal',
        duration: 3,
        text: 'Your metal controlling abilities help you create and control metals.'
      });
      outcome.text += ' Your metal controlling abilities help you create and control metals.';
    }
    
    if (traitId === 'wood_weaver' && actionCard.tags?.includes('Wood')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'wood',
        duration: 3,
        text: 'Your wood weaving abilities help you create and control wood.'
      });
      outcome.text += ' Your wood weaving abilities help you create and control wood.';
    }
    
    if (traitId === 'stone_creator' && actionCard.tags?.includes('Stone')) {
      outcome.effects.push({
        type: 'bless',
        flag: 'stone',
        duration: 3,
        text: 'Your stone creating abilities help you create and control stone.'
      });
      outcome.text += ' Your stone creating abilities help you create and control stone.';
    }
  }
}

/**
 * Apply affinity-based modifications to the outcome
 */
function applyAffinityModifications(
  outcome: Outcome,
  character: Character,
  actionCard: ActionCard,
  _predicateCard: PredicateCard,
  _diceResult: DiceResult
): void {
  const affinities = character.affinities || {};
  
  // Check for relevant affinities and modify the outcome
  for (const [entity, affinity] of Object.entries(affinities)) {
    const affinityLevel = getAffinityLevel(affinity);
    const weightModifier = getAffinityWeightModifier(affinity);
    
    // High affinity bonuses
    if (affinity >= 5) {
      // Beloved or Trusted entities provide bonuses
      if (actionCard.tags?.includes('Social') || actionCard.tags?.includes('Spiritual')) {
        outcome.effects.push({
          type: 'gain',
          resource: 'dice_modifier',
          value: Math.floor(weightModifier),
          text: `Your strong relationship with ${entity} enhances your abilities.`
        });
        outcome.text += ` Your strong bond with ${entity} amplifies your power.`;
      }
    }
    
    // Low affinity penalties
    if (affinity <= -5) {
      // Hated or Disliked entities provide penalties
      if (actionCard.tags?.includes('Social') || actionCard.tags?.includes('Spiritual')) {
        outcome.effects.push({
          type: 'curse',
          flag: 'hostility',
          duration: 1,
          text: `Your poor relationship with ${entity} hinders your abilities.`
        });
        outcome.text += ` Your strained relationship with ${entity} makes this more difficult.`;
      }
    }
    
    // Neutral affinity effects
    if (affinity >= -2 && affinity <= 2) {
      // Neutral entities provide subtle effects
      if (actionCard.tags?.includes('Social')) {
        outcome.effects.push({
          type: 'insight',
          resource: 'neutrality',
          value: 1,
          text: `Your neutral relationship with ${entity} provides balanced perspective.`
        });
        outcome.text += ` Your neutral relationship with ${entity} provides balanced perspective.`;
      }
    }
    
    // Entity-specific effects based on affinity level
    switch (affinityLevel) {
      case 'Beloved':
        // Beloved entities provide maximum bonuses
        outcome.effects.push({
          type: 'bless',
          flag: `beloved_${entity}`,
          duration: 3,
          text: `Your beloved relationship with ${entity} provides divine favor.`
        });
        outcome.text += ` Your beloved relationship with ${entity} provides divine favor.`;
        break;
        
      case 'Trusted':
        // Trusted entities provide significant bonuses
        outcome.effects.push({
          type: 'bless',
          flag: `trusted_${entity}`,
          duration: 2,
          text: `Your trusted relationship with ${entity} provides reliable support.`
        });
        outcome.text += ` Your trusted relationship with ${entity} provides reliable support.`;
        break;
        
      case 'Liked':
        // Liked entities provide moderate bonuses
        outcome.effects.push({
          type: 'bless',
          flag: `liked_${entity}`,
          duration: 1,
          text: `Your positive relationship with ${entity} provides helpful guidance.`
        });
        outcome.text += ` Your positive relationship with ${entity} provides helpful guidance.`;
        break;
        
      case 'Neutral':
        // Neutral entities provide no special effects
        break;
        
      case 'Distrusted':
        // Distrusted entities provide minor penalties
        outcome.effects.push({
          type: 'curse',
          flag: `distrusted_${entity}`,
          duration: 1,
          text: `Your strained relationship with ${entity} creates minor difficulties.`
        });
        outcome.text += ` Your strained relationship with ${entity} creates minor difficulties.`;
        break;
        
      case 'Disliked':
        // Disliked entities provide moderate penalties
        outcome.effects.push({
          type: 'curse',
          flag: `disliked_${entity}`,
          duration: 2,
          text: `Your poor relationship with ${entity} creates significant difficulties.`
        });
        outcome.text += ` Your poor relationship with ${entity} creates significant difficulties.`;
        break;
        
      case 'Hated':
        // Hated entities provide maximum penalties
        outcome.effects.push({
          type: 'curse',
          flag: `hated_${entity}`,
          duration: 3,
          text: `Your hated relationship with ${entity} creates major obstacles.`
        });
        outcome.text += ` Your hated relationship with ${entity} creates major obstacles.`;
        break;
    }
    
    // Special affinity-based outcomes for specific entities
    if (entity === 'monastery' && actionCard.tags?.includes('Spiritual')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'monastery_blessing',
          duration: 5,
          text: 'The monastery\'s divine power blesses your spiritual actions.'
        });
        outcome.text += ' The monastery\'s divine power blesses your spiritual actions.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'monastery_curse',
          duration: 5,
          text: 'The monastery\'s divine power curses your spiritual actions.'
        });
        outcome.text += ' The monastery\'s divine power curses your spiritual actions.';
      }
    }
    
    if (entity === 'bandits' && actionCard.tags?.includes('Combat')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'bandit_alliance',
          duration: 3,
          text: 'Your alliance with the bandits provides combat advantages.'
        });
        outcome.text += ' Your alliance with the bandits provides combat advantages.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'bandit_hostility',
          duration: 3,
          text: 'Your hostility with the bandits creates combat disadvantages.'
        });
        outcome.text += ' Your hostility with the bandits creates combat disadvantages.';
      }
    }
    
    if (entity === 'trading_post' && actionCard.tags?.includes('Social')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'trading_post_favor',
          duration: 2,
          text: 'Your favor with the trading post provides better deals.'
        });
        outcome.text += ' Your favor with the trading post provides better deals.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'trading_post_blacklist',
          duration: 2,
          text: 'Your blacklist with the trading post provides worse deals.'
        });
        outcome.text += ' Your blacklist with the trading post provides worse deals.';
      }
    }
    
    if (entity === 'tavern' && actionCard.tags?.includes('Social')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'tavern_friendship',
          duration: 2,
          text: 'Your friendship with the tavern provides social advantages.'
        });
        outcome.text += ' Your friendship with the tavern provides social advantages.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'tavern_enmity',
          duration: 2,
          text: 'Your enmity with the tavern creates social disadvantages.'
        });
        outcome.text += ' Your enmity with the tavern creates social disadvantages.';
      }
    }
    
    if (entity === 'ancient_ruins' && actionCard.tags?.includes('Exploration')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'ruins_harmony',
          duration: 3,
          text: 'Your harmony with the ancient ruins provides exploration advantages.'
        });
        outcome.text += ' Your harmony with the ancient ruins provides exploration advantages.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'ruins_disharmony',
          duration: 3,
          text: 'Your disharmony with the ancient ruins creates exploration disadvantages.'
        });
        outcome.text += ' Your disharmony with the ancient ruins creates exploration disadvantages.';
      }
    }
    
    if (entity === 'healing_spring' && actionCard.tags?.includes('Healing')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'spring_blessing',
          duration: 4,
          text: 'The healing spring\'s blessing enhances your healing abilities.'
        });
        outcome.text += ' The healing spring\'s blessing enhances your healing abilities.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'spring_curse',
          duration: 4,
          text: 'The healing spring\'s curse weakens your healing abilities.'
        });
        outcome.text += ' The healing spring\'s curse weakens your healing abilities.';
      }
    }
    
    if (entity === 'cursed_forest' && actionCard.tags?.includes('Dark')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'forest_darkness',
          duration: 3,
          text: 'The cursed forest\'s dark power enhances your dark abilities.'
        });
        outcome.text += ' The cursed forest\'s dark power enhances your dark abilities.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'forest_light',
          duration: 3,
          text: 'The cursed forest\'s light power weakens your dark abilities.'
        });
        outcome.text += ' The cursed forest\'s light power weakens your dark abilities.';
      }
    }
    
    if (entity === 'gnarled_woods' && actionCard.tags?.includes('Nature')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'woods_nature',
          duration: 3,
          text: 'The gnarled woods\' natural power enhances your nature abilities.'
        });
        outcome.text += ' The gnarled woods\' natural power enhances your nature abilities.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'woods_unnature',
          duration: 3,
          text: 'The gnarled woods\' unnatural power weakens your nature abilities.'
        });
        outcome.text += ' The gnarled woods\' unnatural power weakens your nature abilities.';
      }
    }
    
    if (entity === 'bandit_camp' && actionCard.tags?.includes('Combat')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'camp_alliance',
          duration: 2,
          text: 'Your alliance with the bandit camp provides combat advantages.'
        });
        outcome.text += ' Your alliance with the bandit camp provides combat advantages.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'camp_hostility',
          duration: 2,
          text: 'Your hostility with the bandit camp creates combat disadvantages.'
        });
        outcome.text += ' Your hostility with the bandit camp creates combat disadvantages.';
      }
    }
    
    if (entity === 'crystal_caverns' && actionCard.tags?.includes('Crystal')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'caverns_crystal',
          duration: 4,
          text: 'The crystal caverns\' power enhances your crystal abilities.'
        });
        outcome.text += ' The crystal caverns\' power enhances your crystal abilities.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'caverns_anti_crystal',
          duration: 4,
          text: 'The crystal caverns\' anti-crystal power weakens your crystal abilities.'
        });
        outcome.text += ' The crystal caverns\' anti-crystal power weakens your crystal abilities.';
      }
    }
    
    if (entity === 'storm_peak' && actionCard.tags?.includes('Storm')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'peak_storm',
          duration: 3,
          text: 'The storm peak\'s power enhances your storm abilities.'
        });
        outcome.text += ' The storm peak\'s power enhances your storm abilities.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'peak_calm',
          duration: 3,
          text: 'The storm peak\'s calm power weakens your storm abilities.'
        });
        outcome.text += ' The storm peak\'s calm power weakens your storm abilities.';
      }
    }
    
    if (entity === 'ethereal_glade' && actionCard.tags?.includes('Ethereal')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'glade_ethereal',
          duration: 4,
          text: 'The ethereal glade\'s power enhances your ethereal abilities.'
        });
        outcome.text += ' The ethereal glade\'s power enhances your ethereal abilities.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'glade_material',
          duration: 4,
          text: 'The ethereal glade\'s material power weakens your ethereal abilities.'
        });
        outcome.text += ' The ethereal glade\'s material power weakens your ethereal abilities.';
      }
    }
    
    if (entity === 'shadow_realm' && actionCard.tags?.includes('Shadow')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'realm_shadow',
          duration: 5,
          text: 'The shadow realm\'s power enhances your shadow abilities.'
        });
        outcome.text += ' The shadow realm\'s power enhances your shadow abilities.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'realm_light',
          duration: 5,
          text: 'The shadow realm\'s light power weakens your shadow abilities.'
        });
        outcome.text += ' The shadow realm\'s light power weakens your shadow abilities.';
      }
    }
    
    if (entity === 'time_vortex' && actionCard.tags?.includes('Temporal')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'vortex_time',
          duration: 4,
          text: 'The time vortex\'s power enhances your temporal abilities.'
        });
        outcome.text += ' The time vortex\'s power enhances your temporal abilities.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'vortex_stasis',
          duration: 4,
          text: 'The time vortex\'s stasis power weakens your temporal abilities.'
        });
        outcome.text += ' The time vortex\'s stasis power weakens your temporal abilities.';
      }
    }
    
    if (entity === 'elemental_forge' && actionCard.tags?.includes('Elemental')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'forge_elemental',
          duration: 3,
          text: 'The elemental forge\'s power enhances your elemental abilities.'
        });
        outcome.text += ' The elemental forge\'s power enhances your elemental abilities.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'forge_anti_elemental',
          duration: 3,
          text: 'The elemental forge\'s anti-elemental power weakens your elemental abilities.'
        });
        outcome.text += ' The elemental forge\'s anti-elemental power weakens your elemental abilities.';
      }
    }
    
    if (entity === 'dreamscape' && actionCard.tags?.includes('Dream')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'dreamscape_dream',
          duration: 4,
          text: 'The dreamscape\'s power enhances your dream abilities.'
        });
        outcome.text += ' The dreamscape\'s power enhances your dream abilities.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'dreamscape_nightmare',
          duration: 4,
          text: 'The dreamscape\'s nightmare power weakens your dream abilities.'
        });
        outcome.text += ' The dreamscape\'s nightmare power weakens your dream abilities.';
      }
    }
    
    if (entity === 'void_portal' && actionCard.tags?.includes('Void')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'portal_void',
          duration: 5,
          text: 'The void portal\'s power enhances your void abilities.'
        });
        outcome.text += ' The void portal\'s power enhances your void abilities.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'portal_matter',
          duration: 5,
          text: 'The void portal\'s matter power weakens your void abilities.'
        });
        outcome.text += ' The void portal\'s matter power weakens your void abilities.';
      }
    }
    
    if (entity === 'cosmic_nexus' && actionCard.tags?.includes('Cosmic')) {
      if (affinity >= 5) {
        outcome.effects.push({
          type: 'bless',
          flag: 'nexus_cosmic',
          duration: 6,
          text: 'The cosmic nexus\'s power enhances your cosmic abilities.'
        });
        outcome.text += ' The cosmic nexus\'s power enhances your cosmic abilities.';
      } else if (affinity <= -5) {
        outcome.effects.push({
          type: 'curse',
          flag: 'nexus_local',
          duration: 6,
          text: 'The cosmic nexus\'s local power weakens your cosmic abilities.'
        });
        outcome.text += ' The cosmic nexus\'s local power weakens your cosmic abilities.';
      }
    }
  }
}

/**
 * Generate narrative text for the outcome
 */
function generateNarrativeText(
  actionCard: ActionCard,
  predicateCard: PredicateCard,
  diceResult: DiceResult,
  rule: OutcomeRule,
  character: Character
): string {
  const actionName = actionCard.name.toLowerCase();
  const locationName = predicateCard.name;
  
  // Get character-specific narrative first
  const characterNarrative = generateCharacterNarrative(actionCard, predicateCard, diceResult, rule, character);
  if (characterNarrative) {
    return characterNarrative;
  }
  
  // Get contextual narrative based on action and location
  const narrative = getContextualNarrative(actionCard, predicateCard, diceResult, rule);
  if (narrative) {
    return narrative;
  }
  
  // Enhanced fallback narrative with more variety
  const fallbackNarratives = generateFallbackNarrative(actionCard, predicateCard, diceResult, rule);
  if (fallbackNarratives) {
    return fallbackNarratives;
  }
  
  // Basic fallback
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
  const actionTags = actionCard.tags || [];
  
  // Enhanced narrative templates with more combinations
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
      },
      'crystal_caverns': {
        'deal_damage': {
          critical: "Your strike shatters crystal formations, creating a dazzling display!",
          success: "You strike true, sending crystal shards flying.",
          failure: "Your attack bounces harmlessly off the hard crystal surfaces."
        }
      }
    },
    
    // Magic actions
    'fireball': {
      'crystal_caverns': {
        'deal_damage': {
          critical: "The fireball explodes with spectacular force, melting crystal formations!",
          success: "Your fireball finds its target in the crystalline chamber.",
          failure: "The fireball fizzles out in the cold, damp air."
        }
      },
      'storm_peak': {
        'deal_damage': {
          critical: "Your fireball ignites the storm clouds themselves!",
          success: "The fireball cuts through the howling winds.",
          failure: "The powerful winds extinguish your fireball before it reaches its target."
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
      },
      'ethereal_glade': {
        'change_affinity': {
          critical: "The ethereal beings themselves join your prayer!",
          success: "Your prayer harmonizes with the otherworldly energies.",
          failure: "Your prayer seems to fall on deaf ears in this strange realm."
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
      },
      'time_vortex': {
        'discover': {
          critical: "You glimpse the very fabric of time itself!",
          success: "You sense the temporal energies swirling around you.",
          failure: "The time vortex remains an impenetrable mystery."
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
    },
    
    // Crafting actions
    'craft': {
      'elemental_forge': {
        'gain_resource': {
          critical: "The elemental energies enhance your creation beyond belief!",
          success: "You craft something useful with the forge's power.",
          failure: "The elemental forces resist your attempts to work them."
        }
      },
      'crystal_caverns': {
        'gain_resource': {
          critical: "You create a masterpiece from the purest crystal!",
          success: "You fashion something beautiful from the crystals.",
          failure: "The crystals prove too hard to work with your tools."
        }
      }
    },
    
    // Meditation actions
    'meditate': {
      'ethereal_glade': {
        'insight': {
          critical: "You achieve perfect enlightenment in this otherworldly place!",
          success: "Your meditation brings deep insights.",
          failure: "The strange energies of this place disturb your concentration."
        }
      },
      'storm_peak': {
        'insight': {
          critical: "The storm's fury reveals profound truths about nature!",
          success: "You find peace even in the chaos of the storm.",
          failure: "The howling winds make meditation impossible."
        }
      }
    }
  };
  
  // Try to find a specific narrative
  const actionNarratives = narrativeTemplates[actionId as keyof typeof narrativeTemplates];
  if (actionNarratives) {
    const locationNarratives = actionNarratives[locationId as keyof typeof actionNarratives];
    if (locationNarratives) {
      const outcomeNarratives = locationNarratives[outcome as keyof typeof locationNarratives] as any;
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
  
  // Enhanced scene tag-based narratives with more variety
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
  
  if (sceneTags.includes('Ethereal')) {
    if (diceResult.criticalSuccess) {
      return `The otherworldly nature of ${locationName} enhances your ${actionCard.name.toLowerCase()}!`;
    } else if (diceResult.criticalFailure) {
      return `The ethereal energies of ${locationName} disrupt your ${actionCard.name.toLowerCase()}.`;
    }
  }
  
  if (sceneTags.includes('Elemental')) {
    if (diceResult.criticalSuccess) {
      return `The elemental forces of ${locationName} surge through your ${actionCard.name.toLowerCase()}!`;
    } else if (diceResult.criticalFailure) {
      return `The raw elemental power of ${locationName} overwhelms your ${actionCard.name.toLowerCase()}.`;
    }
  }
  
  if (sceneTags.includes('Temporal')) {
    if (diceResult.criticalSuccess) {
      return `Time itself bends to your will as you ${actionCard.name.toLowerCase()} in ${locationName}!`;
    } else if (diceResult.criticalFailure) {
      return `The temporal distortions of ${locationName} make your ${actionCard.name.toLowerCase()} impossible.`;
    }
  }
  
  // Action tag-based narratives
  if (actionTags.includes('Combat')) {
    if (diceResult.criticalSuccess) {
      return `Your combat prowess shines as you ${actionCard.name.toLowerCase()} in ${locationName}!`;
    } else if (diceResult.criticalFailure) {
      return `Your combat skills fail you in ${locationName}.`;
    }
  }
  
  if (actionTags.includes('Magic')) {
    if (diceResult.criticalSuccess) {
      return `Your magical abilities reach new heights in ${locationName}!`;
    } else if (diceResult.criticalFailure) {
      return `The magical energies of ${locationName} resist your spell.`;
    }
  }
  
  if (actionTags.includes('Social')) {
    if (diceResult.criticalSuccess) {
      return `Your social skills win over everyone in ${locationName}!`;
    } else if (diceResult.criticalFailure) {
      return `Your social approach falls flat in ${locationName}.`;
    }
  }
  
  if (actionTags.includes('Stealth')) {
    if (diceResult.criticalSuccess) {
      return `You move like a shadow through ${locationName}!`;
    } else if (diceResult.criticalFailure) {
      return `Your stealth fails in the open spaces of ${locationName}.`;
    }
  }
  
  return null; // Use fallback narrative
}

/**
 * Generate character-specific narratives based on traits and character state
 */
function generateCharacterNarrative(
  actionCard: ActionCard,
  predicateCard: PredicateCard,
  diceResult: DiceResult,
  _rule: OutcomeRule,
  character: Character
): string | null {
  const actionName = actionCard.name.toLowerCase();
  const locationName = predicateCard.name;
  const actionTags = actionCard.tags || [];
  const sceneTags = predicateCard.sceneTags;
  
  // Character-specific narrative templates based on traits
  const traitNarratives = {
    'bloodthirsty': {
      'Combat': {
        critical: [
          `Your bloodthirsty nature drives you to savage violence in ${locationName}!`,
          `The taste of blood fuels your ${actionName} in ${locationName}!`,
          `Your bloodlust makes your ${actionName} devastating in ${locationName}!`
        ],
        success: [
          `Your bloodthirsty nature enhances your ${actionName} in ${locationName}.`,
          `The thrill of combat drives your ${actionName} in ${locationName}.`,
          `Your bloodlust makes your ${actionName} more effective in ${locationName}.`
        ],
        failure: [
          `Your bloodthirsty nature clouds your judgment in ${locationName}.`,
          `Your bloodlust makes your ${actionName} reckless in ${locationName}.`,
          `Your bloodthirsty nature leads to poor decisions in ${locationName}.`
        ]
      }
    },
    'pacifist': {
      'Combat': {
        critical: [
          `Your pacifist nature makes your ${actionName} a last resort in ${locationName}!`,
          `You use your ${actionName} defensively, true to your pacifist beliefs in ${locationName}!`,
          `Your pacifist nature guides your ${actionName} to minimize harm in ${locationName}!`
        ],
        success: [
          `Your pacifist nature makes your ${actionName} measured in ${locationName}.`,
          `You use your ${actionName} reluctantly, staying true to your beliefs in ${locationName}.`,
          `Your pacifist nature influences your ${actionName} in ${locationName}.`
        ],
        failure: [
          `Your pacifist nature makes your ${actionName} hesitant in ${locationName}.`,
          `Your pacifist beliefs conflict with your ${actionName} in ${locationName}.`,
          `Your pacifist nature makes your ${actionName} ineffective in ${locationName}.`
        ]
      }
    },
    'wild_magic': {
      'Magic': {
        critical: [
          `Your wild magic explodes with chaotic power in ${locationName}!`,
          `The wild magic within you surges uncontrollably in ${locationName}!`,
          `Your wild magic creates spectacular effects in ${locationName}!`
        ],
        success: [
          `Your wild magic adds unpredictable elements to your ${actionName} in ${locationName}.`,
          `The wild magic within you enhances your ${actionName} in ${locationName}.`,
          `Your wild magic makes your ${actionName} more potent in ${locationName}.`
        ],
        failure: [
          `Your wild magic backfires during your ${actionName} in ${locationName}.`,
          `The wild magic within you disrupts your ${actionName} in ${locationName}.`,
          `Your wild magic makes your ${actionName} unpredictable in ${locationName}.`
        ]
      }
    },
    'lucky_break': {
      'all': {
        critical: [
          `Your incredible luck turns the tide in ${locationName}!`,
          `Fortune smiles upon your ${actionName} in ${locationName}!`,
          `Your lucky break makes your ${actionName} perfect in ${locationName}!`
        ],
        success: [
          `Your luck helps your ${actionName} in ${locationName}.`,
          `Fortune favors your ${actionName} in ${locationName}.`,
          `Your lucky nature aids your ${actionName} in ${locationName}.`
        ],
        failure: [
          `Even your luck can't help your ${actionName} in ${locationName}.`,
          `Your luck runs out during your ${actionName} in ${locationName}.`,
          `Fortune abandons your ${actionName} in ${locationName}.`
        ]
      }
    },
    'unlucky': {
      'all': {
        critical: [
          `Despite your terrible luck, your ${actionName} succeeds in ${locationName}!`,
          `Your unlucky nature makes your ${actionName} a miracle in ${locationName}!`,
          `Against all odds, your ${actionName} works in ${locationName}!`
        ],
        success: [
          `Your unlucky nature makes your ${actionName} difficult in ${locationName}.`,
          `Despite your bad luck, your ${actionName} works in ${locationName}.`,
          `Your unlucky nature hampers your ${actionName} in ${locationName}.`
        ],
        failure: [
          `Your unlucky nature makes your ${actionName} fail in ${locationName}.`,
          `Your bad luck ruins your ${actionName} in ${locationName}.`,
          `Your unlucky nature ensures your ${actionName} fails in ${locationName}.`
        ]
      }
    },
    'regenerative': {
      'all': {
        critical: [
          `Your regenerative abilities enhance your ${actionName} in ${locationName}!`,
          `Your healing nature makes your ${actionName} more effective in ${locationName}!`,
          `Your regenerative powers amplify your ${actionName} in ${locationName}!`
        ],
        success: [
          `Your regenerative abilities aid your ${actionName} in ${locationName}.`,
          `Your healing nature helps your ${actionName} in ${locationName}.`,
          `Your regenerative powers support your ${actionName} in ${locationName}.`
        ],
        failure: [
          `Your regenerative abilities can't help your ${actionName} in ${locationName}.`,
          `Your healing nature doesn't aid your ${actionName} in ${locationName}.`,
          `Your regenerative powers fail to help your ${actionName} in ${locationName}.`
        ]
      }
    },
    'elemental_attuned': {
      'Magic': {
        critical: [
          `Your elemental attunement makes your ${actionName} powerful in ${locationName}!`,
          `The elements respond to your ${actionName} in ${locationName}!`,
          `Your elemental connection enhances your ${actionName} in ${locationName}!`
        ],
        success: [
          `Your elemental attunement aids your ${actionName} in ${locationName}.`,
          `The elements support your ${actionName} in ${locationName}.`,
          `Your elemental connection helps your ${actionName} in ${locationName}.`
        ],
        failure: [
          `Your elemental attunement can't help your ${actionName} in ${locationName}.`,
          `The elements resist your ${actionName} in ${locationName}.`,
          `Your elemental connection fails to aid your ${actionName} in ${locationName}.`
        ]
      }
    },
    'shadow_walker': {
      'Stealth': {
        critical: [
          `Your shadow-walking abilities make your ${actionName} perfect in ${locationName}!`,
          `You move like a shadow during your ${actionName} in ${locationName}!`,
          `Your shadow-walking powers enhance your ${actionName} in ${locationName}!`
        ],
        success: [
          `Your shadow-walking abilities aid your ${actionName} in ${locationName}.`,
          `You use your shadow powers during your ${actionName} in ${locationName}.`,
          `Your shadow-walking helps your ${actionName} in ${locationName}.`
        ],
        failure: [
          `Your shadow-walking abilities can't help your ${actionName} in ${locationName}.`,
          `Your shadow powers fail during your ${actionName} in ${locationName}.`,
          `Your shadow-walking doesn't aid your ${actionName} in ${locationName}.`
        ]
      }
    },
    'light_bearer': {
      'Magic': {
        critical: [
          `Your light-bearing abilities make your ${actionName} radiant in ${locationName}!`,
          `The light within you enhances your ${actionName} in ${locationName}!`,
          `Your light powers amplify your ${actionName} in ${locationName}!`
        ],
        success: [
          `Your light-bearing abilities aid your ${actionName} in ${locationName}.`,
          `The light within you helps your ${actionName} in ${locationName}.`,
          `Your light powers support your ${actionName} in ${locationName}.`
        ],
        failure: [
          `Your light-bearing abilities can't help your ${actionName} in ${locationName}.`,
          `The light within you fails to aid your ${actionName} in ${locationName}.`,
          `Your light powers don't help your ${actionName} in ${locationName}.`
        ]
      }
    },
    'beast_speaker': {
      'Social': {
        critical: [
          `Your beast-speaking abilities make your ${actionName} perfect in ${locationName}!`,
          `The animals respond to your ${actionName} in ${locationName}!`,
          `Your beast connection enhances your ${actionName} in ${locationName}!`
        ],
        success: [
          `Your beast-speaking abilities aid your ${actionName} in ${locationName}.`,
          `The animals support your ${actionName} in ${locationName}.`,
          `Your beast connection helps your ${actionName} in ${locationName}.`
        ],
        failure: [
          `Your beast-speaking abilities can't help your ${actionName} in ${locationName}.`,
          `The animals don't respond to your ${actionName} in ${locationName}.`,
          `Your beast connection fails to aid your ${actionName} in ${locationName}.`
        ]
      }
    },
    'spirit_medium': {
      'Magic': {
        critical: [
          `Your spirit-medium abilities make your ${actionName} otherworldly in ${locationName}!`,
          `The spirits guide your ${actionName} in ${locationName}!`,
          `Your spirit connection enhances your ${actionName} in ${locationName}!`
        ],
        success: [
          `Your spirit-medium abilities aid your ${actionName} in ${locationName}.`,
          `The spirits support your ${actionName} in ${locationName}.`,
          `Your spirit connection helps your ${actionName} in ${locationName}.`
        ],
        failure: [
          `Your spirit-medium abilities can't help your ${actionName} in ${locationName}.`,
          `The spirits don't respond to your ${actionName} in ${locationName}.`,
          `Your spirit connection fails to aid your ${actionName} in ${locationName}.`
        ]
      }
    }
  };
  
  // Check for character-specific narratives based on traits
  for (const trait of character.traits) {
    const traitId = trait.id;
    const traitNarrative = traitNarratives[traitId as keyof typeof traitNarratives];
    
    if (traitNarrative) {
      // Check if this trait applies to the current action
      const applicableTags = Object.keys(traitNarrative);
      const isApplicable = applicableTags.includes('all') || 
                          actionTags.some(tag => applicableTags.includes(tag));
      
      if (isApplicable) {
        const tagKey = applicableTags.includes('all') ? 'all' : 
                      actionTags.find(tag => applicableTags.includes(tag)) || 'all';
        const tagNarrative = traitNarrative[tagKey as keyof typeof traitNarrative] as any;
        
        if (tagNarrative) {
          let narratives: string[];
          if (diceResult.criticalSuccess) {
            narratives = tagNarrative.critical;
          } else if (diceResult.total >= 10) {
            narratives = tagNarrative.success;
          } else {
            narratives = tagNarrative.failure;
          }
          
          // Add scene tag flavor
          if (sceneTags.includes('Dangerous')) {
            narratives = narratives.map(n => n.replace('in ', 'in this perilous '));
          }
          if (sceneTags.includes('Sacred')) {
            narratives = narratives.map(n => n.replace('in ', 'in this sacred '));
          }
          if (sceneTags.includes('Mysterious')) {
            narratives = narratives.map(n => n.replace('in ', 'in this mysterious '));
          }
          if (sceneTags.includes('Ethereal')) {
            narratives = narratives.map(n => n.replace('in ', 'in this otherworldly '));
          }
          if (sceneTags.includes('Elemental')) {
            narratives = narratives.map(n => n.replace('in ', 'in this elemental '));
          }
          if (sceneTags.includes('Temporal')) {
            narratives = narratives.map(n => n.replace('in ', 'in this temporal '));
          }
          
          // Return a random narrative from the appropriate set
          return narratives[Math.floor(Math.random() * narratives.length)];
        }
      }
    }
  }
  
  // Check for character state-based narratives
  if (character.currentHP <= character.maxHP * 0.25) {
    const lowHpNarratives = {
      critical: [
        `Despite your injuries, your ${actionName} succeeds brilliantly in ${locationName}!`,
        `Your determination overcomes your wounds in ${locationName}!`,
        `Your ${actionName} defies your injuries in ${locationName}!`
      ],
      success: [
        `Despite your injuries, your ${actionName} works in ${locationName}.`,
        `Your determination aids your ${actionName} in ${locationName}.`,
        `Your ${actionName} succeeds despite your wounds in ${locationName}.`
      ],
      failure: [
        `Your injuries hamper your ${actionName} in ${locationName}.`,
        `Your wounds make your ${actionName} difficult in ${locationName}.`,
        `Your injuries prevent your ${actionName} from working in ${locationName}.`
      ]
    };
    
    let narratives: string[];
    if (diceResult.criticalSuccess) {
      narratives = lowHpNarratives.critical;
    } else if (diceResult.total >= 10) {
      narratives = lowHpNarratives.success;
    } else {
      narratives = lowHpNarratives.failure;
    }
    
    return narratives[Math.floor(Math.random() * narratives.length)];
  }
  
  return null;
}

/**
 * Generate enhanced fallback narratives with more variety and character
 */
function generateFallbackNarrative(
  actionCard: ActionCard,
  predicateCard: PredicateCard,
  diceResult: DiceResult,
  rule: OutcomeRule
): string | null {
  const actionName = actionCard.name.toLowerCase();
  const locationName = predicateCard.name;
  const sceneTags = predicateCard.sceneTags;
  const actionTags = actionCard.tags || [];
  const outcome = rule.outcome;
  
  // Enhanced narrative templates based on outcome type
  const outcomeNarratives = {
    'deal_damage': {
      critical: [
        `Your ${actionName} strikes with devastating precision in ${locationName}!`,
        `The power of your ${actionName} overwhelms your target in ${locationName}!`,
        `Your ${actionName} finds a critical weakness in ${locationName}!`
      ],
      success: [
        `Your ${actionName} lands a solid blow in ${locationName}.`,
        `You strike true with your ${actionName} in ${locationName}.`,
        `Your ${actionName} finds its mark in ${locationName}.`
      ],
      failure: [
        `Your ${actionName} misses its target in ${locationName}.`,
        `Your ${actionName} fails to connect in ${locationName}.`,
        `Your ${actionName} is ineffective in ${locationName}.`
      ]
    },
    'receive_damage': {
      critical: [
        `You suffer a grievous wound from your ${actionName} in ${locationName}!`,
        `The consequences of your ${actionName} are severe in ${locationName}!`,
        `Your ${actionName} backfires catastrophically in ${locationName}!`
      ],
      success: [
        `You take some damage from your ${actionName} in ${locationName}.`,
        `Your ${actionName} has unintended consequences in ${locationName}.`,
        `You feel the sting of your ${actionName} in ${locationName}.`
      ],
      failure: [
        `You escape unscathed from your ${actionName} in ${locationName}.`,
        `Your ${actionName} proves harmless in ${locationName}.`,
        `You avoid any damage from your ${actionName} in ${locationName}.`
      ]
    },
    'gain_resource': {
      critical: [
        `Your ${actionName} yields incredible rewards in ${locationName}!`,
        `You discover a treasure trove through your ${actionName} in ${locationName}!`,
        `Your ${actionName} unlocks hidden wealth in ${locationName}!`
      ],
      success: [
        `Your ${actionName} brings useful rewards in ${locationName}.`,
        `You gain valuable resources through your ${actionName} in ${locationName}.`,
        `Your ${actionName} proves profitable in ${locationName}.`
      ],
      failure: [
        `Your ${actionName} yields nothing in ${locationName}.`,
        `Your ${actionName} finds no rewards in ${locationName}.`,
        `Your ${actionName} proves fruitless in ${locationName}.`
      ]
    },
    'restore': {
      critical: [
        `Your ${actionName} restores you completely in ${locationName}!`,
        `The healing power of your ${actionName} is extraordinary in ${locationName}!`,
        `Your ${actionName} brings miraculous recovery in ${locationName}!`
      ],
      success: [
        `Your ${actionName} heals your wounds in ${locationName}.`,
        `You feel better after your ${actionName} in ${locationName}.`,
        `Your ${actionName} brings relief in ${locationName}.`
      ],
      failure: [
        `Your ${actionName} provides no healing in ${locationName}.`,
        `Your ${actionName} fails to restore you in ${locationName}.`,
        `Your ${actionName} offers no comfort in ${locationName}.`
      ]
    },
    'change_affinity': {
      critical: [
        `Your ${actionName} creates a deep bond in ${locationName}!`,
        `The connection forged by your ${actionName} is profound in ${locationName}!`,
        `Your ${actionName} establishes lasting trust in ${locationName}!`
      ],
      success: [
        `Your ${actionName} improves relations in ${locationName}.`,
        `You build rapport through your ${actionName} in ${locationName}.`,
        `Your ${actionName} creates understanding in ${locationName}.`
      ],
      failure: [
        `Your ${actionName} strains relations in ${locationName}.`,
        `Your ${actionName} creates tension in ${locationName}.`,
        `Your ${actionName} damages trust in ${locationName}.`
      ]
    },
    'discover_location': {
      critical: [
        `Your ${actionName} reveals a hidden realm in ${locationName}!`,
        `You uncover a secret place through your ${actionName} in ${locationName}!`,
        `Your ${actionName} opens new horizons in ${locationName}!`
      ],
      success: [
        `Your ${actionName} reveals new areas in ${locationName}.`,
        `You discover something new through your ${actionName} in ${locationName}.`,
        `Your ${actionName} expands your knowledge of ${locationName}.`
      ],
      failure: [
        `Your ${actionName} reveals nothing new in ${locationName}.`,
        `Your ${actionName} finds no secrets in ${locationName}.`,
        `Your ${actionName} yields no discoveries in ${locationName}.`
      ]
    },
    'anger_entity': {
      critical: [
        `Your ${actionName} enrages powerful forces in ${locationName}!`,
        `You have made dangerous enemies through your ${actionName} in ${locationName}!`,
        `Your ${actionName} provokes a terrible response in ${locationName}!`
      ],
      success: [
        `Your ${actionName} creates some hostility in ${locationName}.`,
        `You make enemies through your ${actionName} in ${locationName}.`,
        `Your ${actionName} angers some in ${locationName}.`
      ],
      failure: [
        `Your ${actionName} avoids causing offense in ${locationName}.`,
        `Your ${actionName} maintains peace in ${locationName}.`,
        `Your ${actionName} keeps relations stable in ${locationName}.`
      ]
    },
    'minor_setback': {
      critical: [
        `Your ${actionName} causes a major setback in ${locationName}!`,
        `You face serious consequences from your ${actionName} in ${locationName}!`,
        `Your ${actionName} creates significant problems in ${locationName}!`
      ],
      success: [
        `Your ${actionName} causes a minor setback in ${locationName}.`,
        `You face some consequences from your ${actionName} in ${locationName}.`,
        `Your ${actionName} creates small problems in ${locationName}.`
      ],
      failure: [
        `Your ${actionName} avoids any setbacks in ${locationName}.`,
        `Your ${actionName} proceeds smoothly in ${locationName}.`,
        `Your ${actionName} faces no obstacles in ${locationName}.`
      ]
    },
    'no_effect': {
      critical: [
        `Your ${actionName} has no effect, but you learn something important in ${locationName}!`,
        `Your ${actionName} fails, but reveals valuable insights in ${locationName}!`,
        `Your ${actionName} accomplishes nothing, but teaches you much in ${locationName}!`
      ],
      success: [
        `Your ${actionName} has no effect in ${locationName}.`,
        `Your ${actionName} accomplishes nothing in ${locationName}.`,
        `Your ${actionName} fails to make an impact in ${locationName}.`
      ],
      failure: [
        `Your ${actionName} has no effect in ${locationName}.`,
        `Your ${actionName} accomplishes nothing in ${locationName}.`,
        `Your ${actionName} fails to make an impact in ${locationName}.`
      ]
    },
    'discover': {
      critical: [
        `Your ${actionName} reveals profound secrets in ${locationName}!`,
        `You uncover hidden knowledge through your ${actionName} in ${locationName}!`,
        `Your ${actionName} opens your mind to new possibilities in ${locationName}!`
      ],
      success: [
        `Your ${actionName} reveals useful information in ${locationName}.`,
        `You learn something new through your ${actionName} in ${locationName}.`,
        `Your ${actionName} expands your understanding in ${locationName}.`
      ],
      failure: [
        `Your ${actionName} reveals nothing in ${locationName}.`,
        `Your ${actionName} finds no secrets in ${locationName}.`,
        `Your ${actionName} yields no insights in ${locationName}.`
      ]
    },
    'insight': {
      critical: [
        `Your ${actionName} brings profound enlightenment in ${locationName}!`,
        `You achieve deep understanding through your ${actionName} in ${locationName}!`,
        `Your ${actionName} opens your mind to new wisdom in ${locationName}!`
      ],
      success: [
        `Your ${actionName} brings useful insights in ${locationName}.`,
        `You gain understanding through your ${actionName} in ${locationName}.`,
        `Your ${actionName} expands your knowledge in ${locationName}.`
      ],
      failure: [
        `Your ${actionName} brings no insights in ${locationName}.`,
        `Your ${actionName} fails to enlighten you in ${locationName}.`,
        `Your ${actionName} yields no understanding in ${locationName}.`
      ]
    }
  };
  
  // Get narratives for the specific outcome
  const outcomeNarrative = outcomeNarratives[outcome as keyof typeof outcomeNarratives];
  if (outcomeNarrative) {
    let narratives: string[];
    if (diceResult.criticalSuccess) {
      narratives = outcomeNarrative.critical;
    } else if (diceResult.total >= 10) {
      narratives = outcomeNarrative.success;
    } else {
      narratives = outcomeNarrative.failure;
    }
    
    // Add scene tag flavor
    if (sceneTags.includes('Dangerous')) {
      narratives = narratives.map(n => n.replace('in ', 'in this perilous '));
    }
    if (sceneTags.includes('Sacred')) {
      narratives = narratives.map(n => n.replace('in ', 'in this sacred '));
    }
    if (sceneTags.includes('Mysterious')) {
      narratives = narratives.map(n => n.replace('in ', 'in this mysterious '));
    }
    if (sceneTags.includes('Ethereal')) {
      narratives = narratives.map(n => n.replace('in ', 'in this otherworldly '));
    }
    if (sceneTags.includes('Elemental')) {
      narratives = narratives.map(n => n.replace('in ', 'in this elemental '));
    }
    if (sceneTags.includes('Temporal')) {
      narratives = narratives.map(n => n.replace('in ', 'in this temporal '));
    }
    
    // Add action tag flavor
    if (actionTags.includes('Combat')) {
      narratives = narratives.map(n => n.replace('Your ', 'Your combat '));
    }
    if (actionTags.includes('Magic')) {
      narratives = narratives.map(n => n.replace('Your ', 'Your magical '));
    }
    if (actionTags.includes('Social')) {
      narratives = narratives.map(n => n.replace('Your ', 'Your social '));
    }
    if (actionTags.includes('Stealth')) {
      narratives = narratives.map(n => n.replace('Your ', 'Your stealthy '));
    }
    
    // Return a random narrative from the appropriate set
    return narratives[Math.floor(Math.random() * narratives.length)];
  }
  
  return null;
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

// New advanced outcome execution functions
function executeDiscover(outcome: Outcome, params: any): void {
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

function executeLearn(outcome: Outcome, params: any): void {
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

function executeTransform(outcome: Outcome, params: any): void {
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

function executeCurse(outcome: Outcome, params: any): void {
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

function executeBless(outcome: Outcome, params: any): void {
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

function executeBond(outcome: Outcome, params: any): void {
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

function executeRivalry(outcome: Outcome, params: any): void {
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

function executeQuest(outcome: Outcome, params: any): void {
  const quest = params.quest || 'mystery';
  const description = params.description || 'A new quest begins.';
  
  outcome.effects.push({
    type: 'quest',
    id: quest,
    text: description
  });
  outcome.text += ` A new quest presents itself.`;
}

function executeMemory(outcome: Outcome, params: any): void {
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

function executeInsight(outcome: Outcome, params: any): void {
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

function executeCorruption(outcome: Outcome, params: any): void {
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

function executePurification(outcome: Outcome, params: any): void {
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