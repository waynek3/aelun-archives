/**
 * Card Evolution Manager
 * Handles failure tracking and card unlock progression
 */

import type { ActionCard } from '@/types/cards';
import { discoverContent } from './discoveryManager';
import { getMetaProgression, saveMetaProgression } from '@/lib/persistence/metaProgression';
import { getActionCards } from '@/lib/utils/content';

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
  const meta = await getMetaProgression();
  const card = await getActionCard(cardId);

  if (!card || !card.failureField || card.failureField.length === 0) {
    console.warn(`[cardEvolution] No failure field data found for card "${cardId}".`);
    return null;
  }

  const cardProgress = await getCardProgress(cardId, meta, card.failureField.length);
  cardProgress.failureCount += 1;

  for (let i = 0; i < card.failureField.length; i++) {
    if (cardProgress.tiersUsed[i]) continue;

    const tier = card.failureField[i];
    if (cardProgress.failureCount >= tier.requiresFailures) {
      cardProgress.tiersUsed[i] = true;
      await saveMetaProgression(meta);
      return {
        unlocked: true,
        tier: i,
        pool: tier.pool,
        cardId,
      };
    }
  }

  await saveMetaProgression(meta);
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
  const meta = await getMetaProgression();

  if (!meta.cardUnlocks[cardId]) {
    meta.cardUnlocks[cardId] = {};
  }

  meta.cardUnlocks[cardId][tier] = selectedCard;
  await saveMetaProgression(meta);

  await discoverContent('cards', selectedCard);
}

/**
 * Get card progress for a specific card
 */
async function getCardProgress(
  cardId: string,
  meta: Record<string, unknown>,
  tierCount: number
): Promise<CardProgress> {
  const progressKey = `cardProgress_${cardId}`;
  const stored = meta[progressKey] as CardProgress | undefined;

  if (stored) {
    if (stored.tiersUsed.length < tierCount) {
      stored.tiersUsed = [
        ...stored.tiersUsed,
        ...new Array(tierCount - stored.tiersUsed.length).fill(false),
      ];
    } else if (stored.tiersUsed.length > tierCount) {
      stored.tiersUsed = stored.tiersUsed.slice(0, tierCount);
    }
    return stored;
  }

  const fresh: CardProgress = {
    cardId,
    failureCount: 0,
    tiersUsed: new Array(tierCount).fill(false),
  };

  meta[progressKey] = fresh;
  return fresh;
}

/**
 * Get action card by ID
 */
async function getActionCard(cardId: string): Promise<ActionCard | null> {
  const cards = await getActionCards();
  return cards[cardId] ?? null;
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
  const meta = await getMetaProgression();
  const card = await getActionCard(cardId);

  if (!card || !card.failureField) {
    return {
      currentTier: 0,
      failuresNeeded: 0,
      currentFailures: 0,
      availablePools: [],
    };
  }

  const progress = await getCardProgress(cardId, meta, card.failureField.length);
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
    availablePools,
  };
}

export async function getUnlockedCardIds(): Promise<string[]> {
  const meta = await getMetaProgression();
  const ids = Object.values(meta.cardUnlocks || {}).flatMap((tierMap) =>
    Object.values(tierMap || {})
  );
  return Array.from(new Set(ids));
}