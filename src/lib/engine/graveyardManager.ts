/**
 * Graveyard Manager
 * Handles character death, graveyard entry creation, and graveyard operations
 */

import type { Character } from '@/types/character';
import type { GraveyardEntry } from '@/types/meta';
import { openDB, put, getAll, del } from '@/lib/persistence/indexedDB';
import { DB_NAME, DB_VERSION, upgrade } from '@/lib/persistence/migrations';

/**
 * Create a graveyard entry from a dead character
 */
export function createGraveyardEntry(
  character: Character,
  causeOfDeath: string
): GraveyardEntry {
  const achievements = extractAchievements(character);
  const peakAffinities = character.affinities || {};

  return {
    characterId: character.id,
    name: character.name,
    lifepath: character.lifepath?.map(l => l.name) || [],
    survived: character.turnCount || 0,
    diedAt: character.worldState?.location || 'Unknown',
    causeOfDeath,
    achievements,
    peakAffinities,
    timestamp: Date.now()
  };
}

/**
 * Add a character to the graveyard
 */
export async function addToGraveyard(entry: GraveyardEntry): Promise<void> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade });
  await put(db, 'graveyard', entry);
}

/**
 * Get all graveyard entries
 */
export async function getGraveyardEntries(): Promise<GraveyardEntry[]> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade });
  return await getAll<GraveyardEntry>(db, 'graveyard');
}

/**
 * Delete a graveyard entry
 */
export async function deleteGraveyardEntry(characterId: string): Promise<void> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade });
  await del(db, 'graveyard', characterId);
}

/**
 * Extract achievements from character
 */
function extractAchievements(character: Character): string[] {
  const achievements: string[] = [];
  
  // Basic survival achievements
  if ((character.turnCount || 0) >= 10) {
    achievements.push('Survivor (10+ turns)');
  }
  if ((character.turnCount || 0) >= 50) {
    achievements.push('Veteran (50+ turns)');
  }
  if ((character.turnCount || 0) >= 100) {
    achievements.push('Legend (100+ turns)');
  }

  // Affinity achievements
  const affinities = character.affinities || {};
  for (const [entity, value] of Object.entries(affinities)) {
    if (value >= 5) {
      achievements.push(`Favored by ${entity} (+${value})`);
    }
    if (value <= -5) {
      achievements.push(`Hated by ${entity} (${value})`);
    }
  }

  // Discovery achievements
  const discovered = character.worldState?.discovered || {};
  const totalDiscovered = Object.values(discovered).flat().length;
  if (totalDiscovered >= 5) {
    achievements.push('Explorer (5+ discoveries)');
  }
  if (totalDiscovered >= 20) {
    achievements.push('Scholar (20+ discoveries)');
  }

  // Trait achievements
  if ((character.traits?.length || 0) >= 5) {
    achievements.push('Well-Traveled (5+ traits)');
  }

  return achievements;
}

/**
 * Get graveyard statistics
 */
export async function getGraveyardStats(): Promise<{
  totalCharacters: number;
  totalTurns: number;
  averageSurvival: number;
  longestSurvival: number;
  mostCommonCause: string;
}> {
  const entries = await getGraveyardEntries();
  
  if (entries.length === 0) {
    return {
      totalCharacters: 0,
      totalTurns: 0,
      averageSurvival: 0,
      longestSurvival: 0,
      mostCommonCause: 'None'
    };
  }

  const totalTurns = entries.reduce((sum, entry) => sum + entry.survived, 0);
  const averageSurvival = totalTurns / entries.length;
  const longestSurvival = Math.max(...entries.map(e => e.survived));
  
  // Find most common cause of death
  const causeCounts: Record<string, number> = {};
  entries.forEach(entry => {
    causeCounts[entry.causeOfDeath] = (causeCounts[entry.causeOfDeath] || 0) + 1;
  });
  const mostCommonCause = Object.entries(causeCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

  return {
    totalCharacters: entries.length,
    totalTurns,
    averageSurvival: Math.round(averageSurvival * 10) / 10,
    longestSurvival,
    mostCommonCause
  };
}