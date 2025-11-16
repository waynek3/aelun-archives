/**
 * Tests for dicePoolBuilder
 * Target: 60% coverage of core functionality
 */

import { describe, it, expect } from 'vitest';
import { buildDicePool, getDifficultyClass } from '@/lib/engine/dicePoolBuilder';
import type { Character } from '@/types/character';
import type { ActionCard } from '@/types/cards';

// Helper to create a mock character
function createMockCharacter(): Character {
  return {
    id: 'test-char',
    name: 'Test Character',
    lifepath: [],
    stats: {
      strength: 3,
      agility: 2,
      insight: 2,
      charisma: 1,
      fortitude: 2,
      will: 2,
    },
    traits: [
      { id: 'warrior', name: 'Warrior', type: 'Passive', effect: '+1d4 to Combat actions' },
      { id: 'devout', name: 'Devout', type: 'Passive', effect: '+1d6 to Divine actions' }
    ],
    actionDeck: [],
    currentHP: 100,
    maxHP: 100,
    affinities: {},
    location: 'homestead',
    worldState: {
      location: 'homestead',
      flags: {},
      resources: {},
      discovered: {},
    },
    createdAt: Date.now(),
    turnCount: 0,
  };
}

// Helper to create a mock action card
function createMockActionCard(overrides: Partial<ActionCard> = {}): ActionCard {
  return {
    id: 'test-action',
    name: 'Test Action',
    description: 'A test action',
    actionType: 'Untargeted',
    tags: ['Universal'],
    timescales: ['Encounter'],
    failureField: [],
    ...overrides
  };
}

describe('dicePoolBuilder', () => {
  describe('buildDicePool', () => {
    it('should create base dice pool with 1 advantage die', () => {
      const character = createMockCharacter();
      const actionCard = createMockActionCard();

      const pool = buildDicePool({ character, actionCard });

      expect(pool.advantageDice).toBe(1);
      expect(pool.bonusDice).toBeDefined();
    });

    it('should add advantage dice for duplicate cards', () => {
      const character = createMockCharacter();
      const actionCard = createMockActionCard();

      const pool = buildDicePool({
        character,
        actionCard,
        duplicateCards: 2
      });

      expect(pool.advantageDice).toBe(3); // 1 base + 2 duplicates
    });

    it('should add stat bonuses for matching tags', () => {
      const character = createMockCharacter();
      const actionCard = createMockActionCard({ tags: ['Combat'] });

      const pool = buildDicePool({ character, actionCard });

      // Should get strength bonus (3 dice for strength = 3)
      const strengthDice = pool.bonusDice.filter(d => d.source.includes('Strength'));
      expect(strengthDice.length).toBe(3);
      expect(strengthDice[0].faces).toBe(4);
    });

    it('should add trait bonuses for matching actions', () => {
      const character = createMockCharacter();
      const actionCard = createMockActionCard({ tags: ['Combat'] });

      const pool = buildDicePool({ character, actionCard });

      // Should include warrior trait bonus
      const traitDice = pool.bonusDice.filter(d => d.source.includes('Trait'));
      expect(traitDice.length).toBeGreaterThan(0);
    });

    it('should add action card dice modifier', () => {
      const character = createMockCharacter();
      const actionCard = createMockActionCard({ diceModifier: '+2d6' });

      const pool = buildDicePool({ character, actionCard });

      const actionDice = pool.bonusDice.filter(d =>
        d.source.includes('Action') && d.faces === 6
      );
      expect(actionDice.length).toBe(2);
    });

    it('should handle universal actions with insight stat', () => {
      const character = createMockCharacter();
      const actionCard = createMockActionCard({ tags: ['Universal'] });

      const pool = buildDicePool({ character, actionCard });

      const insightDice = pool.bonusDice.filter(d => d.source.includes('Insight'));
      expect(insightDice.length).toBe(character.stats.insight);
    });

    it('should map social tags to charisma stat', () => {
      const character = createMockCharacter();
      const actionCard = createMockActionCard({ tags: ['Social'] });

      const pool = buildDicePool({ character, actionCard });

      const charismaDice = pool.bonusDice.filter(d => d.source.includes('Charisma'));
      expect(charismaDice.length).toBe(character.stats.charisma);
    });

    it('should map divine tags to will stat', () => {
      const character = createMockCharacter();
      const actionCard = createMockActionCard({ tags: ['Divine'] });

      const pool = buildDicePool({ character, actionCard });

      const willDice = pool.bonusDice.filter(d => d.source.includes('Will'));
      expect(willDice.length).toBe(character.stats.will);
    });

    it('should handle multiple tag matches', () => {
      const character = createMockCharacter();
      const actionCard = createMockActionCard({ tags: ['Combat', 'Physical'] });

      const pool = buildDicePool({ character, actionCard });

      // Both tags map to strength, so should get strength bonus
      const strengthDice = pool.bonusDice.filter(d => d.source.includes('Strength'));
      expect(strengthDice.length).toBeGreaterThan(0);
    });

    it('should handle characters with no relevant stats', () => {
      const character = createMockCharacter();
      character.stats = {
        strength: 0,
        agility: 0,
        insight: 0,
        charisma: 0,
        fortitude: 0,
        will: 0,
      };
      const actionCard = createMockActionCard({ tags: ['Combat'] });

      const pool = buildDicePool({ character, actionCard });

      expect(pool.advantageDice).toBe(1);
      // Should have minimal or no bonus dice from stats
    });

    it('should handle characters with no traits', () => {
      const character = createMockCharacter();
      character.traits = [];
      const actionCard = createMockActionCard({ tags: ['Combat'] });

      const pool = buildDicePool({ character, actionCard });

      const traitDice = pool.bonusDice.filter(d => d.source.includes('Trait'));
      expect(traitDice.length).toBe(0);
    });
  });

  describe('getDifficultyClass', () => {
    it('should return base DC of 10 for normal actions', () => {
      const actionCard = createMockActionCard();
      const dc = getDifficultyClass(actionCard, []);

      expect(dc).toBe(10);
    });

    it('should increase DC for combat actions', () => {
      const actionCard = createMockActionCard({ tags: ['Combat'] });
      const dc = getDifficultyClass(actionCard, []);

      expect(dc).toBe(12);
    });

    it('should increase DC for dangerous scenes', () => {
      const actionCard = createMockActionCard();
      const dc = getDifficultyClass(actionCard, ['Dangerous']);

      expect(dc).toBe(12); // base 10 + 2 for dangerous
    });

    it('should stack combat and dangerous modifiers', () => {
      const actionCard = createMockActionCard({ tags: ['Combat'] });
      const dc = getDifficultyClass(actionCard, ['Dangerous']);

      expect(dc).toBe(14); // combat 12 + 2 for dangerous
    });

    it('should handle multiple scene tags', () => {
      const actionCard = createMockActionCard();
      const dc = getDifficultyClass(actionCard, ['Dangerous', 'Mysterious']);

      expect(dc).toBeGreaterThanOrEqual(10);
    });
  });
});
