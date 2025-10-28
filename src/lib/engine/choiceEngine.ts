/**
 * Universal Choice Engine
 * Handles weighted random selection with affinity modifications
 */

import type { Character } from '@/types/character';
import { getAffinityWeightModifier } from './affinityManager';

export interface WeightedOption<T> {
  value: T;
  weight: number;
  affinityTags?: string[];
  description?: string;
}

export interface ChoiceContext {
  character: Character;
  location?: string;
  timeOfDay?: string;
  recentActions?: string[];
}

/**
 * Choose from weighted options with affinity modifications
 */
export function choose<T>(
  options: WeightedOption<T>[],
  context: ChoiceContext
): T {
  if (options.length === 0) {
    throw new Error('No options provided');
  }
  
  // Apply affinity modifications
  const modifiedOptions = options.map(option => ({
    ...option,
    weight: applyAffinityModifiers(option, context)
  }));
  
  // Calculate total weight
  const totalWeight = modifiedOptions.reduce((sum, opt) => sum + opt.weight, 0);
  
  if (totalWeight <= 0) {
    // Fallback to equal weights if all weights are zero or negative
    return options[Math.floor(Math.random() * options.length)].value;
  }
  
  // Roll random number
  const roll = Math.random() * totalWeight;
  
  // Find selected option
  let cumulative = 0;
  for (const option of modifiedOptions) {
    cumulative += option.weight;
    if (roll <= cumulative) {
      return option.value;
    }
  }
  
  // Fallback (should never reach)
  return modifiedOptions[modifiedOptions.length - 1].value;
}

/**
 * Apply affinity modifications to option weight
 */
function applyAffinityModifiers<T>(
  option: WeightedOption<T>,
  context: ChoiceContext
): number {
  let modifiedWeight = option.weight;
  
  // Apply affinity modifications if option has affinity tags
  if (option.affinityTags && option.affinityTags.length > 0) {
    for (const affinityTag of option.affinityTags) {
      const affinity = context.character.affinities?.[affinityTag] || 0;
      const modifier = getAffinityWeightModifier(affinity);
      
      // Apply modifier (multiplicative)
      modifiedWeight *= modifier;
    }
  }
  
  // Apply location-based modifications
  if (context.location) {
    modifiedWeight *= getLocationModifier(context.location);
  }
  
  // Apply time-based modifications
  if (context.timeOfDay) {
    modifiedWeight *= getTimeModifier(context.timeOfDay);
  }
  
  // Apply recent action modifications
  if (context.recentActions && context.recentActions.length > 0) {
    modifiedWeight *= getRecentActionModifier(context.recentActions);
  }
  
  // Ensure weight doesn't go negative
  return Math.max(0.1, modifiedWeight);
}

/**
 * Get location-based weight modifier
 */
function getLocationModifier(_location: string): number {
  void _location;
  // This would be expanded with actual location-based logic
  // For now, return neutral modifier
  return 1.0;
}

/**
 * Get time-based weight modifier
 */
function getTimeModifier(_timeOfDay: string): number {
  void _timeOfDay;
  // This would be expanded with actual time-based logic
  // For now, return neutral modifier
  return 1.0;
}

/**
 * Get recent action weight modifier
 */
function getRecentActionModifier(
  _recentActions: string[]
): number {
  void _recentActions;
  // This would be expanded with actual action history logic
  // For now, return neutral modifier
  return 1.0;
}

/**
 * Create a weighted option
 */
export function createOption<T>(
  value: T,
  weight: number = 1.0,
  affinityTags?: string[],
  description?: string
): WeightedOption<T> {
  return {
    value,
    weight,
    affinityTags,
    description
  };
}

/**
 * Create multiple options from an array
 */
export function createOptions<T>(
  values: T[],
  baseWeight: number = 1.0,
  affinityTags?: string[]
): WeightedOption<T>[] {
  return values.map(value => createOption(value, baseWeight, affinityTags));
}

/**
 * Get choice statistics for debugging
 */
export function getChoiceStats<T>(
  options: WeightedOption<T>[],
  context: ChoiceContext
): Array<{
  option: T;
  originalWeight: number;
  modifiedWeight: number;
  probability: number;
}> {
  const modifiedOptions = options.map(option => ({
    ...option,
    weight: applyAffinityModifiers(option, context)
  }));
  
  const totalWeight = modifiedOptions.reduce((sum, opt) => sum + opt.weight, 0);
  
  return modifiedOptions.map(option => ({
    option: option.value,
    originalWeight: options.find(opt => opt.value === option.value)?.weight || 0,
    modifiedWeight: option.weight,
    probability: totalWeight > 0 ? option.weight / totalWeight : 0
  }));
}