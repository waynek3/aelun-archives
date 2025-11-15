/**
 * Affinity Manager
 * Handles relationship tracking between player and entities
 */

import type { Character } from '@/types/character';
import { discoverContent } from './discoveryManager';
import { recordAffinityChange } from '@/lib/persistence/metaProgression';

export interface AffinityEntity {
  id: string;
  name: string;
  category: 'faction' | 'deity' | 'npc';
  description: string;
  thresholds: {
    hate: number;    // <= this value
    dislike: number; // <= this value
    neutral: number; // <= this value
    like: number;    // <= this value
    love: number;    // <= this value
  };
}

export interface AffinityChange {
  entity: string;
  change: number;
  reason: string;
}

/**
 * Modify affinity for an entity
 */
export function modifyAffinity(
  character: Character,
  entity: string,
  change: number
): Character {
  const affinities = character.affinities || {};
  const currentAffinity = affinities[entity] || 0;
  const newAffinity = Math.max(-10, Math.min(10, currentAffinity + change));
  
  // Discover the entity if not already known
  if (!affinities[entity]) {
    discoverContent('affinities', entity).catch(error => {
      console.error('Failed to discover affinity entity:', error);
    });
  }

  const updatedCharacter = {
    ...character,
    affinities: {
      ...affinities,
      [entity]: newAffinity
    }
  };

  recordAffinityChange(entity, newAffinity).catch((error) => {
    console.error('Failed to record affinity change:', error);
  });

  return updatedCharacter;
}

/**
 * Get affinity level description
 */
export function getAffinityLevel(score: number): string {
  if (score <= -8) return 'Hated';
  if (score <= -5) return 'Disliked';
  if (score <= -2) return 'Distrusted';
  if (score <= 1) return 'Neutral';
  if (score <= 4) return 'Liked';
  if (score <= 7) return 'Trusted';
  return 'Beloved';
}

/**
 * Get affinity color for display
 */
export function getAffinityColor(score: number): string {
  if (score <= -5) return 'text-red-400';
  if (score <= -2) return 'text-orange-400';
  if (score <= 1) return 'text-gray-400';
  if (score <= 4) return 'text-green-400';
  if (score <= 7) return 'text-blue-400';
  return 'text-purple-400';
}

/**
 * Check if affinity meets threshold
 */
export function meetsThreshold(score: number, threshold: number): boolean {
  return score >= threshold;
}

/**
 * Get all affinities for a character
 */
export function getCharacterAffinities(character: Character): Array<{
  entity: string;
  score: number;
  level: string;
  color: string;
}> {
  const affinities = character.affinities || {};
  
  return Object.entries(affinities).map(([entity, score]) => ({
    entity,
    score,
    level: getAffinityLevel(score),
    color: getAffinityColor(score)
  }));
}

/**
 * Get peak affinities (highest scores achieved)
 */
export function getPeakAffinities(character: Character): Record<string, number> {
  const affinities = character.affinities || {};
  const peakAffinities: Record<string, number> = {};
  
  // This would need to track historical peaks
  // For now, just return current affinities
  Object.entries(affinities).forEach(([entity, score]) => {
    peakAffinities[entity] = score;
  });
  
  return peakAffinities;
}

/**
 * Get affinity-based weight modifier
 */
export function getAffinityWeightModifier(affinity: number): number {
  // Convert affinity score to weight modifier
  // -10 to +10 affinity becomes 0.1 to 2.0 weight multiplier
  return Math.max(0.1, (affinity + 10) / 10);
}