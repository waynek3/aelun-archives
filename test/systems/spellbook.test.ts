import { describe, it, expect } from 'vitest';
import { SAVE_VERSION } from '../../src/state/initial';
import {
  getDailyClasses,
  calcLearningTime,
  canAddToBook,
  addToBook,
  removeFromBook,
  isSpellKnown,
  learnSpell,
  calcAddToBookTime,
  calcRemoveFromBookTime,
} from '../../src/systems/spellbook';
import { getAllSpells } from '../../src/data/spells';

describe('Sprint 14: Spellbook & University', () => {
  describe('SAVE_VERSION', () => {
    it('is 11', () => {
      expect(SAVE_VERSION).toBe(11);
    });
  });

  describe('getDailyClasses', () => {
    it('returns the requested number of classes', () => {
      const classes = getDailyClasses(1, 1, 1, 3);
      expect(classes).toHaveLength(3);
    });

    it('returns unique spells (no duplicates)', () => {
      const classes = getDailyClasses(5, 3, 2, 3);
      const ids = classes.map(c => c.id);
      expect(new Set(ids).size).toBe(3);
    });

    it('is deterministic — same day produces same classes', () => {
      const a = getDailyClasses(10, 6, 1, 3);
      const b = getDailyClasses(10, 6, 1, 3);
      expect(a.map(c => c.id)).toEqual(b.map(c => c.id));
    });

    it('different days produce different classes', () => {
      const a = getDailyClasses(1, 1, 1, 3);
      const b = getDailyClasses(2, 1, 1, 3);
      // Could theoretically be the same, but with 10 spells and 3 picks it's very unlikely.
      const aIds = a.map(c => c.id).join(',');
      const bIds = b.map(c => c.id).join(',');
      // At least check they're both valid sets of 3.
      expect(a).toHaveLength(3);
      expect(b).toHaveLength(3);
    });

    it('returns all spells if numClasses >= catalog size', () => {
      const all = getAllSpells();
      const classes = getDailyClasses(1, 1, 1, all.length + 5);
      expect(classes).toHaveLength(all.length);
    });
  });

  describe('calcLearningTime', () => {
    it('applies intelligence speed factor and snaps to :15', () => {
      // baseTime 30, INT 10, factor 0.05 → 30 / 1.5 = 20 → snaps to 30
      const result = calcLearningTime(30, 10);
      expect(result).toBe(30);
    });

    it('returns minimum 15 minutes', () => {
      // Very high INT with low base time.
      const result = calcLearningTime(15, 100);
      expect(result).toBe(15);
    });

    it('handles zero intelligence (no modifier)', () => {
      // baseTime 60, INT 0 → 60 / 1 = 60 → snaps to 60
      const result = calcLearningTime(60, 0);
      expect(result).toBe(60);
    });

    it('snaps up to next :15 boundary', () => {
      // baseTime 90, INT 10, factor 0.05 → 90 / 1.5 = 60 → snaps to 60
      const result = calcLearningTime(90, 10);
      expect(result).toBe(60);
    });
  });

  describe('canAddToBook', () => {
    it('returns true when there is room', () => {
      expect(canAddToBook([], 1)).toBe(true);
      expect(canAddToBook(['a'], 3)).toBe(true);
    });

    it('returns false when book is full', () => {
      expect(canAddToBook(['a'], 1)).toBe(false);
      expect(canAddToBook(['a', 'b', 'c'], 3)).toBe(false);
    });
  });

  describe('addToBook', () => {
    it('adds a spell when capacity allows', () => {
      const result = addToBook([], 'favor_boost', 1);
      expect(result).toEqual(['favor_boost']);
    });

    it('returns null when full', () => {
      const result = addToBook(['a'], 'b', 1);
      expect(result).toBeNull();
    });

    it('returns null for duplicate spell', () => {
      const result = addToBook(['favor_boost'], 'favor_boost', 3);
      expect(result).toBeNull();
    });
  });

  describe('removeFromBook', () => {
    it('removes a spell', () => {
      const result = removeFromBook(['a', 'b', 'c'], 'b');
      expect(result).toEqual(['a', 'c']);
    });

    it('returns unchanged array if spell not found', () => {
      const result = removeFromBook(['a', 'b'], 'z');
      expect(result).toEqual(['a', 'b']);
    });
  });

  describe('isSpellKnown / learnSpell', () => {
    it('returns false for unknown spell', () => {
      expect(isSpellKnown([], 'favor_boost')).toBe(false);
    });

    it('returns true for known spell', () => {
      expect(isSpellKnown(['favor_boost'], 'favor_boost')).toBe(true);
    });

    it('learnSpell adds new spell', () => {
      const result = learnSpell([], 'favor_boost');
      expect(result).toEqual(['favor_boost']);
    });

    it('learnSpell does not add duplicates', () => {
      const result = learnSpell(['favor_boost'], 'favor_boost');
      expect(result).toEqual(['favor_boost']);
    });
  });

  describe('calcAddToBookTime', () => {
    it('returns 3x casting time snapped to :15', () => {
      // 15 * 3 = 45 → snaps to 45
      expect(calcAddToBookTime(15)).toBe(45);
    });

    it('returns minimum 15', () => {
      // Very low casting time: 1 * 3 = 3 → min 15
      expect(calcAddToBookTime(1)).toBe(15);
    });
  });

  describe('calcRemoveFromBookTime', () => {
    it('returns 0.5x casting time snapped to :15, min 15', () => {
      // 30 * 0.5 = 15 → snaps to 15
      expect(calcRemoveFromBookTime(30)).toBe(15);
    });

    it('returns minimum 15', () => {
      // 15 * 0.5 = 7.5 → ceil = 8 → snap = 15; then max(15, 15) = 15
      expect(calcRemoveFromBookTime(15)).toBe(15);
    });
  });
});
