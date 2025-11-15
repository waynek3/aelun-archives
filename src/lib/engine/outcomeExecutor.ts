/**
 * Outcome Executor
 * Applies the effects of action outcomes to character and game state
 */

import type { Character } from '@/types/character';
import type { OutcomeEffect } from './predicateEngine';
import { discoverContent } from './discoveryManager';
import { modifyAffinity } from './affinityManager';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Apply outcome effects to character and game state
 */
export function executeOutcomeEffects(
  character: Character,
  effects: OutcomeEffect[]
): { updatedCharacter: Character; notifications: string[]; isDead: boolean } {
  const notifications: string[] = [];
  let updatedCharacter = { ...character };

  for (const effect of effects) {
    const result = applyEffect(updatedCharacter, effect);
    updatedCharacter = result.character;
      const allowNotification =
        effect.type !== 'affinity' || useSettingsStore.getState().showAffinityHints;
      if (result.notification && allowNotification) {
      notifications.push(result.notification);
    }
  }

  // Check for death after all effects are applied
  const isDead = (updatedCharacter.currentHP || 0) <= 0;

  return { updatedCharacter, notifications, isDead };
}

/**
 * Apply a single effect to the character
 */
function applyEffect(
  character: Character,
  effect: OutcomeEffect
): { character: Character; notification?: string } {
  switch (effect.type) {
    case 'damage':
      return applyDamage(character, effect);
    case 'heal':
      return applyHeal(character, effect);
    case 'gain':
      return applyGain(character, effect);
    case 'lose':
      return applyLose(character, effect);
    case 'affinity':
      return applyAffinity(character, effect);
    case 'unlock':
      return applyUnlock(character, effect);
    case 'flag':
      return applyFlag(character, effect);
    case 'transition':
      return applyTransition(character, effect);
    default:
      console.warn(`Unknown effect type: ${effect.type}`);
      return { character };
  }
}

/**
 * Apply damage to character
 */
function applyDamage(character: Character, effect: OutcomeEffect): { character: Character; notification?: string } {
  const damage = effect.value || 0;
  const newHP = Math.max(0, (character.currentHP || 0) - damage);
  
  return {
    character: {
      ...character,
      currentHP: newHP
    },
    notification: damage > 0 ? `You take ${damage} damage.` : undefined
  };
}

/**
 * Apply healing to character
 */
function applyHeal(character: Character, effect: OutcomeEffect): { character: Character; notification?: string } {
  const healing = effect.value || 0;
  const maxHP = character.maxHP || 10;
  const newHP = Math.min(maxHP, (character.currentHP || 0) + healing);
  
  return {
    character: {
      ...character,
      currentHP: newHP
    },
    notification: healing > 0 ? `You heal ${healing} health.` : undefined
  };
}

/**
 * Apply resource gain
 */
function applyGain(character: Character, effect: OutcomeEffect): { character: Character; notification?: string } {
  const resource = effect.resource || 'goods';
  const amount = effect.value || 1;
  
  // For now, just track in world state
  const worldState = character.worldState || {};
  const resources = worldState.resources || {};
  resources[resource] = (resources[resource] || 0) + amount;
  
  return {
    character: {
      ...character,
      worldState: {
        ...worldState,
        resources
      }
    },
    notification: `You gain ${amount} ${resource}.`
  };
}

/**
 * Apply resource loss
 */
function applyLose(character: Character, effect: OutcomeEffect): { character: Character; notification?: string } {
  const resource = effect.resource || 'goods';
  const amount = effect.value || 1;
  
  const worldState = character.worldState || {};
  const resources = worldState.resources || {};
  resources[resource] = Math.max(0, (resources[resource] || 0) - amount);
  
  return {
    character: {
      ...character,
      worldState: {
        ...worldState,
        resources
      }
    },
    notification: `You lose ${amount} ${resource}.`
  };
}

/**
 * Apply affinity change
 */
function applyAffinity(character: Character, effect: OutcomeEffect): { character: Character; notification?: string } {
  const entity = effect.entity || 'unknown';
  const change = effect.value || 0;
  
  const updatedCharacter = modifyAffinity(character, entity, change);
  
  return {
    character: updatedCharacter,
    notification: change > 0 
      ? `${entity} likes you more (+${change})`
      : change < 0 
      ? `${entity} dislikes you more (${change})`
      : undefined
  };
}

/**
 * Apply content unlock
 */
function applyUnlock(character: Character, effect: OutcomeEffect): { character: Character; notification?: string } {
  const category = effect.category || 'unknown';
  const id = effect.id || 'unknown';
  
  // Discover content in compendium
  discoverContent(category as 'cards' | 'predicates' | 'traits' | 'affinities' | 'lore', id).catch(error => {
    console.error('Failed to discover content:', error);
  });
  
  // Also track in world state for character-specific tracking
  const worldState = character.worldState || {};
  const discovered = worldState.discovered || {};
  const categoryDiscovered = discovered[category] || [];
  
  if (!categoryDiscovered.includes(id)) {
    categoryDiscovered.push(id);
    discovered[category] = categoryDiscovered;
  }
  
  return {
    character: {
      ...character,
      worldState: {
        ...worldState,
        discovered
      }
    },
    notification: `You discover: ${id}!`
  };
}

/**
 * Apply flag change
 */
function applyFlag(character: Character, effect: OutcomeEffect): { character: Character; notification?: string } {
  const flag = effect.flag || 'unknown';
  const value = effect.flagValue !== undefined ? effect.flagValue : true;
  
  const worldState = character.worldState || {};
  const flags = worldState.flags || {};
  
  return {
    character: {
      ...character,
      worldState: {
        ...worldState,
        flags: {
          ...flags,
          [flag]: value
        }
      }
    },
    notification: `Flag set: ${flag} = ${value}`
  };
}

/**
 * Apply location transition
 */
function applyTransition(character: Character, effect: OutcomeEffect): { character: Character; notification?: string } {
  const location = effect.location || character.worldState?.location || 'homestead';
  
  return {
    character: {
      ...character,
      worldState: {
        ...character.worldState,
        location
      }
    },
    notification: `You travel to ${location}.`
  };
}