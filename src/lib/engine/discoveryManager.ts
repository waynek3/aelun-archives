/**
 * Discovery Manager
 * Handles content discovery tracking and compendium management
 */

import type { Compendium, MetaProgression } from '@/types/meta';
import { openDB, get, put } from '@/lib/persistence/indexedDB';
import { DB_NAME, DB_VERSION, upgrade } from '@/lib/persistence/migrations';

/**
 * Discover content and update compendium
 */
export async function discoverContent(
  category: 'cards' | 'predicates' | 'traits' | 'affinities' | 'lore',
  id: string
): Promise<void> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade });
  
  // Get current meta progression
  let meta = await get<MetaProgression>(db, 'metaProgression', 'main');
  if (!meta) {
    meta = {
      version: 1,
      cardUnlocks: {},
      graveyard: [],
      compendium: {
        discoveredCards: [],
        discoveredPredicates: [],
        discoveredTraits: [],
        discoveredAffinities: [],
        loreFragments: [],
        completionPercentage: 0
      },
      statistics: {
        totalRuns: 0,
        longestRunTurns: 0,
        totalDeaths: 0
      }
    };
  }

  // Update the appropriate discovery array
  switch (category) {
    case 'cards':
      if (!meta.compendium.discoveredCards.includes(id)) {
        meta.compendium.discoveredCards.push(id);
      }
      break;
    case 'predicates':
      if (!meta.compendium.discoveredPredicates.includes(id)) {
        meta.compendium.discoveredPredicates.push(id);
      }
      break;
    case 'traits':
      if (!meta.compendium.discoveredTraits.includes(id)) {
        meta.compendium.discoveredTraits.push(id);
      }
      break;
    case 'affinities':
      if (!meta.compendium.discoveredAffinities.includes(id)) {
        meta.compendium.discoveredAffinities.push(id);
      }
      break;
    case 'lore':
      if (!meta.compendium.loreFragments.includes(id)) {
        meta.compendium.loreFragments.push(id);
      }
      break;
  }

  // Update completion percentage
  meta.compendium.completionPercentage = calculateCompletionPercentage(meta.compendium);

  // Save back to database
  await put(db, 'metaProgression', meta, 'main');
}

/**
 * Get current compendium state
 */
export async function getCompendium(): Promise<Compendium> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade });
  const meta = await get<MetaProgression>(db, 'metaProgression', 'main');
  
  if (!meta || !meta.compendium) {
    return {
      discoveredCards: [],
      discoveredPredicates: [],
      discoveredTraits: [],
      discoveredAffinities: [],
      loreFragments: [],
      completionPercentage: 0
    };
  }

  return meta.compendium;
}

/**
 * Check if content is discovered
 */
export async function isDiscovered(
  category: 'cards' | 'predicates' | 'traits' | 'affinities' | 'lore',
  id: string
): Promise<boolean> {
  const compendium = await getCompendium();
  
  switch (category) {
    case 'cards':
      return compendium.discoveredCards.includes(id);
    case 'predicates':
      return compendium.discoveredPredicates.includes(id);
    case 'traits':
      return compendium.discoveredTraits.includes(id);
    case 'affinities':
      return compendium.discoveredAffinities.includes(id);
    case 'lore':
      return compendium.loreFragments.includes(id);
    default:
      return false;
  }
}

/**
 * Calculate completion percentage
 */
function calculateCompletionPercentage(compendium: Compendium): number {
  // This would need to be updated with actual total counts
  // For now, return a simple calculation
  const totalDiscovered = 
    compendium.discoveredCards.length +
    compendium.discoveredPredicates.length +
    compendium.discoveredTraits.length +
    compendium.discoveredAffinities.length +
    compendium.loreFragments.length;
  
  // Estimate total content (this should be calculated from actual content)
  const estimatedTotal = 200; // Placeholder
  
  return Math.min(100, Math.round((totalDiscovered / estimatedTotal) * 100));
}

/**
 * Get discovery statistics
 */
export async function getDiscoveryStats(): Promise<{
  totalDiscovered: number;
  cardsDiscovered: number;
  predicatesDiscovered: number;
  traitsDiscovered: number;
  affinitiesDiscovered: number;
  loreDiscovered: number;
  completionPercentage: number;
}> {
  const compendium = await getCompendium();
  
  return {
    totalDiscovered: 
      compendium.discoveredCards.length +
      compendium.discoveredPredicates.length +
      compendium.discoveredTraits.length +
      compendium.discoveredAffinities.length +
      compendium.loreFragments.length,
    cardsDiscovered: compendium.discoveredCards.length,
    predicatesDiscovered: compendium.discoveredPredicates.length,
    traitsDiscovered: compendium.discoveredTraits.length,
    affinitiesDiscovered: compendium.discoveredAffinities.length,
    loreDiscovered: compendium.loreFragments.length,
    completionPercentage: compendium.completionPercentage
  };
}