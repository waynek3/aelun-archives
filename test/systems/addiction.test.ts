import { describe, it, expect } from 'vitest';
import { growNeed, gainSatisfaction, computeRestingRelaxation } from '../../src/systems/addiction';

describe('growNeed', () => {
  it('increases need by numTickets * needGrowthRate (0.1)', () => {
    expect(growNeed(0, 10)).toBeCloseTo(1.0);
  });

  it('accumulates need across multiple purchases', () => {
    const after1 = growNeed(0, 5);    // 0.5
    const after2 = growNeed(after1, 5); // 1.0
    expect(after2).toBeCloseTo(1.0);
  });

  it('handles zero tickets (no-op)', () => {
    expect(growNeed(3.5, 0)).toBe(3.5);
  });

  it('grows proportionally with ticket count', () => {
    expect(growNeed(0, 1)).toBeCloseTo(0.1);
    expect(growNeed(0, 20)).toBeCloseTo(2.0);
  });
});

describe('gainSatisfaction', () => {
  it('increases satisfaction by numTickets * satisfactionPerTicket (0.05)', () => {
    expect(gainSatisfaction(0, 10)).toBeCloseTo(0.5);
  });

  it('accumulates satisfaction across sessions', () => {
    const after1 = gainSatisfaction(0, 20);   // 1.0
    const after2 = gainSatisfaction(after1, 20); // 2.0
    expect(after2).toBeCloseTo(2.0);
  });

  it('handles zero tickets (no-op)', () => {
    expect(gainSatisfaction(5.0, 0)).toBe(5.0);
  });

  it('grows proportionally with session size', () => {
    expect(gainSatisfaction(0, 1)).toBeCloseTo(0.05);
    expect(gainSatisfaction(0, 40)).toBeCloseTo(2.0);
  });
});

describe('computeRestingRelaxation', () => {
  it('returns base (50) when need is 0', () => {
    expect(computeRestingRelaxation(0)).toBe(50);
  });

  it('returns base (50) when need is below 1 (level 0)', () => {
    expect(computeRestingRelaxation(0.9)).toBe(50);
  });

  it('applies penalty of 2 per level at need=1 (level 1 → 48)', () => {
    expect(computeRestingRelaxation(1.0)).toBe(48);
  });

  it('applies penalty correctly at need=5 (level 5 → 40)', () => {
    expect(computeRestingRelaxation(5.0)).toBe(40);
  });

  it('applies penalty correctly at need=10 (level 10 → 30)', () => {
    expect(computeRestingRelaxation(10.0)).toBe(30);
  });

  it('floors at 0 when penalty exceeds base (need=25 → level 25 → 50-50=0)', () => {
    expect(computeRestingRelaxation(25.0)).toBe(0);
  });

  it('floors at 0 when need is very high', () => {
    expect(computeRestingRelaxation(100.0)).toBe(0);
  });

  it('uses floor of need, not round (need=1.9 is still level 1)', () => {
    expect(computeRestingRelaxation(1.9)).toBe(48);
  });
});
