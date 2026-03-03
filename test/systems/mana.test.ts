import { describe, it, expect } from 'vitest';
import { applyManaSpend, applyManaRestore } from '../../src/systems/mana';

describe('applyManaSpend', () => {
  it('reduces mana by the given amount', () => {
    expect(applyManaSpend(20, 5)).toBe(15);
  });

  it('floors at 0 when spending more than available', () => {
    expect(applyManaSpend(3, 10)).toBe(0);
  });

  it('returns 0 when spending exactly the remaining amount', () => {
    expect(applyManaSpend(5, 5)).toBe(0);
  });

  it('handles zero spend', () => {
    expect(applyManaSpend(20, 0)).toBe(20);
  });
});

describe('applyManaRestore', () => {
  it('increases mana by the given amount', () => {
    expect(applyManaRestore(10, 5, 30)).toBe(15);
  });

  it('caps at maxMana when restoring beyond capacity', () => {
    expect(applyManaRestore(25, 10, 30)).toBe(30);
  });

  it('returns maxMana when already at max', () => {
    expect(applyManaRestore(30, 5, 30)).toBe(30);
  });

  it('handles zero restore', () => {
    expect(applyManaRestore(20, 0, 30)).toBe(20);
  });

  it('handles restore from 0', () => {
    expect(applyManaRestore(0, 15, 30)).toBe(15);
  });
});
