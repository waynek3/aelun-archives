import { describe, it, expect } from 'vitest'
import { rollDie, rollAdvantageDice, rollBonusDice, calculateTotal, checkCritical, rollDicePool } from '@/lib/engine/diceSystem'

describe('diceSystem', () => {
  it('rollDie returns value in range', () => {
    const v = rollDie(6)
    expect(v).toBeGreaterThanOrEqual(1)
    expect(v).toBeLessThanOrEqual(6)
  })

  it('rollAdvantageDice keeps highest', () => {
    const { rolls, kept } = rollAdvantageDice(3)
    expect(rolls.length).toBe(3)
    expect(kept).toBe(Math.max(...rolls))
  })

  it('rollBonusDice matches input length', () => {
    const results = rollBonusDice([{ faces: 4, source: 'test' }, { faces: 6, source: 'test' }])
    expect(results.length).toBe(2)
    for (const r of results) {
      expect(r.result).toBeGreaterThanOrEqual(1)
      expect(r.result).toBeLessThanOrEqual(r.die.faces)
    }
  })

  it('calculateTotal sums kept and bonus', () => {
    const total = calculateTotal(10, [{ die: { faces: 4, source: 'x' }, result: 3 }])
    expect(total).toBe(13)
  })

  it('checkCritical flags extremes', () => {
    const dc = 10
    expect(checkCritical(21, dc).criticalSuccess).toBe(true)
    expect(checkCritical(-5, dc).criticalFailure).toBe(true)
  })

  it('rollDicePool returns consistent shape', () => {
    const res = rollDicePool({ advantageDice: 2, bonusDice: [{ faces: 4, source: 'x' }] }, 10)
    expect(res.advantageRolls.length).toBe(2)
    expect(typeof res.keptRoll).toBe('number')
    expect(res.bonusRolls.length).toBe(1)
    expect(typeof res.total).toBe('number')
  })
})
