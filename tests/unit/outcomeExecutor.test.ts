/**
 * Tests for outcomeExecutor
 * Target: 60% coverage of core functionality
 */

import { describe, it, expect } from 'vitest';
import { executeOutcomeEffects } from '@/lib/engine/outcomeExecutor';
import type { Character } from '@/types/character';
import type { OutcomeEffect } from '@/lib/engine/predicateEngine';

// Helper to create a mock character
function createMockCharacter(): Character {
  return {
    id: 'test-char',
    name: 'Test Character',
    lifepath: [],
    stats: {
      strength: 2,
      agility: 2,
      insight: 2,
      charisma: 2,
      fortitude: 2,
      will: 2,
    },
    traits: [],
    actionDeck: [],
    currentHP: 50,
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

describe('outcomeExecutor', () => {
  describe('executeOutcomeEffects', () => {
    it('should apply damage effects correctly', () => {
      const character = createMockCharacter();
      const effects: OutcomeEffect[] = [
        { type: 'damage', value: 10 }
      ];

      const result = executeOutcomeEffects(character, effects);

      expect(result.updatedCharacter.currentHP).toBe(40);
      expect(result.notifications).toContain('You take 10 damage.');
      expect(result.isDead).toBe(false);
    });

    it('should detect death when HP reaches 0', () => {
      const character = createMockCharacter();
      character.currentHP = 5;
      const effects: OutcomeEffect[] = [
        { type: 'damage', value: 10 }
      ];

      const result = executeOutcomeEffects(character, effects);

      expect(result.updatedCharacter.currentHP).toBe(0);
      expect(result.isDead).toBe(true);
    });

    it('should apply healing effects correctly', () => {
      const character = createMockCharacter();
      character.currentHP = 30;
      const effects: OutcomeEffect[] = [
        { type: 'heal', value: 20 }
      ];

      const result = executeOutcomeEffects(character, effects);

      expect(result.updatedCharacter.currentHP).toBe(50);
      expect(result.notifications).toContain('You heal 20 health.');
    });

    it('should not heal beyond max HP', () => {
      const character = createMockCharacter();
      character.currentHP = 95;
      const effects: OutcomeEffect[] = [
        { type: 'heal', value: 20 }
      ];

      const result = executeOutcomeEffects(character, effects);

      expect(result.updatedCharacter.currentHP).toBe(100);
    });

    it('should apply resource gain effects', () => {
      const character = createMockCharacter();
      const effects: OutcomeEffect[] = [
        { type: 'gain', resource: 'gold', value: 50 }
      ];

      const result = executeOutcomeEffects(character, effects);

      expect(result.updatedCharacter.worldState?.resources?.gold).toBe(50);
      expect(result.notifications).toContain('You gain 50 gold.');
    });

    it('should apply resource loss effects', () => {
      const character = createMockCharacter();
      character.worldState.resources = { gold: 100 };
      const effects: OutcomeEffect[] = [
        { type: 'lose', resource: 'gold', value: 30 }
      ];

      const result = executeOutcomeEffects(character, effects);

      expect(result.updatedCharacter.worldState?.resources?.gold).toBe(70);
      expect(result.notifications).toContain('You lose 30 gold.');
    });

    it('should not allow resources to go negative', () => {
      const character = createMockCharacter();
      character.worldState.resources = { gold: 20 };
      const effects: OutcomeEffect[] = [
        { type: 'lose', resource: 'gold', value: 50 }
      ];

      const result = executeOutcomeEffects(character, effects);

      expect(result.updatedCharacter.worldState?.resources?.gold).toBe(0);
    });

    it('should apply affinity changes', () => {
      const character = createMockCharacter();
      const effects: OutcomeEffect[] = [
        { type: 'affinity', entity: 'monastery', value: 2 }
      ];

      const result = executeOutcomeEffects(character, effects);

      expect(result.updatedCharacter.affinities.monastery).toBe(2);
      expect(result.notifications.length).toBeGreaterThan(0);
    });

    it('should apply flag changes', () => {
      const character = createMockCharacter();
      const effects: OutcomeEffect[] = [
        { type: 'flag', flag: 'quest_started', flagValue: true }
      ];

      const result = executeOutcomeEffects(character, effects);

      expect(result.updatedCharacter.worldState?.flags?.quest_started).toBe(true);
    });

    it('should apply location transitions', () => {
      const character = createMockCharacter();
      const effects: OutcomeEffect[] = [
        { type: 'transition', location: 'forest' }
      ];

      const result = executeOutcomeEffects(character, effects);

      expect(result.updatedCharacter.worldState?.location).toBe('forest');
      expect(result.notifications).toContain('You travel to forest.');
    });

    it('should handle multiple effects in sequence', () => {
      const character = createMockCharacter();
      const effects: OutcomeEffect[] = [
        { type: 'damage', value: 20 },
        { type: 'gain', resource: 'gold', value: 100 },
        { type: 'flag', flag: 'battle_won', flagValue: true }
      ];

      const result = executeOutcomeEffects(character, effects);

      expect(result.updatedCharacter.currentHP).toBe(30);
      expect(result.updatedCharacter.worldState?.resources?.gold).toBe(100);
      expect(result.updatedCharacter.worldState?.flags?.battle_won).toBe(true);
      expect(result.notifications.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty effects array', () => {
      const character = createMockCharacter();
      const effects: OutcomeEffect[] = [];

      const result = executeOutcomeEffects(character, effects);

      expect(result.updatedCharacter).toEqual(character);
      expect(result.notifications).toEqual([]);
      expect(result.isDead).toBe(false);
    });
  });
});
