/**
 * Dice Pool Builder
 * Assembles dice pools from character stats, traits, and actions
 */

import type { Character } from '@/types/character';
import type { ActionCard } from '@/types/cards';
import type { DicePool, Die } from './diceSystem';

export interface DicePoolContext {
  character: Character;
  actionCard: ActionCard;
  duplicateCards?: number; // Number of duplicate cards played for advantage
}

/**
 * Build dice pool for an action
 */
export function buildDicePool(context: DicePoolContext): DicePool {
  const { character, actionCard, duplicateCards = 0 } = context;
  
  // Base advantage dice (1 + duplicates)
  const advantageDice = 1 + duplicateCards;
  
  // Build bonus dice from various sources
  const bonusDice: Die[] = [];
  
  // Add stat bonuses
  addStatBonuses(bonusDice, character, actionCard);
  
  // Add trait bonuses
  addTraitBonuses(bonusDice, character, actionCard);
  
  // Add action card dice modifier
  addActionCardModifier(bonusDice, actionCard);
  
  // Add affinity bonuses (placeholder for now)
  addAffinityBonuses(bonusDice, character);
  
  return {
    advantageDice,
    bonusDice
  };
}

/**
 * Add stat bonuses to dice pool
 */
function addStatBonuses(bonusDice: Die[], character: Character, actionCard: ActionCard): void {
  // Map action tags to relevant stats
  const statMapping: Record<string, keyof Character['stats']> = {
    'Physical': 'strength',
    'Combat': 'strength',
    'Social': 'charisma',
    'Divine': 'will',
    'Universal': 'insight'
  };
  
  // Find relevant stats for this action
  const relevantStats = actionCard.tags
    .map(tag => statMapping[tag])
    .filter(Boolean) as (keyof Character['stats'])[];
  
  // Add dice for each relevant stat
  relevantStats.forEach(stat => {
    const statValue = character.stats[stat] || 0;
    if (statValue > 0) {
      // Each stat point adds 1d4
      for (let i = 0; i < statValue; i++) {
        bonusDice.push({
          faces: 4,
          source: `${stat.charAt(0).toUpperCase() + stat.slice(1)} (${statValue})`
        });
      }
    }
  });
  
  // If no specific stats match, use insight as default
  if (relevantStats.length === 0 && character.stats.insight > 0) {
    const insightValue = character.stats.insight;
    for (let i = 0; i < insightValue; i++) {
      bonusDice.push({
        faces: 4,
        source: `Insight (${insightValue})`
      });
    }
  }
}

/**
 * Add trait bonuses to dice pool
 */
function addTraitBonuses(bonusDice: Die[], character: Character, actionCard: ActionCard): void {
  if (!character.traits) return;
  
  character.traits.forEach(trait => {
    // Check if trait affects this action
    if (traitAffectsAction(trait, actionCard)) {
      // Add dice based on trait type
      const diceFaces = getTraitDiceFaces(trait);
      if (diceFaces > 0) {
        bonusDice.push({
          faces: diceFaces,
          source: `Trait: ${trait.name}`
        });
      }
    }
  });
}

/**
 * Check if a trait affects the given action
 */
function traitAffectsAction(trait: Character['traits'][0], actionCard: ActionCard): boolean {
  // Simple trait matching - in a real implementation, this would be more sophisticated
  const traitName = trait.name.toLowerCase();
  const actionTags = actionCard.tags.map(t => t.toLowerCase());
  
  // Check for direct tag matches
  if (actionTags.some(tag => traitName.includes(tag) || tag.includes(traitName))) {
    return true;
  }
  
  // Check for specific trait effects
  if (trait.effect && typeof trait.effect === 'string') {
    const effect = trait.effect.toLowerCase();
    if (effect.includes('all') || effect.includes('universal')) {
      return true;
    }
    if (actionTags.some(tag => effect.includes(tag))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get dice faces for a trait
 */
function getTraitDiceFaces(trait: Character['traits'][0]): number {
  if (!trait.effect || typeof trait.effect !== 'string') return 0;
  
  const effect = trait.effect.toLowerCase();
  
  // Look for dice notation in effect
  if (effect.includes('d6')) return 6;
  if (effect.includes('d4')) return 4;
  if (effect.includes('d8')) return 8;
  if (effect.includes('d10')) return 10;
  if (effect.includes('d12')) return 12;
  if (effect.includes('d20')) return 20;
  
  // Default to d4 for most traits
  return 4;
}

/**
 * Add action card dice modifier
 */
function addActionCardModifier(bonusDice: Die[], actionCard: ActionCard): void {
  if (!actionCard.diceModifier) return;
  
  // Parse dice modifier (e.g., "+1d4", "+2d6")
  const match = actionCard.diceModifier.match(/(\d+)d(\d+)/);
  if (match) {
    const count = parseInt(match[1]);
    const faces = parseInt(match[2]);
    
    for (let i = 0; i < count; i++) {
      bonusDice.push({
        faces,
        source: `Action: ${actionCard.name}`
      });
    }
  }
}

/**
 * Add affinity bonuses (placeholder implementation)
 */
function addAffinityBonuses(_bonusDice: Die[], _character: Character): void {
  // This will be implemented in Sprint 14 (Affinity System)
  // For now, just a placeholder
  if (_character.affinities) {
    // Check for relevant affinities and add dice
    // Implementation will be added in Sprint 14
  }
}

/**
 * Get difficulty class for an action
 */
export function getDifficultyClass(actionCard: ActionCard, predicateTags: string[]): number {
  // Base DC
  let dc = 10;
  
  // Adjust based on action difficulty
  if (actionCard.tags.includes('Combat')) {
    dc = 12; // Combat is harder
  }
  
  // Adjust based on scene danger
  if (predicateTags.includes('Dangerous')) {
    dc += 2;
  }
  
  // Adjust based on timescale
  // Longer timescales are generally easier
  // This would be implemented based on the current timescale
  
  return dc;
}
