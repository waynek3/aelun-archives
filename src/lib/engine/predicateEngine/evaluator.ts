/**
 * Predicate Engine - Condition Evaluator
 * Evaluates conditions for outcome rules
 */

import type { Character } from '@/types/character';
import { getAffinityLevel } from '../affinityManager';

/**
 * Evaluate a condition string against the roll and character
 */
export function evaluateCondition(
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
