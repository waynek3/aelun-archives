/**
 * Tests for cardEvolution
 * Target: 60% coverage of core functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackFailure, selectUnlock, getAvailableUnlocks } from '@/lib/engine/cardEvolution';

// Mock the dependencies
vi.mock('@/lib/persistence/metaProgression', () => ({
  getMetaProgression: vi.fn(() => Promise.resolve({
    version: 1,
    cardUnlocks: {},
    graveyard: [],
    compendium: {
      discoveredCards: new Set(),
      discoveredPredicates: new Set(),
      discoveredTraits: new Set(),
      discoveredAffinities: new Set(),
      loreFragments: new Set(),
      completionPercentage: 0
    },
    statistics: {}
  })),
  saveMetaProgression: vi.fn(() => Promise.resolve())
}));

vi.mock('@/lib/utils/content', () => ({
  getActionCards: vi.fn(() => Promise.resolve({
    'quick_attack': {
      id: 'quick_attack',
      name: 'Quick Attack',
      description: 'A fast attack',
      actionType: 'Untargeted',
      tags: ['Combat'],
      timescales: ['Encounter'],
      failureField: [
        {
          tier: 0,
          requiresFailures: 1,
          maxUnlocks: 1,
          pool: ['quick_attack_plus', 'riposte']
        },
        {
          tier: 1,
          requiresFailures: 3,
          maxUnlocks: 1,
          pool: ['flurry', 'counter']
        }
      ]
    },
    'pray': {
      id: 'pray',
      name: 'Pray',
      description: 'Pray to the gods',
      actionType: 'Targeted',
      tags: ['Divine'],
      timescales: ['Day'],
      failureField: []
    }
  }))
}));

vi.mock('@/lib/engine/discoveryManager', () => ({
  discoverContent: vi.fn(() => Promise.resolve())
}));

describe('cardEvolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackFailure', () => {
    it('should increment failure count', async () => {
      const result = await trackFailure('quick_attack');

      // First failure should unlock tier 0
      expect(result).not.toBeNull();
      expect(result?.unlocked).toBe(true);
      expect(result?.tier).toBe(0);
    });

    it('should unlock tier 0 after 1 failure', async () => {
      const result = await trackFailure('quick_attack');

      expect(result?.tier).toBe(0);
      expect(result?.pool).toEqual(['quick_attack_plus', 'riposte']);
    });

    it('should not unlock tier 1 after only 1 failure', async () => {
      const result1 = await trackFailure('quick_attack');
      expect(result1?.tier).toBe(0);

      const result2 = await trackFailure('quick_attack');
      // Second failure won't unlock tier 1 (requires 3 total)
      expect(result2).toBeNull();
    });

    it('should handle cards with no failure field', async () => {
      const result = await trackFailure('pray');

      expect(result).toBeNull();
    });

    it('should handle non-existent cards', async () => {
      const result = await trackFailure('non_existent_card');

      expect(result).toBeNull();
    });

    it('should return unlock result with correct cardId', async () => {
      const result = await trackFailure('quick_attack');

      expect(result?.cardId).toBe('quick_attack');
    });
  });

  describe('selectUnlock', () => {
    it('should save selected card unlock', async () => {
      await selectUnlock('quick_attack', 0, 'riposte');

      const { saveMetaProgression } = await import('@/lib/persistence/metaProgression');
      expect(saveMetaProgression).toHaveBeenCalled();
    });

    it('should discover selected card', async () => {
      await selectUnlock('quick_attack', 0, 'riposte');

      const { discoverContent } = await import('@/lib/engine/discoveryManager');
      expect(discoverContent).toHaveBeenCalledWith('cards', 'riposte');
    });

    it('should handle multiple unlocks for same card', async () => {
      await selectUnlock('quick_attack', 0, 'riposte');
      await selectUnlock('quick_attack', 1, 'flurry');

      const { saveMetaProgression } = await import('@/lib/persistence/metaProgression');
      expect(saveMetaProgression).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAvailableUnlocks', () => {
    it('should return unlock status for a card', async () => {
      const result = await getAvailableUnlocks('quick_attack');

      expect(result).toHaveProperty('currentTier');
      expect(result).toHaveProperty('failuresNeeded');
      expect(result).toHaveProperty('currentFailures');
      expect(result).toHaveProperty('availablePools');
    });

    it('should return empty data for cards without failure fields', async () => {
      const result = await getAvailableUnlocks('pray');

      expect(result.currentTier).toBe(0);
      expect(result.failuresNeeded).toBe(0);
      expect(result.currentFailures).toBe(0);
      expect(result.availablePools).toEqual([]);
    });

    it('should handle non-existent cards gracefully', async () => {
      const result = await getAvailableUnlocks('non_existent');

      expect(result.currentTier).toBe(0);
      expect(result.availablePools).toEqual([]);
    });
  });
});
