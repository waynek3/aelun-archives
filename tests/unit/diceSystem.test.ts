import { describe, it, expect } from 'vitest'
import { rollDie, rollAdvantageDice, rollBonusDice, calculateTotal, checkCritical, rollDicePool } from '@/lib/engine/diceSystem'
import type { Die, DicePool } from '@/types'

describe('diceSystem', () => {
  describe('rollDie', () => {
    it('should roll a single die', () => {
      const result = rollDie(6)
      
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(6)
    })

    it('should handle different die sizes', () => {
      const d4Result = rollDie(4)
      const d8Result = rollDie(8)
      const d12Result = rollDie(12)
      
      expect(d4Result).toBeGreaterThanOrEqual(1)
      expect(d4Result).toBeLessThanOrEqual(4)
      
      expect(d8Result).toBeGreaterThanOrEqual(1)
      expect(d8Result).toBeLessThanOrEqual(8)
      
      expect(d12Result).toBeGreaterThanOrEqual(1)
      expect(d12Result).toBeLessThanOrEqual(12)
    })
  })

  describe('rollAdvantageDice', () => {
    it('should roll multiple dice and keep highest', () => {
      const result = rollAdvantageDice(2)
      
      expect(result.rolls).toHaveLength(2)
      expect(result.kept).toBeGreaterThanOrEqual(1)
      expect(result.kept).toBeLessThanOrEqual(20)
      expect(result.kept).toBe(Math.max(...result.rolls))
    })

    it('should handle single die', () => {
      const result = rollAdvantageDice(1)
      
      expect(result.rolls).toHaveLength(1)
      expect(result.kept).toBe(result.rolls[0])
    })
  })

  describe('rollBonusDice', () => {
    it('should roll bonus dice', () => {
      const dice: Die[] = [
        { faces: 6, source: 'Strength' },
        { faces: 4, source: 'Trait' }
      ]

      const result = rollBonusDice(dice)
      
      expect(result).toHaveLength(2)
      expect(result[0].die).toBe(dice[0])
      expect(result[0].result).toBeGreaterThanOrEqual(1)
      expect(result[0].result).toBeLessThanOrEqual(6)
      expect(result[1].die).toBe(dice[1])
      expect(result[1].result).toBeGreaterThanOrEqual(1)
      expect(result[1].result).toBeLessThanOrEqual(4)
    })

    it('should handle empty dice array', () => {
      const result = rollBonusDice([])
      expect(result).toHaveLength(0)
    })
  })

  describe('calculateTotal', () => {
    it('should calculate total from kept roll and bonus results', () => {
      const keptRoll = 15
      const bonusResults = [
        { die: { faces: 6, source: 'Strength' }, result: 4 },
        { die: { faces: 4, source: 'Trait' }, result: 2 }
      ]

      const total = calculateTotal(keptRoll, bonusResults)
      
      expect(total).toBe(21) // 15 + 4 + 2
    })

    it('should handle no bonus results', () => {
      const keptRoll = 15
      const total = calculateTotal(keptRoll, [])
      
      expect(total).toBe(15)
    })
  })

  describe('checkCritical', () => {
    it('should detect critical success', () => {
      const result = checkCritical(25, 10)
      
      expect(result.criticalSuccess).toBe(true)
      expect(result.criticalFailure).toBe(false)
    })

    it('should detect critical failure', () => {
      const result = checkCritical(0, 10)
      
      expect(result.criticalSuccess).toBe(false)
      expect(result.criticalFailure).toBe(true)
    })

    it('should handle normal success', () => {
      const result = checkCritical(15, 10)
      
      expect(result.criticalSuccess).toBe(false)
      expect(result.criticalFailure).toBe(false)
    })

    it('should handle normal failure', () => {
      const result = checkCritical(8, 10)
      
      expect(result.criticalSuccess).toBe(false)
      expect(result.criticalFailure).toBe(false)
    })
  })

  describe('rollDicePool', () => {
    it('should roll a complete dice pool', () => {
      const pool: DicePool = {
        advantageDice: 2,
        bonusDice: [
          { faces: 6, source: 'Strength' },
          { faces: 4, source: 'Trait' }
        ]
      }

      const result = rollDicePool(pool, 10)
      
      expect(result).toBeDefined()
      expect(result.advantageRolls).toHaveLength(2)
      expect(result.keptRoll).toBeGreaterThanOrEqual(1)
      expect(result.keptRoll).toBeLessThanOrEqual(20)
      expect(result.bonusRolls).toHaveLength(2)
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.criticalSuccess).toBeDefined()
      expect(result.criticalFailure).toBeDefined()
    })

    it('should handle empty dice pool', () => {
      const pool: DicePool = {
        advantageDice: 0,
        bonusDice: []
      }

      const result = rollDicePool(pool, 10)
      
      expect(result).toBeDefined()
      expect(result.advantageRolls).toHaveLength(0)
      expect(result.keptRoll).toBe(-Infinity) // Math.max() on empty array returns -Infinity
      expect(result.bonusRolls).toHaveLength(0)
      expect(result.total).toBe(-Infinity)
    })
  })
})