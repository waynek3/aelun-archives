/**
 * Tests for targetFilter
 * Target: 60% coverage of core functionality
 */

import { describe, it, expect } from 'vitest';
import { getAvailableTargets, getTargetDescription } from '@/lib/engine/targetFilter';
import type { ActionCard, PredicateCard } from '@/types/cards';

// Helper to create mock action card
function createMockActionCard(overrides: Partial<ActionCard> = {}): ActionCard {
  return {
    id: 'test-action',
    name: 'Test Action',
    description: 'A test action',
    actionType: 'Targeted',
    tags: ['Universal'],
    timescales: ['Day'],
    failureField: [],
    ...overrides
  };
}

// Helper to create mock predicate card
function createMockPredicateCard(overrides: Partial<PredicateCard> = {}): PredicateCard {
  return {
    id: 'test-location',
    name: 'Test Location',
    description: 'A test location',
    sceneTags: ['Settlement'],
    timescale: 'Day',
    outcomeLogic: {},
    stateFlags: {},
    exits: [],
    ...overrides
  };
}

describe('targetFilter', () => {
  describe('getAvailableTargets', () => {
    it('should return current location for non-travel actions', () => {
      const action = createMockActionCard({ id: 'attack', tags: ['Combat'] });
      const currentPredicate = createMockPredicateCard({ id: 'current', sceneTags: ['Dangerous'] });
      const predicateMap = {
        current: currentPredicate,
        other: createMockPredicateCard({ id: 'other' })
      };

      const targets = getAvailableTargets(action, predicateMap, 'current');

      expect(targets).toContainEqual(currentPredicate);
    });

    it('should return adjacent locations for travel action', () => {
      const action = createMockActionCard({ id: 'travel', tags: ['Universal'] });
      const currentPredicate = createMockPredicateCard({
        id: 'current',
        exits: ['forest', 'town']
      });
      const forest = createMockPredicateCard({ id: 'forest', name: 'Forest' });
      const town = createMockPredicateCard({ id: 'town', name: 'Town' });
      const predicateMap = {
        current: currentPredicate,
        forest,
        town
      };

      const targets = getAvailableTargets(action, predicateMap, 'current');

      expect(targets).toContainEqual(forest);
      expect(targets).toContainEqual(town);
      expect(targets).not.toContainEqual(currentPredicate);
    });

    it('should filter sacred locations for pray action', () => {
      const action = createMockActionCard({ id: 'pray', tags: ['Divine'] });
      const currentPredicate = createMockPredicateCard({
        id: 'current',
        exits: ['temple', 'forest']
      });
      const temple = createMockPredicateCard({ id: 'temple', sceneTags: ['Sacred'] });
      const forest = createMockPredicateCard({ id: 'forest', sceneTags: ['Wilderness'] });
      const predicateMap = {
        current: currentPredicate,
        temple,
        forest
      };

      const targets = getAvailableTargets(action, predicateMap, 'current');

      // Prayer now only works at current location - deity selection happens in UI
      expect(targets).toContainEqual(currentPredicate); // Can pray at current location
      expect(targets).not.toContainEqual(temple); // Temple not in targets (deity selected separately)
      expect(targets).not.toContainEqual(forest); // Forest not in targets
      expect(targets).toHaveLength(1); // Only current location
    });

    it('should match tags correctly', () => {
      const action = createMockActionCard({ tags: ['Social'] });
      const settlement = createMockPredicateCard({
        id: 'settlement',
        sceneTags: ['Settlement'],
        exits: []
      });
      const wilderness = createMockPredicateCard({
        id: 'wilderness',
        sceneTags: ['Wilderness'],
        exits: []
      });
      const predicateMap = {
        settlement,
        wilderness
      };

      const targets = getAvailableTargets(action, predicateMap, 'settlement');

      expect(targets).toContainEqual(settlement);
    });

    it('should include all locations for universal actions', () => {
      const action = createMockActionCard({ tags: ['Universal'] });
      const current = createMockPredicateCard({ id: 'current', exits: ['other'] });
      const other = createMockPredicateCard({ id: 'other' });
      const predicateMap = {
        current,
        other
      };

      const targets = getAvailableTargets(action, predicateMap, 'current');

      expect(targets.length).toBeGreaterThan(0);
      expect(targets).toContainEqual(current);
    });

    it('should handle teleport action excluding current location', () => {
      const action = createMockActionCard({ id: 'teleport', tags: ['Magical'] });
      const current = createMockPredicateCard({ id: 'current' });
      const distant = createMockPredicateCard({ id: 'distant' });
      const predicateMap = {
        current,
        distant
      };

      const targets = getAvailableTargets(action, predicateMap, 'current');

      expect(targets).toContainEqual(distant);
      expect(targets).not.toContainEqual(current);
    });

    it('should handle empty predicate map', () => {
      const action = createMockActionCard();
      const predicateMap = {};

      const targets = getAvailableTargets(action, predicateMap, 'current');

      expect(targets).toEqual([]);
    });

    it('should use tag mappings for combat actions', () => {
      const action = createMockActionCard({ tags: ['Combat'] });
      const dangerous = createMockPredicateCard({
        id: 'dangerous',
        sceneTags: ['Dangerous'],
        exits: []
      });
      const safe = createMockPredicateCard({
        id: 'safe',
        sceneTags: ['Homestead'],
        exits: []
      });
      const predicateMap = {
        dangerous,
        safe
      };

      const targets = getAvailableTargets(action, predicateMap, 'dangerous');

      expect(targets).toContainEqual(dangerous);
    });
  });

  describe('getTargetDescription', () => {
    it('should return travel description for travel action', () => {
      const action = createMockActionCard({ id: 'travel' });
      const target = createMockPredicateCard({ name: 'Forest' });

      const description = getTargetDescription(action, target);

      expect(description).toContain('Travel to Forest');
    });

    it('should return pray description for sacred locations', () => {
      const action = createMockActionCard({ id: 'pray' });
      const target = createMockPredicateCard({ name: 'Temple', sceneTags: ['Sacred'] });

      const description = getTargetDescription(action, target);

      expect(description).toContain('sacred');
      expect(description).toContain('Temple');
    });

    it('should return social description for social actions', () => {
      const action = createMockActionCard({ id: 'negotiate', name: 'Negotiate', tags: ['Social'] });
      const target = createMockPredicateCard({ name: 'Marketplace' });

      const description = getTargetDescription(action, target);

      expect(description).toContain('negotiate');
      expect(description).toContain('Marketplace');
    });

    it('should return combat description for combat actions', () => {
      const action = createMockActionCard({ id: 'attack', name: 'Attack', tags: ['Combat'] });
      const target = createMockPredicateCard({ name: 'Bandit Camp' });

      const description = getTargetDescription(action, target);

      expect(description).toContain('attack');
      expect(description).toContain('Bandit Camp');
    });

    it('should return generic description for other actions', () => {
      const action = createMockActionCard({ name: 'Search' });
      const target = createMockPredicateCard({ name: 'Library' });

      const description = getTargetDescription(action, target);

      expect(description).toContain('search');
      expect(description).toContain('Library');
    });

    it('should handle stealth actions', () => {
      const action = createMockActionCard({ name: 'Sneak', tags: ['Stealth'] });
      const target = createMockPredicateCard({ name: 'Guard Tower' });

      const description = getTargetDescription(action, target);

      expect(description).toContain('sneak');
      expect(description).toContain('Guard Tower');
    });

    it('should handle magical actions', () => {
      const action = createMockActionCard({ name: 'Cast Spell', tags: ['Magical'] });
      const target = createMockPredicateCard({ name: 'Ritual Circle' });

      const description = getTargetDescription(action, target);

      expect(description).toContain('cast spell');
      expect(description).toContain('Ritual Circle');
    });

    it('should handle exploration actions', () => {
      const action = createMockActionCard({ name: 'Explore', tags: ['Exploration'] });
      const target = createMockPredicateCard({ name: 'Cave' });

      const description = getTargetDescription(action, target);

      expect(description).toContain('Explore');
      expect(description).toContain('Cave');
    });
  });
});
