/**
 * Card Evolution Manager
 * Handles failure tracking and card unlock progression
 */

import type { ActionCard } from '@/types/cards';
import type { MetaProgression } from '@/types/meta';
import { openDB, get, put } from '@/lib/persistence/indexedDB';
import { DB_NAME, DB_VERSION, upgrade } from '@/lib/persistence/migrations';
import { discoverContent } from './discoveryManager';

export interface CardProgress {
  cardId: string;
  failureCount: number;
  tiersUsed: boolean[];
}

export interface UnlockResult {
  unlocked: boolean;
  tier: number;
  pool: string[];
  cardId: string;
}

/**
 * Track a failure for a specific card
 */
export async function trackFailure(cardId: string): Promise<UnlockResult | null> {
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

  // Get or create card progress
  const cardProgress = await getCardProgress(cardId, meta);
  
  // Increment failure count
  cardProgress.failureCount += 1;
  
  // Check each tier in order
  for (let i = 0; i < cardProgress.tiersUsed.length; i++) {
    // Skip if already used
    if (cardProgress.tiersUsed[i]) {
      continue;
    }
    
    // Get card definition to check tier requirements
    const card = await getActionCard(cardId);
    if (!card || !card.failureField || i >= card.failureField.length) {
      continue;
    }
    
    const tier = card.failureField[i];
    
    // Check if threshold met
    if (cardProgress.failureCount >= tier.requiresFailures) {
      // Mark tier as used
      cardProgress.tiersUsed[i] = true;
      
      // Save progress
      await saveCardProgress(cardId, cardProgress, meta);
      
      // Return unlock options
      return {
        unlocked: true,
        tier: i,
        pool: tier.pool,
        cardId: cardId
      };
    }
  }
  
  // No unlock this time, just save progress
  await saveCardProgress(cardId, cardProgress, meta);
  return null;
}

/**
 * Select an unlock from a tier pool
 */
export async function selectUnlock(
  cardId: string,
  tier: number,
  selectedCard: string
): Promise<void> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade });
  
  // Get current meta progression
  const meta = await get<MetaProgression>(db, 'metaProgression', 'main');
  if (!meta) {
    throw new Error('Meta progression not found');
  }
  
  // Update card unlocks
  if (!meta.cardUnlocks[cardId]) {
    meta.cardUnlocks[cardId] = {};
  }
  
  meta.cardUnlocks[cardId][tier] = selectedCard;
  
  // Save back to database
  await put(db, 'metaProgression', meta, 'main');
  
  // Discover the unlocked card
  await discoverContent('cards', selectedCard);
}

/**
 * Get card progress for a specific card
 */
async function getCardProgress(cardId: string, meta: MetaProgression): Promise<CardProgress> {
  // For now, store progress in a simple way
  // In a real implementation, this would be in a separate store
  const progressKey = `cardProgress_${cardId}`;
  const stored = (meta as unknown as Record<string, unknown>)[progressKey] as CardProgress | undefined;
  
  if (stored) {
    return stored;
  }
  
  // Get card definition to determine number of tiers
  const card = await getActionCard(cardId);
  const tierCount = card?.failureField?.length || 0;
  
  return {
    cardId,
    failureCount: 0,
    tiersUsed: new Array(tierCount).fill(false)
  };
}

/**
 * Save card progress
 */
async function saveCardProgress(
  cardId: string,
  progress: CardProgress,
  meta: MetaProgression
): Promise<void> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade });
  
  // Store progress in meta progression
  (meta as unknown as Record<string, unknown>)[`cardProgress_${cardId}`] = progress;
  
  // Save back to database
  await put(db, 'metaProgression', meta, 'main');
}

/**
 * Get action card by ID
 */
async function getActionCard(cardId: string): Promise<ActionCard | null> {
  // This would need to be implemented to load from game content
  // For now, return null
  console.log(`Loading action card: ${cardId}`);
  return null;
}

/**
 * Get available unlocks for a card
 */
export async function getAvailableUnlocks(cardId: string): Promise<{
  currentTier: number;
  failuresNeeded: number;
  currentFailures: number;
  availablePools: string[][];
}> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade });
  const meta = await get<MetaProgression>(db, 'metaProgression', 'main');
  
  if (!meta) {
    return {
      currentTier: 0,
      failuresNeeded: 0,
      currentFailures: 0,
      availablePools: []
    };
  }
  
  const progress = await getCardProgress(cardId, meta);
  const card = await getActionCard(cardId);
  
  if (!card || !card.failureField) {
    return {
      currentTier: 0,
      failuresNeeded: 0,
      currentFailures: progress.failureCount,
      availablePools: []
    };
  }
  
  const availablePools: string[][] = [];
  let currentTier = 0;
  let failuresNeeded = 0;
  
  for (let i = 0; i < card.failureField.length; i++) {
    const tier = card.failureField[i];
    
    if (progress.failureCount >= tier.requiresFailures && !progress.tiersUsed[i]) {
      availablePools.push(tier.pool);
      currentTier = i;
      failuresNeeded = tier.requiresFailures;
    }
  }
  
  return {
    currentTier,
    failuresNeeded,
    currentFailures: progress.failureCount,
    availablePools
  };
}