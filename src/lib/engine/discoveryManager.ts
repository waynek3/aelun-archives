/**
 * Discovery Manager
 * Handles content discovery tracking and compendium management
 */

import type { Compendium, AffinityHistoryEntry } from '@/types/meta';
import { getMetaProgression, updateMetaProgression } from '@/lib/persistence/metaProgression';

/**
 * Discover content and update compendium
 */
export async function discoverContent(
  category: 'cards' | 'predicates' | 'traits' | 'affinities' | 'lore',
  id: string
): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    return
  }
  await updateMetaProgression((meta) => {
    const list = getDiscoveryList(meta.compendium, category);
    if (!list.includes(id)) {
      list.push(id);
      meta.compendium.completionPercentage = calculateCompletionPercentage(meta.compendium);
    }
  });
}

/**
 * Get current compendium state
 */
export async function getCompendium(): Promise<Compendium> {
  const meta = await getMetaProgression();
  return meta.compendium;
}

export async function getAffinityHistory(): Promise<Record<string, AffinityHistoryEntry>> {
  const meta = await getMetaProgression();
  return meta.affinityHistory ?? {};
}

/**
 * Check if content is discovered
 */
export async function isDiscovered(
  category: 'cards' | 'predicates' | 'traits' | 'affinities' | 'lore',
  id: string
): Promise<boolean> {
  const compendium = await getCompendium();
  const list = getDiscoveryList(compendium, category);
  return list.includes(id);
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

function getDiscoveryList(
  compendium: Compendium,
  category: 'cards' | 'predicates' | 'traits' | 'affinities' | 'lore'
): string[] {
  switch (category) {
    case 'cards':
      return compendium.discoveredCards;
    case 'predicates':
      return compendium.discoveredPredicates;
    case 'traits':
      return compendium.discoveredTraits;
    case 'affinities':
      return compendium.discoveredAffinities;
    case 'lore':
      return compendium.loreFragments;
    default:
      return compendium.discoveredCards;
  }
}